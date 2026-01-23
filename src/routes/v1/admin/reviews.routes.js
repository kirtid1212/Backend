const express = require('express');
const adminReviewController = require('../../../controllers/admin/review.controller');

const router = express.Router();

// Get all reviews
router.get('/reviews', adminReviewController.listReviews);

// Get review statistics
router.get('/reviews/stats', adminReviewController.getReviewStats);

// Get reviews by product
router.get('/reviews/product/:productId', adminReviewController.getProductReviews);

// Bulk update review status
router.patch('/reviews/bulk/update-status', adminReviewController.bulkUpdateStatus);

// Get single review
router.get('/reviews/:reviewId', adminReviewController.getReview);

// Approve review
router.patch('/reviews/:reviewId/approve', adminReviewController.approveReview);

// Reject review
router.patch('/reviews/:reviewId/reject', adminReviewController.rejectReview);

// Delete review
router.delete('/reviews/:reviewId', adminReviewController.deleteReview);

module.exports = router;

