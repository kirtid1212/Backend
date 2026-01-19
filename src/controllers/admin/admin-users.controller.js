const User = require('../../models/User');
const AdminToken = require('../../models/AdminToken');
const bcrypt = require('bcryptjs');

/**
 * Get All Admin Users
 */
exports.getAllAdmins = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const search = req.query.search || '';

    const skip = (page - 1) * limit;

    let query = { role: 'admin' };

    if (search) {
      query = {
        ...query,
        $or: [
          { name: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } }
        ]
      };
    }

    const [admins, total] = await Promise.all([
      User.find(query)
        .select('-password')
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 }),
      User.countDocuments(query)
    ]);

    res.status(200).json({
      success: true,
      data: admins,
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
 * Get Admin Details
 */
exports.getAdminDetails = async (req, res) => {
  try {
    const { adminId } = req.params;

    const admin = await User.findById(adminId)
      .select('-password')
      .lean();

    if (!admin) {
      return res.status(404).json({ success: false, message: 'Admin user not found' });
    }

    res.status(200).json({
      success: true,
      data: admin
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Create New Admin User
 */
exports.createAdmin = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Validate input
    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Name, email, and password are required'
      });
    }

    // Check if admin already exists
    const existingAdmin = await User.findOne({ email: email.toLowerCase() });
    if (existingAdmin) {
      return res.status(409).json({
        success: false,
        message: 'Email already in use'
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    const newAdmin = new User({
      name,
      email: email.toLowerCase(),
      password: hashedPassword,
      role: 'admin',
      is_verified: true
    });

    await newAdmin.save();

    const adminData = newAdmin.toObject();
    delete adminData.password;

    res.status(201).json({
      success: true,
      message: 'Admin user created successfully',
      data: adminData
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Update Admin User
 */
exports.updateAdmin = async (req, res) => {
  try {
    const { adminId } = req.params;
    const { name, phone, is_verified } = req.body;

    const updateData = {};
    if (name) updateData.name = name;
    if (phone) updateData.phone = phone;
    if (is_verified !== undefined) updateData.is_verified = is_verified;

    const admin = await User.findByIdAndUpdate(
      adminId,
      updateData,
      { new: true, runValidators: true }
    ).select('-password');

    if (!admin) {
      return res.status(404).json({ success: false, message: 'Admin user not found' });
    }

    res.status(200).json({
      success: true,
      message: 'Admin updated successfully',
      data: admin
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Change Admin Password
 */
exports.changeAdminPassword = async (req, res) => {
  try {
    const { adminId } = req.params;
    const { oldPassword, newPassword, confirmPassword } = req.body;

    if (!oldPassword || !newPassword || !confirmPassword) {
      return res.status(400).json({
        success: false,
        message: 'Old password, new password, and confirmation are required'
      });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: 'New passwords do not match'
      });
    }

    const admin = await User.findById(adminId).select('+password');

    if (!admin) {
      return res.status(404).json({ success: false, message: 'Admin user not found' });
    }

    // Verify old password
    const isPasswordValid = await bcrypt.compare(oldPassword, admin.password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }

    // Hash and save new password
    admin.password = await bcrypt.hash(newPassword, 10);
    await admin.save();

    res.status(200).json({
      success: true,
      message: 'Password changed successfully'
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Delete Admin User
 */
exports.deleteAdmin = async (req, res) => {
  try {
    const { adminId } = req.params;

    // Prevent deleting the current user (optional)
    if (req.user.id === adminId) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete your own admin account'
      });
    }

    const admin = await User.findByIdAndDelete(adminId);

    if (!admin) {
      return res.status(404).json({ success: false, message: 'Admin user not found' });
    }

    res.status(200).json({
      success: true,
      message: 'Admin user deleted successfully'
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Toggle Admin Status
 */
exports.toggleAdminStatus = async (req, res) => {
  try {
    const { adminId } = req.params;
    const { isActive } = req.body;

    const admin = await User.findByIdAndUpdate(
      adminId,
      { isActive },
      { new: true }
    ).select('-password');

    if (!admin) {
      return res.status(404).json({ success: false, message: 'Admin user not found' });
    }

    res.status(200).json({
      success: true,
      message: `Admin ${isActive ? 'activated' : 'deactivated'} successfully`,
      data: admin
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Get Admin Activity
 */
exports.getAdminActivity = async (req, res) => {
  try {
    const { adminId } = req.params;

    const admin = await User.findById(adminId)
      .select('-password')
      .lean();

    if (!admin) {
      return res.status(404).json({ success: false, message: 'Admin user not found' });
    }

    // Get recent admin tokens (login history)
    const loginHistory = await AdminToken.find({ userId: adminId })
      .sort({ createdAt: -1 })
      .limit(10)
      .lean();

    res.status(200).json({
      success: true,
      data: {
        admin,
        loginHistory
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Get Admin Statistics
 */
exports.getAdminStats = async (req, res) => {
  try {
    const [
      totalAdmins,
      activeAdmins,
      totalSuperAdmins,
      recentAdmins
    ] = await Promise.all([
      User.countDocuments({ role: 'admin' }),
      User.countDocuments({ role: 'admin', isActive: true }),
      User.countDocuments({ role: 'admin', isSuperAdmin: true }),
      User.find({ role: 'admin' })
        .select('-password')
        .sort({ createdAt: -1 })
        .limit(5)
        .lean()
    ]);

    res.status(200).json({
      success: true,
      data: {
        totalAdmins,
        activeAdmins,
        totalSuperAdmins,
        recentAdmins
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
