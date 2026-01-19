const express = require('express');
const reviewsController = require('../../../controllers/admin/reviews.controller');
const { authenticate, requireAdmin } = require('../../../middleware/auth.middleware');

const router = express.Router();

// All routes require authentication and admin role
router.use(authenticate, requireAdmin);

// Get all reviews
router.get('/', reviewsController.getAllReviews);

// Get reviews statistics
router.get('/stats', reviewsController.getReviewsStats);

// Get review details
router.get('/:reviewId', reviewsController.getReviewDetails);

// Get product reviews
router.get('/product/:productId', reviewsController.getProductReviews);

// Approve review
router.patch('/:reviewId/approve', reviewsController.approveReview);

// Reject review
router.patch('/:reviewId/reject', reviewsController.rejectReview);

// Delete review
router.delete('/:reviewId', reviewsController.deleteReview);

// Bulk update reviews
router.patch('/bulk/update-status', reviewsController.bulkUpdateReviewStatus);

module.exports = router;
