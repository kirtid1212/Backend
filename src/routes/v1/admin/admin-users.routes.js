const express = require('express');
const adminUsersController = require('../../../controllers/admin/admin-users.controller');
const { authenticate, requireAdmin } = require('../../../middleware/auth.middleware');

const router = express.Router();

// All routes require authentication and admin role
router.use(authenticate, requireAdmin);

// Get all admin users
router.get('/', adminUsersController.getAllAdmins);

// Get admin statistics
router.get('/stats', adminUsersController.getAdminStats);

// Create new admin
router.post('/', adminUsersController.createAdmin);

// Get admin details
router.get('/:adminId', adminUsersController.getAdminDetails);

// Get admin activity
router.get('/:adminId/activity', adminUsersController.getAdminActivity);

// Update admin
router.patch('/:adminId', adminUsersController.updateAdmin);

// Change admin password
router.post('/:adminId/change-password', adminUsersController.changeAdminPassword);

// Toggle admin status
router.patch('/:adminId/status', adminUsersController.toggleAdminStatus);

// Delete admin
router.delete('/:adminId', adminUsersController.deleteAdmin);

module.exports = router;
