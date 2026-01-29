const mongoose = require('mongoose');
const User = require('../models/User');

/**
 * GET /api/v1/me
 * Get logged-in user's profile
 */
const getProfile = async (req, res) => {
  try {
    // Safe userId extraction
    const userId = req.user && req.user.id;

    // Validate userId before DB call
    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized'
      });
    }

    // Safe DB query (prevents CastError)
    const user = await User.findOne({ _id: userId }).select(
      'name email phone role'
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Success response
    res.status(200).json({
      success: true,
      data: user
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch profile'
    });
  }
};

const updateProfile = async (req, res) => {
  try {
    const userId = req.user && req.user.id;

    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized'
      });
    }

    const allowedFields = ['name', 'phone'];
    const updates = {};

    allowedFields.forEach(field => {
      if (req.body[field]) updates[field] = req.body[field];
    });

    const user = await User.findByIdAndUpdate(
      userId,
      updates,
      { new: true, runValidators: true }
    ).select('name email phone role');

    res.status(200).json({
      success: true,
      data: user
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to update profile'
    });
  }
};

module.exports = {
  getProfile,
  updateProfile
};


module.exports = {
  getProfile
};