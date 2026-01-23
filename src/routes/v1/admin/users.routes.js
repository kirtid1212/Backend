const express = require('express');
const adminUserController = require('../../../controllers/admin/user.controller');

const router = express.Router();

// Get all users/customers
router.get('/users', adminUserController.listUsers);

// Get user statistics
router.get('/users/stats', adminUserController.getUserStats);

// Get single user
router.get('/users/:userId', adminUserController.getUser);

// Get user's orders
router.get('/users/:userId/orders', adminUserController.getUserOrders);

// Update user
router.patch('/users/:userId', adminUserController.updateUser);

// Update user status (active/blocked)
router.patch('/users/:userId/status', adminUserController.updateUserStatus);

// Delete user
router.delete('/users/:userId', adminUserController.deleteUser);

module.exports = router;

