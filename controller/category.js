const Product = require('../Models/Product'); // هنا اسم الملف product.js

exports.getProductsByCategory = async (req, res) => {
  try {
    const categoryName = req.params.categoryName; // زي: sauce, pastes
    const products = await Product.find({ category: categoryName });

    res.render('product_category', {
      pageTitle: categoryName.replace(/_/g, ' '),
      category: categoryName,
      products
    });
  } catch (err) {
    console.error('Error fetching products by category:', err);
    res.status(500).send('Server error');
  }
};
