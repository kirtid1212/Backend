const express = require('express');
const customersController = require('../../../controllers/admin/customers.controller');
const { authenticate, requireAdmin } = require('../../../middleware/auth.middleware');

const router = express.Router();

// All routes require authentication and admin role
router.use(authenticate, requireAdmin);

// Get all customers
router.get('/', customersController.getAllCustomers);

// Get customer statistics
router.get('/stats', customersController.getCustomerStats);

// Get customer details
router.get('/:customerId', customersController.getCustomerDetails);

// Get customer orders
router.get('/:customerId/orders', customersController.getCustomerOrders);

// Update customer
router.patch('/:customerId', customersController.updateCustomer);

// Toggle customer status
router.patch('/:customerId/status', customersController.toggleCustomerStatus);

// Delete customer
router.delete('/:customerId', customersController.deleteCustomer);

module.exports = router;
