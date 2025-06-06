const Product = require('../Models/productManagementSchema');
const { sendProductRefreshEvent } = require('../routes/sse'); // المسار حسب مكان الملف
 // 🔄 إشعار للـ frontend يعمل refresh

const insertProduct = async (req, res) => {
  try {
    const { name, price, country, quantity } = req.body;

    const fileName = req.file ? req.file.filename : null;
    const folder = country?.toLowerCase();

    if (!name || !price || !country || !quantity || !fileName) {
      return res.status(400).json({
        success: false,
        message: "All fields including image are required"
      });
    }

    const imagePath = `/image/${folder}/${fileName}`;


    const product = new Product({
      name,
      price,
      country,
      image: imagePath,
      unitsLeft: quantity
    });

    await product.save();
sendProductRefreshEvent();

    res.status(200).json({
      success: true,
      message: 'Product inserted successfully'
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: 'Error inserting product'
    });
  }
};


const searchProduct = async (req, res) => {
    try {
        const search = req.query.query;
        const filter = search ? { name: { $regex: search, $options: 'i' } } : {};

        const products = await Product.find(filter);
        res.render('products_result', { products, search, pageTitle: 'Search Results' });
    } catch (error) {
        console.error(error);
        res.status(500).send('Error fetching products');
    }
};
const deleteProduct = async (req, res) => {
    try {
        const name = req.body.productname.trim();
        const result = await Product.deleteOne({ name: { $regex: new RegExp(`^${name}$`, 'i') } });

        if (result.deletedCount === 0) {
            return res.status(404).json({ success: false, message: 'product not found' });
        }
        sendProductRefreshEvent();
        res.status(200).json({ success: true, message: 'PRODUCT DELETE SUCCESSFULLY' });
    } catch (err) {
        console.error('🔥 Error deleting product:', err);
        res.status(500).json({ success: false, message: 'Error deleting product' });
    }
};

const updateProduct = async (req, res) => {
    try {
        const { productId, newCountry, newPrice, quntity } = req.body;
        const image = req.file ? req.file.filename : null;

        const update = {};
        if (newCountry) update.country = newCountry;
        if (newPrice) update.price = newPrice;
        if (quntity) update.unitsLeft = Number(quntity);
        if (image) update.image = image;

        const updated = await Product.findOneAndUpdate({ name: productId }, { $set: update });

        if (!updated) {
            return res.status(404).json({ success: false, message: 'product not found' });
        }
        sendProductRefreshEvent();
        res.status(200).json({ success: true, message: "Product updated successfully" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: "Error updating product" });
    }
};
 const getAllProducts = async (req, res) => {
  try {
    const searchQuery = req.query.query; // ده اللي جاي من الـ search input
    let filter = {};

    if (searchQuery) {
      filter = { name: { $regex: searchQuery, $options: 'i' } }; // بحث جزئي case-insensitive
    }

    const products = await Product.find(filter);

    res.render('products', { products, search: searchQuery });
  } catch (error) {
    console.error(error);
    res.status(500).send('Error fetching products');
  }
};
module.exports = {
    insertProduct,
    searchProduct,
    deleteProduct,
    updateProduct,
    getAllProducts,
};
