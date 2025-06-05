const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Order = require('../Models/orderSchema');
const Analytics = require('../Models/analyticsSchema');
const Product = require('../Models/productManagementSchema');
const { verifyToken, requireJwtAdmin } = require('../middleware/jwtAuth');

// ✅ تحديث السلة داخل session
router.post('/update-cart', (req, res) => {
  if (!req.session.user) {
    return res.status(401).json({ error: 'Unauthorized. Please login.' });
  }
  req.session.cart = req.body.cart || {};
  console.log('🛒 Session cart updated:', req.session.cart);
  return res.json({ message: 'Cart updated in session.' });
});

// ✅ الحصول على السلة من session
router.get('/get-cart', (req, res) => {
  if (!req.session.user) {
    return res.status(401).json({ error: 'Unauthorized. Please login.' });
  }
  return res.json(req.session.cart || {});
});

// ✅ تنفيذ الشراء
router.post('/purchase', async (req, res) => {
  try {
    if (!req.session.user || !req.session.user._id) {
      return res.status(401).json({ error: "Please log in to make a purchase." });
    }

    const userId = new mongoose.Types.ObjectId(req.session.user._id);
    const username = req.session.user.username || "Unknown";
    const cart = req.session.cart || {};

    if (Object.keys(cart).length === 0) {
      return res.status(400).json({ error: 'Cart is empty.' });
    }

    const { totalPrice, paymentMethod } = req.body;

    // ✅ استرجاع بيانات المنتجات من قاعدة البيانات
    const productNames = Object.keys(cart);
    const dbProducts = await Product.find({ name: { $in: productNames } });

    const products = productNames.map(name => {
      const cartItem = cart[name];
      const dbProduct = dbProducts.find(p => p.name === name);
      return {
        name,
        price: cartItem.price,
        quantity: cartItem.quantity,
        image: cartItem.image,
        country: (dbProduct?.country || 'Unknown').toLowerCase() // ✅ Normalized
      };
    });

    // ✅ إنشاء الطلب
    const order = new Order({
      userId,
      username,
      products,
      totalPrice,
      paymentMethod
    });

    await order.save();

    // ✅ تحديث Analytics
    const updateOps = products.map(item => {
      if (!item.country || !item.quantity) return null;

      return Analytics.updateOne(
        { country: item.country },
        { $inc: { purchases: item.quantity } },
        { upsert: true }
      );
    });

    await Promise.all(updateOps.filter(Boolean));

    // ✅ مسح السلة بعد إتمام الشراء
    req.session.cart = {};

    console.log('✅ Order saved and analytics updated.');
    return res.status(201).json({ message: 'Order placed and analytics updated successfully.' });
  } catch (error) {
    console.error("❌ Purchase error:", error);
    return res.status(500).json({ error: "Failed to complete purchase." });
  }
});

// ✅ Capitalize helper
function capitalize(word) {
  return word.charAt(0).toUpperCase() + word.slice(1);
}

router.get('/analytics-data', verifyToken, requireJwtAdmin, async (req, res) => {
  try {
    const data = await Analytics.find();
    const labels = data.map(entry => capitalize(entry.country));
    const values = data.map(entry => entry.purchases);
    res.json({ labels, values });
  } catch (err) {
    console.error("Error loading analytics data:", err);
    res.status(500).json({ error: 'Failed to load analytics data' });
  }
});

router.all('/reset-analytics', verifyToken, requireJwtAdmin, async (req, res) => {
  try {
    await Analytics.deleteMany({});

    const countries = ['china', 'india', 'italy', 'spain', 'thailand', 'tunisia'];
    for (let country of countries) {
      await Analytics.updateOne(
        { country: normalize(country) },
        { $set: { purchases: 0 } },
        { upsert: true }
      );
    }

    // بدل ما ترجع JSON، نعيد توجيه للصفحة
    res.redirect('/analytics');  // غير حسب رابط صفحة التحليلات عندك
  } catch (err) {
    console.error("❌ Reset error:", err);
    res.status(500).json({ error: "Failed to reset analytics." });
  }
});


function normalize(str = '') {
  return str.trim().toLowerCase();
}



module.exports = router;