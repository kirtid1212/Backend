const Review = require('../../models/Review');
const Product = require('../../models/Product');
const User = require('../../models/User');

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

    // Fetch reviews as plain objects to avoid populate issues with String userId
    const reviews = await Review.find(filter)
      .populate('productId', 'name image')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    // Get unique userIds and fetch users
    const userIds = [...new Set(reviews.map(r => r.userId).filter(Boolean))];
    const users = await User.find({ _id: { $in: userIds } }).select('_id name email').lean();
    const userMap = new Map(users.map(u => [u._id.toString(), u]));

    // Transform reviews to include user data (since userId is String, not ObjectId reference)
    const transformedReviews = reviews.map(review => {
      const user = userMap.get(review.userId) || {};
      return {
        ...review,
        user: {
          _id: review.userId,
          name: user.name || 'Unknown User',
          email: user.email || ''
        }
      };
    });

    const total = await Review.countDocuments(filter);

    res.json({
      success: true,
      data: transformedReviews,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error in listReviews:', error);
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

    // Fetch reviews as plain objects
    const reviews = await Review.find({ productId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    // Get unique userIds and fetch users
    const userIds = [...new Set(reviews.map(r => r.userId).filter(Boolean))];
    const users = await User.find({ _id: { $in: userIds } }).select('_id name').lean();
    const userMap = new Map(users.map(u => [u._id.toString(), u]));

    // Transform reviews to include user data
    const transformedReviews = reviews.map(review => {
      const user = userMap.get(review.userId) || {};
      return {
        ...review,
        user: {
          _id: review.userId,
          name: user.name || 'Unknown User'
        }
      };
    });

    const total = await Review.countDocuments({ productId });

    res.json({
      success: true,
      data: transformedReviews,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error in getProductReviews:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// Get single review
exports.getReview = async (req, res) => {
  try {
    // Fetch review as plain object
    const review = await Review.findById(req.params.reviewId)
      .populate('productId', 'name')
      .lean();

    if (!review) {
      return res.status(404).json({ success: false, error: 'Review not found' });
    }

    // Fetch user data separately since userId is String, not ObjectId reference
    const user = await User.findById(review.userId).select('name email').lean();

    // Transform review to include user data
    const transformedReview = {
      ...review,
      user: {
        _id: review.userId,
        name: user?.name || 'Unknown User',
        email: user?.email || ''
      }
    };

    res.json({ success: true, data: transformedReview });
  } catch (error) {
    console.error('Error in getReview:', error);
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

