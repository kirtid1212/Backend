const User = require('../../models/User');
const bcrypt = require('bcryptjs');

/**
 * Get All Customers/Users
 */
exports.getAllCustomers = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const search = req.query.search || '';

    const skip = (page - 1) * limit;

    let query = { role: 'user' };

    if (search) {
      query = {
        ...query,
        $or: [
          { name: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } },
          { phone: { $regex: search, $options: 'i' } }
        ]
      };
    }

    const [customers, total] = await Promise.all([
      User.find(query)
        .select('-password')
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 }),
      User.countDocuments(query)
    ]);

    res.status(200).json({
      success: true,
      data: customers,
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
 * Get Customer Details
 */
exports.getCustomerDetails = async (req, res) => {
  try {
    const { customerId } = req.params;

    const customer = await User.findById(customerId)
      .select('-password')
      .lean();

    if (!customer) {
      return res.status(404).json({ success: false, message: 'Customer not found' });
    }

    // Get additional stats
    const Order = require('../../models/Order');
    const Review = require('../../models/Review');

    const [orders, reviews] = await Promise.all([
      Order.find({ userId: customerId }).countDocuments(),
      Review.find({ userId: customerId }).countDocuments()
    ]);

    res.status(200).json({
      success: true,
      data: {
        ...customer,
        stats: {
          totalOrders: orders,
          totalReviews: reviews
        }
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Get Customer Orders
 */
exports.getCustomerOrders = async (req, res) => {
  try {
    const { customerId } = req.params;
    const Order = require('../../models/Order');

    const orders = await Order.find({ userId: customerId })
      .sort({ createdAt: -1 })
      .populate('items.productId', 'name price');

    res.status(200).json({
      success: true,
      data: orders
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Update Customer Status/Info
 */
exports.updateCustomer = async (req, res) => {
  try {
    const { customerId } = req.params;
    const { name, phone, is_verified } = req.body;

    const updateData = {};
    if (name) updateData.name = name;
    if (phone) updateData.phone = phone;
    if (is_verified !== undefined) updateData.is_verified = is_verified;

    const customer = await User.findByIdAndUpdate(
      customerId,
      updateData,
      { new: true, runValidators: true }
    ).select('-password');

    if (!customer) {
      return res.status(404).json({ success: false, message: 'Customer not found' });
    }

    res.status(200).json({
      success: true,
      message: 'Customer updated successfully',
      data: customer
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Block/Unblock Customer
 */
exports.toggleCustomerStatus = async (req, res) => {
  try {
    const { customerId } = req.params;
    const { isActive } = req.body;

    const customer = await User.findByIdAndUpdate(
      customerId,
      { isActive },
      { new: true }
    ).select('-password');

    if (!customer) {
      return res.status(404).json({ success: false, message: 'Customer not found' });
    }

    res.status(200).json({
      success: true,
      message: `Customer ${isActive ? 'activated' : 'blocked'} successfully`,
      data: customer
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Get Customer Statistics
 */
exports.getCustomerStats = async (req, res) => {
  try {
    const Order = require('../../models/Order');
    const Review = require('../../models/Review');

    const [
      totalCustomers,
      activeCustomers,
      totalSpent,
      avgOrderValue,
      topCustomers
    ] = await Promise.all([
      User.countDocuments({ role: 'user' }),
      User.countDocuments({ role: 'user', is_verified: true }),
      Order.aggregate([
        { $match: { status: { $ne: 'cancelled' } } },
        { $group: { _id: null, total: { $sum: '$totalAmount' } } }
      ]),
      Order.aggregate([
        { $match: { status: { $ne: 'cancelled' } } },
        { $group: { _id: null, avgOrder: { $avg: '$totalAmount' } } }
      ]),
      Order.aggregate([
        { $group: { _id: '$userId', totalSpent: { $sum: '$totalAmount' }, orders: { $sum: 1 } } },
        { $sort: { totalSpent: -1 } },
        { $limit: 10 },
        {
          $lookup: {
            from: 'users',
            localField: '_id',
            foreignField: '_id',
            as: 'user'
          }
        },
        { $unwind: '$user' }
      ])
    ]);

    res.status(200).json({
      success: true,
      data: {
        totalCustomers,
        activeCustomers,
        totalSpent: totalSpent[0]?.total || 0,
        avgOrderValue: avgOrderValue[0]?.avgOrder || 0,
        topCustomers
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Delete Customer
 */
exports.deleteCustomer = async (req, res) => {
  try {
    const { customerId } = req.params;

    const customer = await User.findByIdAndDelete(customerId);

    if (!customer) {
      return res.status(404).json({ success: false, message: 'Customer not found' });
    }

    res.status(200).json({
      success: true,
      message: 'Customer deleted successfully'
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
