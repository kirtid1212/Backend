const express = require('express');
const AddressController = require('../controllers/addressController');
const authenticateToken = (req, res, next) => {
  req.user = { id: 'USER_1001' }; // fake user
  next();
};

const { rateLimitAddressCreation } = require('../middleware/rateLimit');

const router = express.Router();

// Apply authentication to all address routes
router.use('/addresses', authenticateToken);

// GET /api/addresses - Get all addresses for user
router.get('/addresses', AddressController.getAllAddresses);

// POST /api/addresses - Create new address
router.post('/addresses', rateLimitAddressCreation, AddressController.createAddress);

// PUT /api/addresses/:id - Update address
router.put('/addresses/:id', AddressController.updateAddress);

// DELETE /api/addresses/:id - Delete address
router.delete('/addresses/:id', AddressController.deleteAddress);

// PUT /api/addresses/:id/set-default - Set default address
router.put('/addresses/:id/set-default', AddressController.setDefaultAddress);

module.exports = router;