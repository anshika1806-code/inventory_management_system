const Product = require('../models/Product');
const asyncHandler = require('../middleware/asyncHandler');

const ALLOWED_FIELDS = ['name', 'sku', 'category', 'price', 'quantity', 'reorderLevel', 'supplier'];
const SORTABLE_FIELDS = ['name', 'sku', 'category', 'price', 'quantity', 'reorderLevel', 'supplier', 'createdAt', 'updatedAt'];

const pick = (obj, keys) =>
  keys.reduce((acc, k) => (obj[k] !== undefined ? { ...acc, [k]: obj[k] } : acc), {});

const str = (v) => (typeof v === 'string' && v.trim() !== '' ? v.trim() : undefined);
const num = (v) => (str(v) !== undefined && !Number.isNaN(Number(v)) ? Number(v) : undefined);
const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const httpError = (statusCode, message) => {
  const err = new Error(message);
  err.statusCode = statusCode;
  return err;
};

// POST /api/products
exports.createProduct = asyncHandler(async (req, res) => {
  const product = await Product.create(pick(req.body || {}, ALLOWED_FIELDS));
  res.status(201).json(product);
});

// GET /api/products?category=&supplier=&search=&minPrice=&maxPrice=&inStock=&sort=&page=&limit=
exports.getProducts = asyncHandler(async (req, res) => {
  const { category, supplier, search, minPrice, maxPrice, inStock, sort, page, limit } = req.query;
  const filter = {};

  if (str(category)) filter.category = new RegExp(`^${escapeRegex(str(category))}$`, 'i');
  if (str(supplier)) filter.supplier = new RegExp(`^${escapeRegex(str(supplier))}$`, 'i');

  if (str(search)) {
    const rx = new RegExp(escapeRegex(str(search)), 'i');
    filter.$or = [{ name: rx }, { sku: rx }];
  }

  const price = {};
  if (num(minPrice) !== undefined) price.$gte = num(minPrice);
  if (num(maxPrice) !== undefined) price.$lte = num(maxPrice);
  if (Object.keys(price).length) filter.price = price;

  if (inStock === 'true') filter.quantity = { $gt: 0 };
  if (inStock === 'false') filter.quantity = 0;

  // Sorting: ?sort=price,-name  (prefix "-" = descending)
  let sortBy = '-createdAt';
  if (str(sort)) {
    const fields = str(sort)
      .split(',')
      .map((f) => f.trim())
      .filter((f) => SORTABLE_FIELDS.includes(f.replace(/^-/, '')));
    if (fields.length) sortBy = fields.join(' ');
  }

  // Pagination
  const pageNum = Math.max(parseInt(page, 10) || 1, 1);
  const limitNum = Math.min(Math.max(parseInt(limit, 10) || 10, 1), 100);
  const skip = (pageNum - 1) * limitNum;

  const [total, products] = await Promise.all([
    Product.countDocuments(filter),
    Product.find(filter).sort(sortBy).skip(skip).limit(limitNum),
  ]);

  res.json({
    success: true,
    total,
    page: pageNum,
    totalPages: Math.ceil(total / limitNum),
    count: products.length,
    products,
  });
});

// GET /api/products/:id
exports.getProductById = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) throw httpError(404, 'Product not found');
  res.json(product);
});

// PUT /api/products/:id  (partial update of product details)
exports.updateProduct = asyncHandler(async (req, res) => {
  const updates = pick(req.body || {}, ALLOWED_FIELDS);
  const product = await Product.findByIdAndUpdate(req.params.id, updates, {
    new: true,
    runValidators: true,
  });
  if (!product) throw httpError(404, 'Product not found');
  res.json(product);
});


// DELETE /api/products/:id
exports.deleteProduct = asyncHandler(async (req, res) => {
  const product = await Product.findByIdAndDelete(req.params.id);
  if (!product) throw httpError(404, 'Product not found');
  res.json({ message: 'Product deleted', id: product.id });
});

// GET /api/products/low-stock  (quantity <= reorderLevel) - aggregation
exports.getLowStock = asyncHandler(async (req, res) => {
  const lowStockItems = await Product.aggregate([
    { $match: { $expr: { $lte: ['$quantity', '$reorderLevel'] } } },
    {
      $addFields: {
        stockValue: { $multiply: ['$price', '$quantity'] },
        id: { $toString: '$_id' },
      },
    },
    { $sort: { quantity: 1 } },
  ]);

  res.json({ count: lowStockItems.length, lowStockItems });
});

// GET /api/products/summary  (category-wise inventory summary) - aggregation
exports.getCategorySummary = asyncHandler(async (req, res) => {
  const summary = await Product.aggregate([
    {
      $group: {
        _id: '$category',
        totalItems: { $sum: 1 },
        totalQuantity: { $sum: '$quantity' },
        totalStockValue: { $sum: { $multiply: ['$price', '$quantity'] } },
        avgPrice: { $avg: '$price' },
      },
    },
    { $addFields: { avgPrice: { $round: ['$avgPrice', 2] } } },
    { $sort: { totalStockValue: -1 } },
  ]);

  res.json({ categories: summary.length, summary });
});
