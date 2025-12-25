const TryCatch = (handler) => {
  return async (req, res, next) => {
    try {
      await handler(req, res, next);
    } catch (error) {
      // Check if headers have already been sent to the client
      if (res.headersSent) {
        // If headers already sent, just log the error and return
        console.error("Error after headers sent:", error.message);
        return;
      }
      // Otherwise send the error response
      res.status(500).json({
        message: error.message,
      });
    }
  };
};

export default TryCatch;
