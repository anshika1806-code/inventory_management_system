const express = require('express');
const ctrl = require('../controllers/productController');
const validateObjectId = require('../middleware/validateObjectId');
const validateStockChange = require('../middleware/validateStockChange');

const router = express.Router();

// Static routes MUST be declared before "/:id"
router.get('/low-stock', ctrl.getLowStock);
router.get('/summary', ctrl.getCategorySummary);

router.route('/').get(ctrl.getProducts).post(ctrl.createProduct);

router
  .route('/:id')
  .get(validateObjectId, ctrl.getProductById)
  .put(validateObjectId, ctrl.updateProduct)
  .delete(validateObjectId, ctrl.deleteProduct);

router.patch('/:id/stock', validateObjectId, validateStockChange, ctrl.adjustStock);

module.exports = router;
