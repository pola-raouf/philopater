const express = require('express');
const router = express.Router();
const User = require('../Models/userManagementSchema');
const Product=require('../Models/productManagementSchema')
const { requireLogin, requireAdmin } = require('../middleware/auth');
const { verifyToken, requireJwtAdmin } = require('../middleware/jwtAuth');

router.get(['/', '/homepage'], (req, res) => {
  res.render('homepage', { pageTitle: 'Home' });
});
router.get('/about', (req, res) => {
  res.render('about-us', {
    pageTitle: 'About Us',
    showMore: true
  });
});

router.get('/contact', (req, res) => {
  res.render('contact-us', { pageTitle: 'Contact Us' });
});
// router.get('/partners', (req, res) => {
//   res.render('partners', { pageTitle: 'Our Partners' });
// });
router.get('/product', async (req, res) => {
  try {
    const products = await Product.find();
    res.render('product', { products });
  } catch (err) {
    res.status(500).send('Error fetching products');
  }
});

// const productCategories = [
//   'sauce', 'pastes', 'pickles', 'spices', 'cocunut', 'rice',
//   'vineger', 'tomatoes', 'sticks', 'canned_fruits', 'sushi',
//   'beans', 'boba', 'food_additives', 'planet_based_milk_alternatives', 'other'
// ];

// productCategories.forEach(category => {
//   router.get(`/product/${category}`, async (req, res) => {
//     const products = await Product.find({ category });
//     res.render('product-category', {
//       pageTitle: category.replace(/_/g, ' ').toUpperCase(),
//       category,
//       products
//     });
//   });
// });

router.get('/payment',requireLogin, (req, res) => {
  const cart = req.session.cart || {};
  const cartItems = Object.keys(cart).map(key => ({
    name: key,
    price: cart[key].price,
    quantity: cart[key].quantity,
    country: cart[key].country,
    image: cart[key].image
  }));

  res.render('payment', { cartItems, pageTitle: 'Payment' });
});

router.get('/checkout', (req, res) => {
  res.render('checkout', { pageTitle: 'Checkout' });
});


router.get('/settings', verifyToken, requireJwtAdmin, (req, res) => {
  res.render('settings', { pageTitle: 'Settings' });
});


router.get('/dashboard', requireLogin, async (req, res) => {
  try {
    const sessionUser = req.session.user;
    if (!sessionUser) return res.redirect('/login');

    const user = await User.findById(sessionUser._id);
    if (!user) return res.redirect('/login');

    req.session.user.isAdmin = user.admin;

    res.render('dashboard', {
      pageTitle: 'Dashboard',
      username: user.username,
      isAdmin: user.admin
    });
  } catch (err) {
    console.error('Dashboard error:', err.message);
    res.redirect('/login');
  }
});

router.get('/analytics', verifyToken, requireJwtAdmin, (req, res) => {
  res.render('analytics', { pageTitle: 'Analytics Dashboard' });
});

router.get('/product_info', verifyToken, requireJwtAdmin, (req, res) => {
  res.render('manage-product', { pageTitle: 'Manage Products' });
});

router.get('/users', verifyToken, requireJwtAdmin, (req, res) => {
  res.render('users', {
    pageTitle: 'User Management',
    message: null,
    users: []
  });
});

router.get('/login', (req, res) => {
  res.render('Login', { pageTitle: 'Login' });
});

router.get('/signin', (req, res) => {
  res.render('Sign-in', { pageTitle: 'Sign IN' });
});

module.exports = router;
