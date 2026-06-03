const errorHandler = (err, req, res, next) => {
  console.error(err.stack);

  const isDev = process.env.NODE_ENV === "development";
if (error.name === "ValidationError") 
{
  return res.status(400).json({
    error:Object.values(error.errors).map(e => e.message).join(", ")
  })
}
  if (error.name === "CastError")
  {
return res.status(400).json({
      error: "Invalid ID format"
    });
  }
if (error.code === "11000")
{
return res.status(400).json({
      error: "Duplicate value found"
    });
}
  res.status(err.status || 500).json({
    error: err.message || "Internal Server Error",
    ...(isDev && { stack: err.stack }),
  });
};

module.exports = errorHandler;
