const Category = require('../models/Category');

const buildTree = (categories) => {
  const map = new Map();
  categories.forEach((category) => {
    map.set(String(category._id), { ...category, children: [] });
  });

  const roots = [];
  map.forEach((category) => {
    if (category.parent_id && map.has(String(category.parent_id))) {
      map.get(String(category.parent_id)).children.push(category);
    } else {
      roots.push(category);
    }
  });

  return roots;
};

const listCategories = async (req, res) => {
  try {
    const categories = await Category.find({ is_active: true })
      .sort({ sort_order: 1, name: 1 })
      .lean();

    const tree = buildTree(categories);
    res.json({ success: true, data: tree, count: tree.length });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch categories' });
  }
};

const getCategory = async (req, res) => {
  try {
    const category = await Category.findOne({ _id: req.params.categoryId, is_active: true }).lean();
    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }

    const children = await Category.find({ parent_id: category._id, is_active: true })
      .sort({ sort_order: 1, name: 1 })
      .lean();

    res.json({ success: true, data: { ...category, children } });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch category' });
  }
};

module.exports = { listCategories, getCategory };
