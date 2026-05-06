import os
import time
from datetime import datetime

from bson import ObjectId
from pymongo import MongoClient
from redis import Redis
from dotenv import load_dotenv

load_dotenv()

REDIS_URL = os.getenv("REDIS_URL")
MONGO_URI = os.getenv("MONGO_URI")
REDIS_STREAM = os.getenv("REDIS_STREAM", "task_stream")
CONSUMER_GROUP = os.getenv("REDIS_CONSUMER_GROUP", "workers")
CONSUMER_NAME = os.getenv("REDIS_CONSUMER_NAME", "worker-1")

if not REDIS_URL or not MONGO_URI:
  raise RuntimeError("Missing REDIS_URL or MONGO_URI")

redis = Redis.from_url(REDIS_URL, decode_responses=True)
mongo = MongoClient(MONGO_URI)
db = mongo.get_default_database()
tasks = db.tasks

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
  except Exception as exc:
    update_task(task_id, {
      "status": "failed",
      "error": str(exc),
      "updatedAt": datetime.utcnow()
    })
    append_log(task_id, f"Failed: {exc}")

def run():
  ensure_group()
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
          process_message(message_id, fields)
          redis.xack(REDIS_STREAM, CONSUMER_GROUP, message_id)
    except Exception as exc:
      print(f"Worker error: {exc}")
      time.sleep(3)

if __name__ == "__main__":
  run()
