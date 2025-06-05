// models/analyticsSchema.js
const mongoose = require('mongoose');

const analyticsSchema = new mongoose.Schema({
  country: { type: String, required: true, unique: true },
  purchases: { type: Number, default: 0 }
});

module.exports = mongoose.model('Analytics', analyticsSchema);
