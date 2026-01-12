const Review = require('../models/Review');
const Order = require('../models/Order');

class ReviewController {
  static async getProductReviews(req, res) {
    try {
      const productId = req.params.productId;
      const { page = 1, limit = 10 } = req.query;

      const reviews = await Review.find({ product_id: productId })
        .populate('product_id', 'name')
        .limit(limit * 1)
        .skip((page - 1) * limit)
        .sort({ createdAt: -1 });

      const total = await Review.countDocuments({ product_id: productId });

      res.json({
        success: true,
        data: reviews,
        pagination: {
          current_page: parseInt(page),
          total_pages: Math.ceil(total / limit),
          total_items: total
        }
      });
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch reviews' });
    }
  }

  static async createReview(req, res) {
    try {
      const userId = req.user.id;
      const { product_id, rating, comment } = req.body;

      if (!product_id || !rating || !comment) {
        return res.status(400).json({ error: 'Product ID, rating, and comment are required' });
      }

      // Check if review already exists
      const existingReview = await Review.findOne({ user_id: userId, product_id });
      if (existingReview) {
        return res.status(400).json({ error: 'Review already exists for this product' });
      }

      const review = new Review({
        user_id: userId,
        product_id,
        rating,
        comment
      });

      await review.save();
      await review.populate('product_id', 'name');

      res.status(201).json({
        success: true,
        data: review,
        message: 'Review created successfully'
      });
    } catch (error) {
      console.error('Review creation error:', error);
      res.status(500).json({ error: 'Failed to create review', details: error.message });
    }
  }

  static async updateReview(req, res) {
    try {
      const userId = req.user.id;
      const reviewId = req.params.id;
      const { rating, comment } = req.body;

      const review = await Review.findOne({ _id: reviewId, user_id: userId });
      if (!review) {
        return res.status(404).json({ error: 'Review not found' });
      }

      if (rating) review.rating = rating;
      if (comment) review.comment = comment;

      await review.save();
      await review.populate('product_id', 'name');

      res.json({
        success: true,
        data: review,
        message: 'Review updated successfully'
      });
    } catch (error) {
      res.status(500).json({ error: 'Failed to update review' });
    }
  }

  static async deleteReview(req, res) {
    try {
      const userId = req.user.id;
      const reviewId = req.params.id;

      const review = await Review.findOneAndDelete({ _id: reviewId, user_id: userId });
      if (!review) {
        return res.status(404).json({ error: 'Review not found' });
      }

      res.json({
        success: true,
        message: 'Review deleted successfully'
      });
    } catch (error) {
      res.status(500).json({ error: 'Failed to delete review' });
    }
  }
}

module.exports = ReviewController;