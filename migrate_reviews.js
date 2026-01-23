/**
 * Migration script to update Review schema field names
 * Run this script to migrate existing reviews from snake_case to camelCase
 * 
 * Usage: node migrate_reviews.js
 */

const mongoose = require('../config/db');
const Review = require('../models/Review');

async function migrateReviews() {
  try {
    console.log('Starting review migration...');
    
    // Find all reviews
    const reviews = await Review.find({});
    console.log(`Found ${reviews.length} reviews to migrate`);
    
    let updatedCount = 0;
    
    for (const review of reviews) {
      const updates = {};
      let needsUpdate = false;
      
      // Check and rename snake_case fields to camelCase
      if (review.user_id && !review.userId) {
        updates.userId = review.user_id;
        needsUpdate = true;
      }
      
      if (review.product_id && !review.productId) {
        updates.productId = review.product_id;
        needsUpdate = true;
      }
      
      if (review.order_id && !review.orderId) {
        updates.orderId = review.order_id;
        needsUpdate = true;
      }
      
      if (review.is_verified !== undefined && review.isVerified === undefined) {
        updates.isVerified = review.is_verified;
        needsUpdate = true;
      }
      
      // Add status if missing
      if (!review.status) {
        updates.status = 'pending';
        needsUpdate = true;
      }
      
      if (needsUpdate) {
        await Review.updateOne(
          { _id: review._id },
          { $set: updates, $unset: { user_id: '', product_id: '', order_id: '', is_verified: '' } }
        );
        updatedCount++;
        console.log(`Migrated review: ${review._id}`);
      }
    }
    
    console.log(`Migration complete! Updated ${updatedCount} reviews.`);
    
    // Verify migration
    const sampleReview = await Review.findOne({}).populate('productId', 'name');
    console.log('\nSample migrated review:');
    console.log(JSON.stringify(sampleReview, null, 2));
    
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

migrateReviews();

