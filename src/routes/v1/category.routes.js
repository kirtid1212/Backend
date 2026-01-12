const express = require('express');
const categoryController = require('../../controllers/category.controller');

const router = express.Router();

router.get('/', categoryController.listCategories);
router.get('/:categoryId', categoryController.getCategory);

module.exports = router;
