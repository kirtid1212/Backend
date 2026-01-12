const express = require('express');
const { authenticate } = require('../../middleware/auth.middleware');
const addressController = require('../../controllers/address.controller');

const router = express.Router();

router.use(authenticate);

router.get('/', addressController.listAddresses);
router.post('/', addressController.createAddress);
router.patch('/:addressId', addressController.updateAddress);
router.delete('/:addressId', addressController.deleteAddress);
router.patch('/:addressId/default', addressController.setDefaultAddress);

module.exports = router;
