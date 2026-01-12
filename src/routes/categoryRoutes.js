const express = require('express');
const CategoryController = require('../controllers/categoryController');

const router = express.Router();

router.get('/categories', CategoryController.getAllCategories);

module.exports = router;