const errorHandler = (err, req, res, next) => {
  console.error('[v0] Error:', err);

  // Prisma validation error
  if (err.code === 'P2002') {
    return res.status(400).json({ error: 'Unique constraint failed' });
  }

  // Prisma not found error
  if (err.code === 'P2025') {
    return res.status(404).json({ error: 'Record not found' });
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({ error: 'Invalid token' });
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({ error: 'Token expired' });
  }

  // Default error
  return res.status(err.status || 500).json({
    error: err.message || 'Internal server error'
  });
};

module.exports = { errorHandler };
