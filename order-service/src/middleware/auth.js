/**
 * API key authentication middleware.
 * Validates the X-API-Key header against the configured API key.
 */
const VALID_API_KEY = process.env.API_KEY || "9f2c8a7b4e6d1f3c9a0b2d4e6f8a1c3e5b7d9f2c4a6e8b0d1c3f5a7e9b2d4c6";

function requireApiKey(req, res, next) {
  const key = req.headers["x-api-key"];
  if (!key || key !== VALID_API_KEY) {
    return res.status(401).json({ error: "Unauthorized: invalid or missing API key" });
  }
  next();
}

module.exports = { requireApiKey };
