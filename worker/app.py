import os
import sys
import time
import logging
import threading
from datetime import datetime

from bson import ObjectId
from pymongo import MongoClient
from redis import Redis
from dotenv import load_dotenv

load_dotenv()

logging.basicConfig(stream=sys.stdout, level=logging.INFO, format="%(message)s")

REDIS_URL = os.getenv("REDIS_URL")
MONGO_URI = os.getenv("MONGO_URI")
REDIS_STREAM = os.getenv("REDIS_STREAM", "task_stream")
CONSUMER_GROUP = os.getenv("REDIS_CONSUMER_GROUP", "workers")
CONSUMER_NAME = os.getenv("REDIS_CONSUMER_NAME", "worker-1")

if not REDIS_URL or not MONGO_URI:
  raise RuntimeError("Missing REDIS_URL or MONGO_URI")

def build_mongo_uri(raw_uri, db_name):
  base = raw_uri.split("?")[0]
  return base + "/" + db_name

redis = Redis.from_url(REDIS_URL, decode_responses=True)
mongo_uri = build_mongo_uri(MONGO_URI, "test")
logging.info("Worker MongoDB URI: %s", mongo_uri[:70])

try:
    mongo = MongoClient(mongo_uri, serverSelectionTimeoutMS=10000)
    mongo.admin.command("ping")
    db = mongo["test"]
    tasks = db.tasks
    logging.info("Worker connected to MongoDB test.tasks successfully")
except Exception as exc:
    logging.info("Worker MongoDB connection failed: %s", exc)
    raise

def ensure_group():
  try:
    redis.xgroup_create(REDIS_STREAM, CONSUMER_GROUP, id="0", mkstream=True)
  except Exception as exc:
    if "BUSYGROUP" not in str(exc):
      raise

def compute(operation, input_text):
  if operation == "uppercase":
    return input_text.upper()
  if operation == "lowercase":
    return input_text.lower()
  if operation == "reverse":
    return "".join(reversed(input_text))
  if operation == "word_count":
    return str(len([w for w in input_text.strip().split() if w]))
  raise ValueError(f"Unsupported operation: {operation}")

def update_task(task_id, data):
  tasks.update_one({"_id": ObjectId(task_id)}, {"$set": data})

def append_log(task_id, message):
  tasks.update_one({"_id": ObjectId(task_id)}, {"$push": {"logs": message}})

def process_message(message_id, fields):
  task_id = fields.get("taskId")
  operation = fields.get("operation")
  input_text = fields.get("inputText")

  if not task_id:
    return

  logging.info("Processing task: %s", task_id)
  append_log(task_id, f"Started at {datetime.utcnow().isoformat()}Z")
  update_task(task_id, {"status": "running", "error": ""})

  try:
    result = compute(operation, input_text or "")
    update_task(task_id, {
      "status": "success",
      "result": result,
      "error": "",
      "updatedAt": datetime.utcnow()
    })
    append_log(task_id, "Completed successfully")
    logging.info("Task %s completed: %s", task_id, result)
  except Exception as exc:
    logging.info("Task %s failed: %s", task_id, exc)
    update_task(task_id, {
      "status": "failed",
      "error": str(exc),
      "updatedAt": datetime.utcnow()
    })
    append_log(task_id, f"Failed: {exc}")

from http.server import BaseHTTPRequestHandler, HTTPServer

class HealthHandler(BaseHTTPRequestHandler):
    def do_GET(self):
        self.send_response(200)
        self.send_header("Content-type", "text/plain")
        self.end_headers()
        self.wfile.write(b"Worker is alive!")

def run_worker():
  logging.info("Worker thread started. Connecting to Redis...")
  ensure_group()
  logging.info("Worker connected to Redis stream. Listening for tasks...")
  while True:
    try:
      resp = redis.xreadgroup(
        groupname=CONSUMER_GROUP,
        consumername=CONSUMER_NAME,
        streams={REDIS_STREAM: ">"},
        count=1,
        block=5000
      )
      if not resp:
        continue
      for _, messages in resp:
        for message_id, fields in messages:
          logging.info("Received task: %s", message_id)
          process_message(message_id, fields)
          redis.xack(REDIS_STREAM, CONSUMER_GROUP, message_id)
    except Exception as exc:
      logging.info("Worker error: %s", exc)
      time.sleep(3)

def run_server():
    port = int(os.getenv("PORT", 10000))
    server = HTTPServer(("0.0.0.0", port), HealthHandler)
    logging.info("Dummy web server listening on port %d", port)
    server.serve_forever()

if __name__ == "__main__":
  logging.info("Starting application...")
  worker_thread = threading.Thread(target=run_worker, daemon=True)
  worker_thread.start()
  run_server()