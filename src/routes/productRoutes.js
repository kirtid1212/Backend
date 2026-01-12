const express = require('express');
const ProductController = require('../controllers/productController');

const router = express.Router();

router.get('/products', ProductController.getAllProducts);
router.get('/products/search', ProductController.searchProducts);
router.get('/products/category/:categoryId', ProductController.getProductsByCategory);
router.get('/products/:id', ProductController.getProductById);

module.exports = router;