const Product = require('../models/Product');
const Variant = require('../models/Variant');
const ProductImage = require('../models/ProductImage');

const listProducts = async (req, res) => {
  try {
    const {
      categoryId,
      q,
      minPrice,
      maxPrice,
      sizes,
      colors,
      brand,
      sort = 'newest',
      page = 1,
      limit = 20
    } = req.query;

    const filter = { status: 'active' };

    if (categoryId) {
      filter.category_id = categoryId;
    }

    if (q) {
      const regex = new RegExp(q, 'i');
      filter.$or = [{ name: regex }, { description: regex }, { brand: regex }];
    }

    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice) filter.price.$gte = Number(minPrice);
      if (maxPrice) filter.price.$lte = Number(maxPrice);
    }

    if (sizes) {
      const values = String(sizes).split(',').map((v) => v.trim()).filter(Boolean);
      if (values.length) filter.available_sizes = { $in: values };
    }

    if (colors) {
      const values = String(colors).split(',').map((v) => v.trim()).filter(Boolean);
      if (values.length) filter.available_colors = { $in: values };
    }

    if (brand) {
      filter.brand = brand;
    }

    const sortMap = {
      price_asc: { price: 1 },
      price_desc: { price: -1 },
      newest: { createdAt: -1 },
      popular: { sold_count: -1 }
    };

    const sortBy = sortMap[sort] || sortMap.newest;
    const safeLimit = Math.min(Number(limit) || 20, 50);
    const safePage = Math.max(Number(page) || 1, 1);

    const products = await Product.find(filter)
      .sort(sortBy)
      .skip((safePage - 1) * safeLimit)
      .limit(safeLimit);

    const total = await Product.countDocuments(filter);

    res.json({
      success: true,
      data: products,
      pagination: {
        current_page: safePage,
        total_pages: Math.ceil(total / safeLimit),
        total_items: total
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch products' });
  }
};

const getHomeProducts = async (req, res) => {
  try {
    const { section = 'featured', limit = 12 } = req.query;
    const safeLimit = Math.min(Number(limit) || 12, 30);

    const filter = { status: 'active' };
    let sortBy = { createdAt: -1 };

    if (section === 'featured') {
      filter.is_featured = true;
    } else if (section === 'trending') {
      filter.is_trending = true;
      sortBy = { sold_count: -1 };
    } else if (section === 'new') {
      sortBy = { createdAt: -1 };
    }

    const products = await Product.find(filter).sort(sortBy).limit(safeLimit);
    res.json({ success: true, data: products });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch home products' });
  }
};

const getProductDetails = async (req, res) => {
  try {
    const product = await Product.findOne({ _id: req.params.productId, status: 'active' });
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    const [variants, images] = await Promise.all([
      Variant.find({ product_id: product._id, is_active: true }),
      ProductImage.find({ product_id: product._id }).sort({ sort_order: 1 })
    ]);

    res.json({
      success: true,
      data: {
        product,
        variants,
        images
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch product' });
  }
};

const getRelatedProducts = async (req, res) => {
  try {
    const product = await Product.findById(req.params.productId);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    const related = await Product.find({
      _id: { $ne: product._id },
      category_id: product.category_id,
      status: 'active'
    })
      .sort({ createdAt: -1 })
      .limit(8);

    res.json({ success: true, data: related });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch related products' });
  }
};

const getAvailability = async (req, res) => {
  try {
    const { size, color } = req.query;
    const productId = req.params.productId;

    if (!size && !color) {
      const variants = await Variant.find({ product_id: productId, is_active: true });
      if (!variants.length) {
        return res.json({ success: true, data: { in_stock: true, stock: null } });
      }

      const totalStock = variants.reduce((sum, item) => sum + item.stock, 0);
      return res.json({
        success: true,
        data: { in_stock: totalStock > 0, stock: totalStock }
      });
    }

    const query = { product_id: productId, is_active: true };
    if (size) query.size = size;
    if (color) query.color = color;

    const variant = await Variant.findOne(query);
    if (!variant) {
      return res.status(404).json({ message: 'Variant not found' });
    }

    res.json({
      success: true,
      data: { in_stock: variant.stock > 0, stock: variant.stock }
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to check availability' });
  }
};

module.exports = {
  listProducts,
  getHomeProducts,
  getProductDetails,
  getRelatedProducts,
  getAvailability
};
