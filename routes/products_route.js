const express = require('express');
const router = express.Router();
const Product = require('../Models/productManagementSchema');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const {
  insertProduct,
  searchProduct,
  deleteProduct,
  updateProduct
} = require('../controller/product_controller');

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const country = req.body.category || req.body.country || 'default';
    const folderPath = path.join('public/image', country.toLowerCase());

    if (!fs.existsSync(folderPath)) {
      fs.mkdirSync(folderPath, { recursive: true });
    }

    cb(null, folderPath);
  },

  filename: function (req, file, cb) {
    const uniqueName = Date.now() + path.extname(file.originalname);
    cb(null, uniqueName);
  }
});

const upload = multer({ storage: storage });

router.post('/insert_product', upload.single('image'), insertProduct);
router.get('/search_product', searchProduct);
router.post('/delete_product', deleteProduct);
router.post('/update_product', upload.single('image'), updateProduct);

module.exports = router;
