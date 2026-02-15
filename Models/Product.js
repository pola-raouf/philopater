const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: { type: String, required: true },
  company: { type: String, required: true }, // اسم الشركة مطابق للـ Company.name
  price: { type: Number, required: true },
  image: { type: String, required: true },
  category: String
});

module.exports = mongoose.models.Product || mongoose.model('Product', productSchema);
