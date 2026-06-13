/**
 * Wrap an async route handler so any thrown/rejected error is forwarded
 * to Express' error pipeline (and ultimately our centralized errorHandler).
 */
export const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

export default asyncHandler;
