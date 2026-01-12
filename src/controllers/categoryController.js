const Category = require('../models/Category');

class CategoryController {
  static async getAllCategories(req, res) {
    try {
      const categories = await Category.find({ is_active: true }).sort({ sort_order: 1, name: 1 });
      res.json({
        success: true,
        data: categories,
        count: categories.length
      });
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch categories' });
    }
  }

  static async createCategory(req, res) {
    try {
      const category = new Category(req.body);
      await category.save();
      res.status(201).json({ success: true, data: category });
    } catch (error) {
      res.status(500).json({ error: 'Failed to create category' });
    }
  }

  static async updateCategory(req, res) {
    try {
      const category = await Category.findByIdAndUpdate(req.params.id, req.body, { new: true });
      if (!category) return res.status(404).json({ error: 'Category not found' });
      res.json({ success: true, data: category });
    } catch (error) {
      res.status(500).json({ error: 'Failed to update category' });
    }
  }

  static async deleteCategory(req, res) {
    try {
      await Category.findByIdAndUpdate(req.params.id, { is_active: false });
      res.json({ success: true, message: 'Category deleted' });
    } catch (error) {
      res.status(500).json({ error: 'Failed to delete category' });
    }
  }
}

module.exports = CategoryController;