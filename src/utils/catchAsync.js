// src/utils/catchAsync.js
module.exports = (fn) => {
  return (req, res, next) => {
    // Ensure both sync throws and rejected promises are forwarded to next()
    try {
      const maybePromise = fn(req, res, next);
      // If it's a promise, attach catch
      if (maybePromise && typeof maybePromise.catch === 'function') {
        maybePromise.catch(next);
      }
    } catch (err) {
      next(err);
    }
  };
};
