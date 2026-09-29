const Product = require('../Models/productManagementSchema');
const { sendProductRefreshEvent } = require('../routes/sse'); 

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

    res.status(201).json({
      success: true,
      message: 'Product inserted successfully'
    });
    } catch (err) {
    console.error(err);
    if (err.name === 'ValidationError' || err.name === 'CastError' || err.code === 11000) {
      return res.status(400).json({
        success: false,
        message: err.message
      });
    }
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
        const accept = String(req.get('Accept') || '');
        if (accept.includes('application/json') && !accept.includes('text/html')) {
            if (search && products.length === 0) {
                return res.status(404).json({ success: false, message: 'product not found' });
            }
            return res.status(200).json({ products });
        }
        res.render('products_result', { products, search, pageTitle: 'Search Results' });
    } catch (error) {
        console.error(error);
        res.status(500).send('Error fetching products');
    }
};
const deleteProduct = async (req, res) => {
    try {
        if (!req.body.productname || typeof req.body.productname !== 'string') {
            return res.status(400).json({ success: false, message: 'productname is required' });
        }
        const name = req.body.productname.trim();
        if (!name) {
            return res.status(400).json({ success: false, message: 'productname is required' });
        }
       const result = await Product.deleteOne({
            name: { $regex: `^${name}$`, $options: 'i' }
        });

        if (result.deletedCount === 0) {
            return res.status(404).json({ success: false, message: 'product not found' });
        }
        sendProductRefreshEvent();
        res.status(200).json({ success: true, message: 'PRODUCT DELETE SUCCESSFULLY' });
    } catch (err) {
        console.error(' Error deleting product:', err);
        res.status(500).json({ success: false, message: 'Error deleting product' });
    }
};

const updateProduct = async (req, res) => {
    try {
        const { productId, newCountry, newPrice, quntity } = req.body;
        if (!productId || typeof productId !== 'string') {
            return res.status(400).json({ success: false, message: 'productId is required' });
        }
        const image = req.file ? req.file.filename : null;

        if (newPrice !== undefined && newPrice !== '' && Number.isNaN(Number(newPrice))) {
            return res.status(400).json({ success: false, message: 'newPrice must be a number' });
        }
        if (quntity !== undefined && quntity !== '' && Number.isNaN(Number(quntity))) {
            return res.status(400).json({ success: false, message: 'quntity must be a number' });
        }

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
        if (err.name === 'ValidationError' || err.name === 'CastError') {
            return res.status(400).json({ success: false, message: err.message });
        }
        res.status(500).json({ success: false, message: "Error updating product" });
    }
};

module.exports = {
    insertProduct,
    searchProduct,
    deleteProduct,
    updateProduct,
};
