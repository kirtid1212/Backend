// This file is deprecated. MongoDB connection is now handled by src/utils/database.js
// Please update imports to use: require('./src/utils/database')
const connectDB = require('../utils/database');

module.exports = connectDB;
