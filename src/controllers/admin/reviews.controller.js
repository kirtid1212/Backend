const Review = require('../../models/Review');
const Product = require('../../models/Product');

/**
 * Get All Reviews (Admin)
 */
exports.getAllReviews = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const status = req.query.status; // 'approved', 'pending', 'rejected'
    const rating = req.query.rating; // Filter by rating

    const skip = (page - 1) * limit;
    let query = {};

    if (status) {
      query.status = status;
    }

    if (rating) {
      query.rating = parseInt(rating);
    }

    const [reviews, total] = await Promise.all([
      Review.find(query)
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 })
        .populate('userId', 'name email')
        .populate('productId', 'name'),
      Review.countDocuments(query)
    ]);

    res.status(200).json({
      success: true,
      data: reviews,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalRecords: total,
        limit
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Get Review Details
 */
exports.getReviewDetails = async (req, res) => {
  try {
    const { reviewId } = req.params;

    const review = await Review.findById(reviewId)
      .populate('userId', 'name email phone')
      .populate('productId', 'name price');

    if (!review) {
      return res.status(404).json({ success: false, message: 'Review not found' });
    }

    res.status(200).json({
      success: true,
      data: review
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Approve Review
 */
exports.approveReview = async (req, res) => {
  try {
    const { reviewId } = req.params;

    const review = await Review.findByIdAndUpdate(
      reviewId,
      { status: 'approved' },
      { new: true }
    ).populate('userId', 'name').populate('productId', 'name');

    if (!review) {
      return res.status(404).json({ success: false, message: 'Review not found' });
    }

    res.status(200).json({
      success: true,
      message: 'Review approved successfully',
      data: review
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Reject Review
 */
exports.rejectReview = async (req, res) => {
  try {
    const { reviewId } = req.params;
    const { reason } = req.body;

    const review = await Review.findByIdAndUpdate(
      reviewId,
      { status: 'rejected', rejectionReason: reason },
      { new: true }
    ).populate('userId', 'name').populate('productId', 'name');

    if (!review) {
      return res.status(404).json({ success: false, message: 'Review not found' });
    }

    res.status(200).json({
      success: true,
      message: 'Review rejected successfully',
      data: review
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Delete Review
 */
exports.deleteReview = async (req, res) => {
  try {
    const { reviewId } = req.params;

    const review = await Review.findByIdAndDelete(reviewId);

    if (!review) {
      return res.status(404).json({ success: false, message: 'Review not found' });
    }

    // Update product rating
    const reviews = await Review.find({ productId: review.productId, status: 'approved' });
    const avgRating = reviews.length > 0
      ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
      : 0;

    await Product.findByIdAndUpdate(
      review.productId,
      { avgRating, reviewCount: reviews.length }
    );

    res.status(200).json({
      success: true,
      message: 'Review deleted successfully'
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Get Reviews Statistics
 */
exports.getReviewsStats = async (req, res) => {
  try {
    const [
      totalReviews,
      approvedReviews,
      pendingReviews,
      rejectedReviews,
      ratingDistribution,
      topRatedProducts
    ] = await Promise.all([
      Review.countDocuments(),
      Review.countDocuments({ status: 'approved' }),
      Review.countDocuments({ status: 'pending' }),
      Review.countDocuments({ status: 'rejected' }),
      Review.aggregate([
        {
          $group: {
            _id: '$rating',
            count: { $sum: 1 }
          }
        },
        { $sort: { _id: 1 } }
      ]),
      Review.aggregate([
        { $match: { status: 'approved' } },
        {
          $group: {
            _id: '$productId',
            avgRating: { $avg: '$rating' },
            reviewCount: { $sum: 1 }
          }
        },
        { $sort: { avgRating: -1 } },
        { $limit: 10 },
        {
          $lookup: {
            from: 'products',
            localField: '_id',
            foreignField: '_id',
            as: 'product'
          }
        },
        { $unwind: '$product' }
      ])
    ]);

    res.status(200).json({
      success: true,
      data: {
        totalReviews,
        approvedReviews,
        pendingReviews,
        rejectedReviews,
        ratingDistribution,
        topRatedProducts
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Get Product Reviews
 */
exports.getProductReviews = async (req, res) => {
  try {
    const { productId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;

    const skip = (page - 1) * limit;

    const [reviews, total] = await Promise.all([
      Review.find({ productId, status: 'approved' })
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 })
        .populate('userId', 'name'),
      Review.countDocuments({ productId, status: 'approved' })
    ]);

    res.status(200).json({
      success: true,
      data: reviews,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalRecords: total,
        limit
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Bulk Update Review Status
 */
exports.bulkUpdateReviewStatus = async (req, res) => {
  try {
    const { reviewIds, status } = req.body;

    if (!Array.isArray(reviewIds) || !status) {
      return res.status(400).json({ success: false, message: 'Invalid request' });
    }

    const result = await Review.updateMany(
      { _id: { $in: reviewIds } },
      { status }
    );

    res.status(200).json({
      success: true,
      message: `${result.modifiedCount} reviews updated successfully`
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
