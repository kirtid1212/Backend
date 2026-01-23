const Review = require('../../models/Review');
const Product = require('../../models/Product');

// List all reviews with pagination
exports.listReviews = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const filter = {};
    
    // Filter by status
    if (req.query.status) {
      filter.status = req.query.status;
    }
    
    // Filter by rating
    if (req.query.rating) {
      filter.rating = parseInt(req.query.rating);
    }

    const reviews = await Review.find(filter)
      .populate('userId', 'name email')
      .populate('productId', 'name image')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Review.countDocuments(filter);

    res.json({
      success: true,
      data: reviews,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Get review statistics
exports.getReviewStats = async (req, res) => {
  try {
    const totalReviews = await Review.countDocuments();
    const avgRating = await Review.aggregate([
      { $group: { _id: null, average: { $avg: '$rating' } } }
    ]);

    const ratingDistribution = await Review.aggregate([
      {
        $group: {
          _id: '$rating',
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: -1 } }
    ]);

    const pendingReviews = await Review.countDocuments({ status: 'pending' });
    const approvedReviews = await Review.countDocuments({ status: 'approved' });
    const rejectedReviews = await Review.countDocuments({ status: 'rejected' });

    res.json({
      success: true,
      data: {
        totalReviews,
        averageRating: avgRating[0]?.average?.toFixed(1) || 0,
        ratingDistribution: ratingDistribution.map(r => ({
          rating: r._id,
          count: r.count
        })),
        pending: pendingReviews,
        approved: approvedReviews,
        rejected: rejectedReviews
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Get reviews by product
exports.getProductReviews = async (req, res) => {
  try {
    const { productId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const reviews = await Review.find({ productId })
      .populate('userId', 'name')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Review.countDocuments({ productId });

    res.json({
      success: true,
      data: reviews,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Get single review
exports.getReview = async (req, res) => {
  try {
    const review = await Review.findById(req.params.reviewId)
      .populate('userId', 'name email')
      .populate('productId', 'name');

    if (!review) {
      return res.status(404).json({ success: false, error: 'Review not found' });
    }

    res.json({ success: true, data: review });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Approve review
exports.approveReview = async (req, res) => {
  try {
    const review = await Review.findByIdAndUpdate(
      req.params.reviewId,
      { status: 'approved' },
      { new: true }
    );

    if (!review) {
      return res.status(404).json({ success: false, error: 'Review not found' });
    }

    res.json({ success: true, data: review, message: 'Review approved' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Reject review
exports.rejectReview = async (req, res) => {
  try {
    const { reason } = req.body;
    
    const review = await Review.findByIdAndUpdate(
      req.params.reviewId,
      { status: 'rejected', rejectionReason: reason },
      { new: true }
    );

    if (!review) {
      return res.status(404).json({ success: false, error: 'Review not found' });
    }

    res.json({ success: true, data: review, message: 'Review rejected' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Bulk update review status
exports.bulkUpdateStatus = async (req, res) => {
  try {
    const { reviewIds, status } = req.body;

    if (!reviewIds || !status) {
      return res.status(400).json({ success: false, error: 'Missing reviewIds or status' });
    }

    await Review.updateMany(
      { _id: { $in: reviewIds } },
      { status }
    );

    res.json({ success: true, message: `${reviewIds.length} reviews updated to ${status}` });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Delete review
exports.deleteReview = async (req, res) => {
  try {
    const review = await Review.findByIdAndDelete(req.params.reviewId);

    if (!review) {
      return res.status(404).json({ success: false, error: 'Review not found' });
    }

    res.json({ success: true, message: 'Review deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

