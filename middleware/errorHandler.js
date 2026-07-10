const errorHandler = (err, req, res, next) => {
  console.error(err.stack);

  if (err.type === "entity.parse.failed") {
    return res.status(400).json({
      status: "error",
      message: "Invalid JSON in request body",
    });
  }

  if (err.name === "ValidationError") {
    return res.status(400).json({
      status: "error",
      message: Object.values(err.errors).map((e) => e.message).join(", "),
    });
  }

  if (err.name === "CastError") {
    return res.status(400).json({ status: "error", message: "Invalid ID format" });
  }

  if (err.code === 11000) {
    const field = Object.keys(err.keyValue || {})[0] || "field";
    return res.status(409).json({ status: "error", message: `A record with that ${field} already exists` });
  }

  if (err.name === "JsonWebTokenError") {
    return res.status(401).json({ status: "error", message: "Invalid token. Please log in again." });
  }

  if (err.name === "TokenExpiredError") {
    return res.status(401).json({ status: "error", message: "Your token has expired. Please log in again." });
  }

  const isDev = process.env.NODE_ENV === "development";

  res.status(500).json({
    status: "error",
    message: "Internal Server Error",
    ...(isDev && { stack: err.stack }),
  });
};

module.exports = errorHandler;
