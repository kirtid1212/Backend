const Category = require('../../models/Category');
const slugify = require('../../utils/slug');
const { toBoolean } = require('../../utils/parse');

const createCategory = async (req, res) => {
  try {
    const { name, description, parentId, imageUrl, sortOrder } = req.body;
    if (!name) {
      return res.status(400).json({ message: 'Name is required' });
    }

    const slug = slugify(name);
    const exists = await Category.findOne({ slug });
    if (exists) {
      return res.status(409).json({ message: 'Category slug already exists' });
    }

    const category = await Category.create({
      name,
      slug,
      description: description || '',
      parent_id: parentId || null,
      image_url: imageUrl || '',
      sort_order: sortOrder || 0
    });

    res.status(201).json({ success: true, data: category });
  } catch (error) {
    res.status(500).json({ message: 'Failed to create category' });
  }
};

const updateCategory = async (req, res) => {
  try {
    const { name, description, parentId, imageUrl, sortOrder, isActive } = req.body;
    const category = await Category.findById(req.params.categoryId);
    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }

    if (name) {
      const slug = slugify(name);
      const exists = await Category.findOne({ slug, _id: { $ne: category._id } });
      if (exists) {
        return res.status(409).json({ message: 'Category slug already exists' });
      }
      category.name = name;
      category.slug = slug;
    }

    if (description !== undefined) category.description = description;
    if (parentId !== undefined) category.parent_id = parentId || null;
    if (imageUrl !== undefined) category.image_url = imageUrl || '';
    if (sortOrder !== undefined) category.sort_order = sortOrder;
    if (isActive !== undefined) category.is_active = toBoolean(isActive);

    await category.save();
    res.json({ success: true, data: category });
  } catch (error) {
    res.status(500).json({ message: 'Failed to update category' });
  }
};

const deleteCategory = async (req, res) => {
  try {
    const category = await Category.findById(req.params.categoryId);
    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }

    category.is_active = false;
    await category.save();
    res.json({ success: true, message: 'Category deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete category' });
  }
};

const setCategoryImage = async (req, res) => {
  try {
    const { imageUrl } = req.body;
    if (!imageUrl) {
      return res.status(400).json({ message: 'imageUrl is required' });
    }

    const category = await Category.findByIdAndUpdate(
      req.params.categoryId,
      { image_url: imageUrl },
      { new: true }
    );

    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }

    res.json({ success: true, data: category });
  } catch (error) {
    res.status(500).json({ message: 'Failed to update category image' });
  }
};

module.exports = {
  createCategory,
  updateCategory,
  deleteCategory,
  setCategoryImage
};
