// Validates body for PATCH /:id/stock  ->  { "change": 10 } or { "change": -3 }
module.exports = (req, res, next) => {
  const { change } = req.body || {};
  if (typeof change !== 'number' || !Number.isInteger(change) || change === 0) {
    return res.status(400).json({
      success: false,
      message: '"change" must be a non-zero integer (positive = restock, negative = sale)',
    });
  }
  next();
};
