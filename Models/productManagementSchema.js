const mongoose = require('mongoose');
const validator = require('validator');

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  price: {
    type: Number,
    required: true,
    min: [0, 'Product price cannot be negative']
  },
  country: {
    type: String,
    required: true,
    trim: true
  },
  image: {
  type: String,
  required: [true, 'Product image is required'],
  trim: true
},
  description: {
    type: String,
    required: false
  },
  unitsLeft: {
    type: Number,
    required: true,
    default: 0,
    min: [0, 'Units left cannot be negative']
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Create the Product model using the schema
//const Product = mongoose.model('Product', productSchema);
const Product = mongoose.models.Product || mongoose.model('Product', productSchema);
module.exports = Product;