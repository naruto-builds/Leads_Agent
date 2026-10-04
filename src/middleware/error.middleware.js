export function notFound(_req, res) {
  res.status(404).json({ error: 'not_found' });
}

export function errorHandler(err, _req, res, next) {
  if (res.headersSent) return next(err);
  const status = err.status || 500;
  console.error('Request error:', err.message);
  res.status(status).json({
    error: status === 500 ? 'internal_error' : err.message,
  });
}