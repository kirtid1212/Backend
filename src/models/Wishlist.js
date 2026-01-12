class Wishlist {
  static validate(data) {
    const errors = [];
    
    if (!data.product_id || typeof data.product_id !== 'string') {
      errors.push('Product ID is required');
    }
    
    return errors;
  }
}

module.exports = Wishlist;