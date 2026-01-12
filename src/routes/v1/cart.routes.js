const express = require('express');
const { authenticate } = require('../../middleware/auth.middleware');
const cartController = require('../../controllers/cart.controller');

const router = express.Router();

router.use(authenticate);

router.get('/', cartController.getCart);
router.post('/items', cartController.addItem);
router.patch('/items/:itemId', cartController.updateItem);
router.delete('/items/:itemId', cartController.removeItem);
router.delete('/', cartController.clearCart);

module.exports = router;
