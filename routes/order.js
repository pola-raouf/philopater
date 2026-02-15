const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Order = require('../Models/orderSchema');
const Analytics = require('../Models/analyticsSchema');
const Product = require('../Models/productManagementSchema');
const handlePurchase = require('../controller/purchaseController');
const { verifyToken, requireJwtAdmin } = require('../middleware/jwtAuth');

router.post('/update-cart', (req, res) => {
  if (!req.session.user) {
    return res.status(401).json({ error: 'Unauthorized. Please login.' });
  }
  req.session.cart = req.body.cart || {};
  console.log('🛒 Session cart updated:', req.session.cart);
  return res.json({ message: 'Cart updated in session.' });
});

router.get('/get-cart', (req, res) => {
  if (!req.session.user) {
    return res.status(401).json({ error: 'Unauthorized. Please login.' });
  }
  return res.json(req.session.cart || {});
});

router.post('/purchase', async (req, res) => {
  try {
    if (!req.session.user || !req.session.user._id) {
      return res.status(401).json({ error: "Please log in to make a purchase." });
    }

    req.body.userId = new mongoose.Types.ObjectId(req.session.user._id);
    req.body.username = req.session.user.username || "Unknown";
    req.body.cart = req.session.cart || {};

    if (Object.keys(req.body.cart).length === 0) {
      return res.status(400).json({ error: 'Cart is empty.' });
    }

    await handlePurchase(req, res);

    req.session.cart = {};
  } catch (error) {
    console.error("Purchase error:", error);
    res.status(500).json({ error: "Failed to complete purchase." });
  }
});

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

    res.redirect('/analytics'); 
  } catch (err) {
    console.error("Reset error:", err);
    res.status(500).json({ error: "Failed to reset analytics." });
  }
});


function normalize(str = '') {
  return str.trim().toLowerCase();
}



module.exports = router;
