const express = require('express');
const authController = require('../../controllers/auth.controller');
const { authenticate } = require('../../middleware/auth.middleware');

const router = express.Router();

router.post('/signup', authController.signup);
router.post('/login', authController.login);
router.post('/refresh', authController.refresh);
router.post('/logout', authenticate, authController.logout);

module.exports = router;
