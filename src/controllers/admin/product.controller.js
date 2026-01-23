const Product = require('../../models/Product');
const Variant = require('../../models/Variant');
const ProductImage = require('../../models/ProductImage');
const slugify = require('../../utils/slug');
const { toBoolean } = require('../../utils/parse');
const { uploadProductImage } = require('../../services/cloudinary');

const refreshProductOptions = async (productId) => {
  const variants = await Variant.find({ product_id: productId, is_active: true });
  const sizes = Array.from(new Set(variants.map((v) => v.size).filter(Boolean)));
  const colors = Array.from(new Set(variants.map((v) => v.color).filter(Boolean)));
  await Product.updateOne({ _id: productId }, { available_sizes: sizes, available_colors: colors });
};

const createProduct = async (req, res) => {
  try {
    const { name, description, brand, categoryId, price, status, tags, isFeatured, isTrending } = req.body;

    if (!name || !categoryId || price === undefined) {
      return res.status(400).json({ message: 'Name, categoryId, and price are required' });
    }

    const slug = slugify(name);
    const exists = await Product.findOne({ slug });
    if (exists) {
      return res.status(409).json({ message: 'Product slug already exists' });
    }

    const product = await Product.create({
      name,
      slug,
      description: description || '',
      brand: brand || '',
      category_id: categoryId,
      price,
      status: status || 'active',
      tags: tags || [],
      is_featured: toBoolean(isFeatured),
      is_trending: toBoolean(isTrending)
    });

    res.status(201).json({ success: true, data: product });
  } catch (error) {
    res.status(500).json({ message: 'Failed to create product' });
  }
};

const updateProduct = async (req, res) => {
  try {
    const { name, description, brand, categoryId, price, status, tags, isFeatured, isTrending } = req.body;
    const product = await Product.findById(req.params.productId);

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    if (name) {
      const slug = slugify(name);
      const exists = await Product.findOne({ slug, _id: { $ne: product._id } });
      if (exists) {
        return res.status(409).json({ message: 'Product slug already exists' });
      }
      product.name = name;
      product.slug = slug;
    }

    if (description !== undefined) product.description = description;
    if (brand !== undefined) product.brand = brand;
    if (categoryId !== undefined) product.category_id = categoryId;
    if (price !== undefined) product.price = price;
    if (status !== undefined) product.status = status;
    if (tags !== undefined) product.tags = tags;
    if (isFeatured !== undefined) product.is_featured = toBoolean(isFeatured);
    if (isTrending !== undefined) product.is_trending = toBoolean(isTrending);

    await product.save();
    res.json({ success: true, data: product });
  } catch (error) {
    res.status(500).json({ message: 'Failed to update product' });
  }
};

const deleteProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.productId);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    product.status = 'archived';
    await product.save();
    res.json({ success: true, message: 'Product archived' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete product' });
  }
};

const listProducts = async (req, res) => {
  try {
    const { q, categoryId, status, page = 1, limit = 20 } = req.query;
    const filter = {};

    if (q) {
      const regex = new RegExp(q, 'i');
      filter.$or = [{ name: regex }, { description: regex }, { brand: regex }];
    }

    if (categoryId) filter.category_id = categoryId;
    if (status) filter.status = status;

    const safeLimit = Math.min(Number(limit) || 20, 50);
    const safePage = Math.max(Number(page) || 1, 1);

    const products = await Product.find(filter)
      .sort({ createdAt: -1 })
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

const getProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.productId);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    const [variants, images] = await Promise.all([
      Variant.find({ product_id: product._id }),
      ProductImage.find({ product_id: product._id }).sort({ sort_order: 1 })
    ]);

    res.json({ success: true, data: { product, variants, images } });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch product' });
  }
};

const createVariant = async (req, res) => {
  try {
    const { size, color, price, stock, sku } = req.body;
    const productId = req.params.productId;

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    const variant = await Variant.create({
      product_id: productId,
      size: size || '',
      color: color || '',
      price: price || 0,
      stock: stock || 0,
      sku: sku || ''
    });

    await refreshProductOptions(productId);
    res.status(201).json({ success: true, data: variant });
  } catch (error) {
    res.status(500).json({ message: 'Failed to create variant' });
  }
};

