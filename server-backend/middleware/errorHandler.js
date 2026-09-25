const notFoundHandler = (req, res, next) => {
  const error = new Error(`Route not found: ${req.originalUrl}`);
  error.statusCode = 404;
  next(error);
};

const errorHandler = (error, req, res, next) => {
  const statusCode = error.statusCode || 500;

  // Keep response messages safe for users and do not expose internal system details.
  const message = statusCode === 500
    ? 'Something went wrong. Please try again later.'
    : error.message;

  res.status(statusCode).json({
    message,
  });
};

module.exports = {
  notFoundHandler,
  errorHandler,
};
