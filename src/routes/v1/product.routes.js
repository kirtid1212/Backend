const express = require('express');
const productController = require('../../controllers/product.controller');

const router = express.Router();

router.get('/home', productController.getHomeProducts);
router.get('/', productController.listProducts);
router.get('/:productId/related', productController.getRelatedProducts);
router.get('/:productId/availability', productController.getAvailability);
router.get('/:productId', productController.getProductDetails);

module.exports = router;
