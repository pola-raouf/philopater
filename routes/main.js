const express = require('express');
const router = express.Router();
const User = require('../Models/userManagementSchema');
const Product=require('../Models/productManagementSchema')
const { requireLogin, requireAdmin } = require('../middleware/auth');
const { verifyToken, requireJwtAdmin } = require('../middleware/jwtAuth');

// الصفحة الرئيسية
router.get(['/', '/homepage'], (req, res) => {
  res.render('homepage', { pageTitle: 'Home' });
});

router.get('/product', async (req, res) => {
  try {
    const products = await Product.find();
    res.render('product', { products }); // لو بتستخدم EJS أو أي templating engine
  } catch (err) {
    res.status(500).send('Error fetching products');
  }
});

// صفحة الدفع - تمرير الكارت من السيشن على شكل مصفوفة
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

// صفحة الخروج (Checkout)
router.get('/checkout', (req, res) => {
  res.render('checkout', { pageTitle: 'Checkout' });
});

// صفحات ثابتة
router.get('/about', (req, res) => {
  res.render('about-us', {
    pageTitle: 'About Us',
    showMore: true
  });
});

router.get('/contact', (req, res) => {
  res.render('contact-us', { pageTitle: 'Contact Us' });
});

// صفحة الإعدادات - محمية بتوثيق JWT وصلاحية الأدمن
router.get('/settings', verifyToken, requireJwtAdmin, (req, res) => {
  res.render('settings', { pageTitle: 'Settings' });
});

// لوحة التحكم (محمية - يجب تسجيل الدخول)
router.get('/dashboard', requireLogin, async (req, res) => {
  try {
    const sessionUser = req.session.user;
    if (!sessionUser) return res.redirect('/login');

    const user = await User.findById(sessionUser._id);
    if (!user) return res.redirect('/login');

    // تحديث صلاحية الأدمن في السيشن (حسب بيانات المستخدم الحقيقية)
    req.session.user.isAdmin = user.admin;

    res.render('dashboard', {
      pageTitle: 'Dashboard',
      username: user.username,
      isAdmin: user.admin
    });
  } catch (err) {
    console.error('❌ Dashboard error:', err.message);
    res.redirect('/login');
  }
});

// لوحة تحكم التحليلات (محمية للأدمن فقط)
router.get('/analytics', verifyToken, requireJwtAdmin, (req, res) => {
  res.render('analytics', { pageTitle: 'Analytics Dashboard' });
});

// إدارة المنتجات (محمية للأدمن فقط)
router.get('/product_info', verifyToken, requireJwtAdmin, (req, res) => {
  res.render('manage-product', { pageTitle: 'Manage Products' });
});

// إدارة المستخدمين (محمية للأدمن فقط)
router.get('/users', verifyToken, requireJwtAdmin, (req, res) => {
  res.render('users', {
    pageTitle: 'User Management',
    message: null,
    users: []
  });
});

// صفحات الدخول والتسجيل
router.get('/login', (req, res) => {
  res.render('Login', { pageTitle: 'Login' });
});

router.get('/signin', (req, res) => {
  res.render('Sign-in', { pageTitle: 'Sign IN' });
});

module.exports = router;
