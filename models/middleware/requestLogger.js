// middleware/requestLogger.js
export default function requestLogger(req, res, next) {
  const now = new Date().toISOString();
  console.log(`[${now}] ${req.method} ${req.originalUrl} - IP:${req.ip}`);
  // optionally log body for debugging (be careful with secrets)
  // console.log("body:", JSON.stringify(req.body).slice(0, 200));
  next();
}
