export const handleError = (res, error, statusCode = 500, message = null) => {
  res.status(statusCode).json({
    error: message || error.message || "Internal Server Error",
  });
};
