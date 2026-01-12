const express = require('express');
const authController = require('../../controllers/auth.controller');
const { authenticate } = require('../../middleware/auth.middleware');

const router = express.Router();

router.post('/otp/send', authController.sendOtp);
router.post('/signup/verify', authController.verifySignup);
router.post('/login/verify', authController.verifyLogin);
router.post('/refresh', authController.refresh);
router.post('/logout', authenticate, authController.logout);

module.exports = router;
