const express = require('express');
const router = express.Router();
const categoryController = require('../controller/category');

router.get('/product/:categoryName', categoryController.getProductsByCategory);

module.exports = router;
