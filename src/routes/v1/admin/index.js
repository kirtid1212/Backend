const express = require('express');
const { authenticate, requireAdmin } = require('../../../middleware/auth.middleware');
const adminAuthController = require('../../../controllers/admin/auth.controller');
const adminCategoryController = require('../../../controllers/admin/category.controller');
const adminProductController = require('../../../controllers/admin/product.controller');
const adminOrderController = require('../../../controllers/admin/order.controller');
const meController = require('../../../controllers/me.controller');

const router = express.Router();

router.post('/auth/signup', adminAuthController.signup);
router.post('/auth/login', adminAuthController.login);

router.use(authenticate);
router.use(requireAdmin);

router.get('/me', meController.getProfile);

router.post('/categories', adminCategoryController.createCategory);
router.patch('/categories/:categoryId', adminCategoryController.updateCategory);
router.delete('/categories/:categoryId', adminCategoryController.deleteCategory);
router.post('/categories/:categoryId/image', adminCategoryController.setCategoryImage);

router.post('/products', adminProductController.createProduct);
router.patch('/products/:productId', adminProductController.updateProduct);
router.delete('/products/:productId', adminProductController.deleteProduct);
router.get('/products', adminProductController.listProducts);
router.get('/products/:productId', adminProductController.getProduct);

router.post('/products/:productId/variants', adminProductController.createVariant);
router.patch('/variants/:variantId', adminProductController.updateVariant);
router.delete('/variants/:variantId', adminProductController.deleteVariant);
router.patch('/variants/:variantId/stock', adminProductController.updateVariantStock);

router.post('/products/:productId/images', adminProductController.addProductImages);
router.delete('/products/:productId/images/:imageId', adminProductController.deleteProductImage);

router.get('/orders', adminOrderController.listOrders);
router.get('/orders/:orderId', adminOrderController.getOrder);
router.patch('/orders/:orderId/status', adminOrderController.updateOrderStatus);
router.patch('/orders/:orderId/shipment', adminOrderController.updateShipment);
router.post('/orders/:orderId/refund', adminOrderController.refundOrder);

module.exports = router;
