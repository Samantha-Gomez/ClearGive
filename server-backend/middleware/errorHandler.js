const notFoundHandler = (req, res, next) => {
  const error = new Error(`Route not found: ${req.originalUrl}`);
  error.statusCode = 404;
  next(error);
};

const errorHandler = (error, req, res, next) => {
  const statusCode = error.statusCode || 500;

  // Log unexpected server errors internally for debugging.
  if (statusCode >= 500) {
    console.error('Server error:', error);
  }

  // Never expose internal server details to clients.
  const message =
    statusCode === 500
      ? 'Something went wrong. Please try again later.'
      : error.message || 'Request failed.';

  res.status(statusCode).json({
    message,
  });
};

module.exports = {
  notFoundHandler,
  errorHandler,
};