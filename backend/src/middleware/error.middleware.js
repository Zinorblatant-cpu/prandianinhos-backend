export function errorMiddleware(error, req, res, next) {
  if (res.headersSent) {
    next(error);
    return;
  }

  const hasStructuredError = Number.isInteger(error?.statusCode) && typeof error?.code === 'string';
  const isServerError = !hasStructuredError || error.statusCode >= 500;
  const statusCode = isServerError ? 500 : error.statusCode;

  const payload = {
    error: {
      code: isServerError ? 'INTERNAL_ERROR' : error.code,
      message: isServerError ? 'Internal server error' : error.message,
    },
  };

  if (!isServerError && error.details) {
    payload.error.details = error.details;
  }

  res.status(statusCode).json(payload);
}
