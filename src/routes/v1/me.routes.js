const express = require('express');
const { authenticate } = require('../../middleware/auth.middleware');
const meController = require('../../controllers/me.controller');

const router = express.Router();

router.get('/me', authenticate, meController.getProfile);

module.exports = router;
