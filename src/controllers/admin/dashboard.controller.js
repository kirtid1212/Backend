const Order = require('../../models/Order');
const Product = require('../../models/Product');
const User = require('../../models/User');
const Category = require('../../models/Category');
// Get dashboard statistics
exports.getStats = async (req, res) => {
  try {
    const { period = '7d' } = req.query;
    
    // Calculate date range
    const days = parseInt(period) || 7;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    startDate.setHours(0, 0, 0, 0);

    // Get stats
    const [
      totalOrders,
      pendingOrders,
      deliveredOrders,
      totalRevenue,
      totalProducts,
      lowStockCount,
      totalUsers
    ] = await Promise.all([
      Order.countDocuments(),
      Order.countDocuments({ status: 'pending' }),
      Order.countDocuments({ status: 'delivered' }),
      Order.aggregate([
        { $match: { status: 'delivered' } },
        { $group: { _id: null, total: { $sum: '$total' } } }
      ]),
      Product.countDocuments(),
      Product.countDocuments({ stock: { $lt: 10 } }),
      User.countDocuments()
    ]);

    // Revenue this period
    const revenueThisPeriod = await Order.aggregate([
      { $match: { status: 'delivered', createdAt: { $gte: startDate } } },
      { $group: { _id: null, total: { $sum: '$total' } } }
    ]);

    res.json({
      success: true,
      data: {
        orders: {
          total: totalOrders,
          pending: pendingOrders,
          delivered: deliveredOrders
        },
        revenue: {
          total: totalRevenue[0]?.total || 0,
          thisPeriod: revenueThisPeriod[0]?.total || 0
        },
        products: {
          total: totalProducts,
          lowStock: lowStockCount
        },
        users: {
          total: totalUsers
        }
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Get chart data
exports.getChartData = async (req, res) => {
  try {
    const { period = '7d' } = req.query;
    const days = parseInt(period) || 7;
    
    const data = [];
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);
      
      const nextDate = new Date(date);
      nextDate.setDate(nextDate.getDate() + 1);

      const orders = await Order.countDocuments({
        createdAt: { $gte: date, $lt: nextDate }
      });

      const revenue = await Order.aggregate([
        {
          $match: {
            status: 'delivered',
            createdAt: { $gte: date, $lt: nextDate }
          }
        },
        { $group: { _id: null, total: { $sum: '$total' } } }
      ]);

      data.push({
        date: date.toISOString().split('T')[0],
        orders,
        revenue: revenue[0]?.total || 0
      });
    }

    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Get top products
exports.getTopProducts = async (req, res) => {
  try {
    const { limit = 10 } = req.query;

    const topProducts = await Order.aggregate([
      { $unwind: '$items' },
      {
        $group: {
          _id: '$items.productId',
          totalSold: { $sum: '$items.quantity' },
          totalRevenue: { $sum: { $multiply: ['$items.price', '$items.quantity'] } }
        }
      },
      { $sort: { totalSold: -1 } },
      { $limit: parseInt(limit) },
      {
        $lookup: {
          from: 'products',
          localField: '_id',
          foreignField: '_id',
          as: 'product'
        }
      },
      { $unwind: '$product' },
      {
        $project: {
          id: '$_id',
          name: '$product.name',
          totalSold: 1,
          totalRevenue: 1
        }
      }
    ]);

    res.json({ success: true, data: topProducts });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Get order status distribution
exports.getOrderStatusDistribution = async (req, res) => {
  try {
    const distribution = await Order.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    res.json({
      success: true,
      data: distribution.map(d => ({
        status: d._id,
        count: d.count
      }))
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Get user growth data
exports.getUserGrowth = async (req, res) => {
  try {
    const { days = 30 } = req.query;
    
    const data = [];
    for (let i = parseInt(days) - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);
      
      const nextDate = new Date(date);
      nextDate.setDate(nextDate.getDate() + 1);

      const count = await User.countDocuments({
        createdAt: { $gte: date, $lt: nextDate }
      });

      data.push({
        date: date.toISOString().split('T')[0],
        newUsers: count
      });
    }

    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Get category performance
exports.getCategoryPerformance = async (req, res) => {
  try {
    const categoryPerf = await Order.aggregate([
      { $unwind: '$items' },
      {
        $lookup: {
          from: 'products',
          localField: 'items.productId',
          foreignField: '_id',
          as: 'product'
        }
      },
      { $unwind: '$product' },
      {
        $lookup: {
          from: 'categories',
          localField: 'product.categoryId',
          foreignField: '_id',
          as: 'category'
        }
      },
      { $unwind: '$category' },
      {
        $group: {
          _id: '$category._id',
          categoryName: { $first: '$category.name' },
          totalOrders: { $sum: 1 },
          totalRevenue: { $sum: { $multiply: ['$items.price', '$items.quantity'] } },
          totalItemsSold: { $sum: '$items.quantity' }
        }
      },
      { $sort: { totalRevenue: -1 } }
    ]);

    res.json({ success: true, data: categoryPerf });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Get recent orders
exports.getRecentOrders = async (req, res) => {
  try {
    const { limit = 5 } = req.query;

    const recentOrders = await Order.find()
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .populate('user_id', 'name email');

    res.json({ success: true, data: recentOrders });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Get low stock products
exports.getLowStockProducts = async (req, res) => {
  try {
    const { threshold = 10 } = req.query;

    const lowStockProducts = await Product.find({
      stock: { $lt: parseInt(threshold) }
    })
      .sort({ stock: 1 })
      .limit(20);

    res.json({ success: true, data: lowStockProducts });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

