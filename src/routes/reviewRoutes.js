const express = require('express');
const ReviewController = require('../controllers/reviewController');

const router = express.Router();

router.get('/reviews/product/:productId', ReviewController.getProductReviews);
router.post('/reviews', ReviewController.createReview);
router.put('/reviews/:id', ReviewController.updateReview);
router.delete('/reviews/:id', ReviewController.deleteReview);

module.exports = router;