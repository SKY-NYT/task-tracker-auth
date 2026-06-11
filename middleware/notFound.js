const notFound = (req, res, next) => {
  const err = new Error(`Route ${req.method} ${req.path} not found`);
  err.status = 404;
  next(err);
};

module.exports = notFound;
