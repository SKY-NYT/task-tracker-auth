const AppError = require("../utils/AppError");

const errorHandler = (err, req, res, next) => {
  let error = err;

  if (err.name === "CastError") {
    error = new AppError("Invalid ID format", 400);
  }

  if (err.name === "ValidationError") {
    const message = Object.values(err.errors)
      .map((e) => e.message)
      .join(", ");
    error = new AppError(message, 400);
  }

  if (err.code === 11000) {
    const field = Object.keys(err.keyValue || {})[0] || "field";
    error = new AppError(`A record with that ${field} already exists`, 409);
  }

  const status = error.status || 500;
  const message = error.message || "Internal Server Error";
  const isDev = process.env.NODE_ENV === "development";

  if (status === 500) {
    console.error(err.stack);
  }

  res.status(status).json({
    success: false,
    error: message,
    ...(isDev && status === 500 && { stack: err.stack }),
  });
};

module.exports = errorHandler;
