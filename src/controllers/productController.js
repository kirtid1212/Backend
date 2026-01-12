const Product = require('../models/Product');

class ProductController {
  static async getAllProducts(req, res) {
    try {
      const { page = 1, limit = 20 } = req.query;
      const products = await Product.find({ is_active: true })
        .populate('category_id', 'name')
        .limit(limit * 1)
        .skip((page - 1) * limit)
        .sort({ createdAt: -1 });
      
      const total = await Product.countDocuments({ is_active: true });
      
      res.json({
        success: true,
        data: products,
        pagination: {
          current_page: parseInt(page),
          total_pages: Math.ceil(total / limit),
          total_items: total
        }
      });
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch products' });
    }
  }

  static async getProductById(req, res) {
    try {
      const product = await Product.findOne({ _id: req.params.id, is_active: true })
        .populate('category_id', 'name description');
      
      if (!product) {
        return res.status(404).json({ error: 'Product not found' });
      }
      
      res.json({
        success: true,
        data: product
      });
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch product' });
    }
  }

  static async searchProducts(req, res) {
    try {
      const { q, page = 1, limit = 20 } = req.query;
      
      if (!q) {
        return res.status(400).json({ error: 'Search query required' });
      }
      
      const products = await Product.find({
        $and: [
          { is_active: true },
          { $text: { $search: q } }
        ]
      })
      .populate('category_id', 'name')
      .limit(limit * 1)
      .skip((page - 1) * limit);
      
      res.json({
        success: true,
        data: products,
        query: q,
        count: products.length
      });
    } catch (error) {
      res.status(500).json({ error: 'Search failed' });
    }
  }

  static async getProductsByCategory(req, res) {
    try {
      const { page = 1, limit = 20 } = req.query;
      const products = await Product.find({ 
        category_id: req.params.categoryId, 
        is_active: true 
      })
      .populate('category_id', 'name')
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ createdAt: -1 });
      
      res.json({
        success: true,
        data: products,
        category_id: req.params.categoryId,
        count: products.length
      });
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch products by category' });
    }
  }

  static async createProduct(req, res) {
  try {
    const { name, price, category_id } = req.body;

    if (!name || !price || !category_id) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const product = await Product.create(req.body);
    res.status(201).json({ success: true, data: product });

  } catch (error) {
    console.error("CREATE PRODUCT ERROR:", error.message);
    res.status(500).json({ error: error.message });
  }
}


  static async updateProduct(req, res) {
    try {
      const product = await Product.findByIdAndUpdate(req.params.id, req.body, { new: true });
      if (!product) return res.status(404).json({ error: 'Product not found' });
      res.json({ success: true, data: product });
    } catch (error) {
      res.status(500).json({ error: 'Failed to update product' });
    }
  }

  static async deleteProduct(req, res) {
    try {
      await Product.findByIdAndUpdate(req.params.id, { is_active: false });
      res.json({ success: true, message: 'Product deleted' });
    } catch (error) {
      res.status(500).json({ error: 'Failed to delete product' });
    }
  }
}

module.exports = ProductController;