const updateVariant = async (req, res) => {
  try {
    const { size, color, price, stock, sku, isActive } = req.body;
    const variant = await Variant.findById(req.params.variantId);
    if (!variant) {
      return res.status(404).json({ message: 'Variant not found' });
    }

    if (size !== undefined) variant.size = size;
    if (color !== undefined) variant.color = color;
    if (price !== undefined) variant.price = price;
    if (stock !== undefined) variant.stock = stock;
    if (sku !== undefined) variant.sku = sku;
    if (isActive !== undefined) variant.is_active = toBoolean(isActive);

    await variant.save();
    await refreshProductOptions(variant.product_id);

    res.json({ success: true, data: variant });
  } catch (error) {
    res.status(500).json({ message: 'Failed to update variant' });
  }
};

const deleteVariant = async (req, res) => {
  try {
    const variant = await Variant.findById(req.params.variantId);
    if (!variant) {
      return res.status(404).json({ message: 'Variant not found' });
    }

    variant.is_active = false;
    await variant.save();
    await refreshProductOptions(variant.product_id);

    res.json({ success: true, message: 'Variant deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete variant' });
  }
};

const updateVariantStock = async (req, res) => {
  try {
    const { stock } = req.body;
    if (stock === undefined) {
      return res.status(400).json({ message: 'Stock is required' });
    }

    const variant = await Variant.findByIdAndUpdate(
      req.params.variantId,
      { stock },
      { new: true }
    );

    if (!variant) {
      return res.status(404).json({ message: 'Variant not found' });
    }

    res.json({ success: true, data: variant });
  } catch (error) {
    res.status(500).json({ message: 'Failed to update stock' });
  }
};

const addProductImages = async (req, res) => {
  try {
    const { urls, url, isPrimary } = req.body;
    const productId = req.params.productId;

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    const manualUrls = Array.isArray(urls) ? urls : url ? [url] : [];
    const uploadedUrls = [];

    if (req.files) {
      const fileEntries = Object.values(req.files);
      const files = fileEntries.reduce((acc, entry) => {
        if (Array.isArray(entry)) {
          acc.push(...entry);
        } else if (entry) {
          acc.push(entry);
        }
        return acc;
      }, []);

      for (const file of files) {
        if (!file || !file.data) {
          continue;
        }

        const uploadResult = await uploadProductImage(file.data, {
          folder: `ecommerce/products/${productId}`
        });

        uploadedUrls.push(uploadResult.secure_url || uploadResult.url);
      }
    }

    const combinedUrls = [...uploadedUrls, ...manualUrls];
    if (!combinedUrls.length) {
      return res.status(400).json({ message: 'Image url is required' });
    }

    const existingCount = await ProductImage.countDocuments({ product_id: productId });
    const images = await ProductImage.insertMany(
      combinedUrls.map((item, index) => ({
        product_id: productId,
        url: item,
        sort_order: existingCount + index,
        is_primary: Boolean(isPrimary) && index === 0
      }))
    );

    // Sync images to Product model for easier querying
    const allProductImages = await ProductImage.find({ product_id: productId }).sort({ sort_order: 1 });
    const imageUrls = allProductImages.map(img => img.url);
    await Product.findByIdAndUpdate(productId, { images: imageUrls });

    res.status(201).json({ success: true, data: images });
  } catch (error) {
    res.status(500).json({ message: 'Failed to add product images' });
  }
};

const deleteProductImage = async (req, res) => {
  try {
    const image = await ProductImage.findOneAndDelete({
      _id: req.params.imageId,
      product_id: req.params.productId
    });

    if (!image) {
      return res.status(404).json({ message: 'Image not found' });
    }

    // Sync images to Product model after deletion
    const allProductImages = await ProductImage.find({ product_id: req.params.productId }).sort({ sort_order: 1 });
    const imageUrls = allProductImages.map(img => img.url);
    await Product.findByIdAndUpdate(req.params.productId, { images: imageUrls });

    res.json({ success: true, message: 'Image deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete image' });
  }
};

module.exports = {
  createProduct,
  updateProduct,
  deleteProduct,
  listProducts,
  getProduct,
  createVariant,
  updateVariant,
  deleteVariant,
  updateVariantStock,
  addProductImages,
  deleteProductImage
};
