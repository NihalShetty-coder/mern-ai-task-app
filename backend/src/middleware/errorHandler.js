export function errorHandler(err, req, res, next) {
  console.error("API Error:", err);
  const status = err.status || 500;
  const message = err.message || "Server error";
  res.status(status).json({ message, stack: err.stack });
}
