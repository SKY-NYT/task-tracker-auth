const logger = (req, res, next) => {
  const timestamp = new Date().toISOString();
  const start = Date.now();

  res.on("finish", () => {
    const duration = Date.now() - start;
    console.log(`[${timestamp}] ${req.method} ${req.originalUrl} -> ${res.statusCode} (${duration}ms)`);
  });

  next();
};

module.exports = logger;
