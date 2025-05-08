// Global error handler
const errorHandler = (err, req, res, next) => {
  console.error('Error:', err);

  // Check if it's a Prisma error
  if (err.code && err.code.startsWith('P')) {
    return handlePrismaError(err, res);
  }

  // Default error response
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal server error';
  
  res.status(statusCode).json({
    error: {
      message,
      ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
    },
  });
};

// Handle Prisma-specific errors
const handlePrismaError = (err, res) => {
  let statusCode = 500;
  let message = 'Database error';

  switch (err.code) {
    case 'P2002': // Unique constraint violation
      statusCode = 400;
      message = `Unique constraint violation on field: ${err.meta?.target}`;
      break;
    case 'P2003': // Foreign key constraint violation
      statusCode = 400;
      message = 'Related record not found';
      break;
    case 'P2025': // Record not found
      statusCode = 404;
      message = 'Record not found';
      break;
    default:
      break;
  }

  return res.status(statusCode).json({
    error: {
      message,
      code: err.code,
      ...(process.env.NODE_ENV === 'development' && { 
        meta: err.meta,
        stack: err.stack,
      }),
    },
  });
};

// Not found handler
const notFoundHandler = (req, res) => {
  res.status(404).json({
    error: {
      message: `Route not found: ${req.method} ${req.originalUrl}`,
    },
  });
};

module.exports = {
  errorHandler,
  notFoundHandler,
};

