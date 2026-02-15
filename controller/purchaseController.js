const Product = require('../Models/productManagementSchema');
const Order = require('../Models/orderSchema');
const Analytics = require('../Models/analyticsSchema');

async function handlePurchase(req, res) {
  const { userId, username, cart, totalPrice, paymentMethod } = req.body;

  try {
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
        country: (dbProduct?.country || 'Unknown').toLowerCase()
      };
    });

    const order = new Order({
      userId,
      username,
      products,
      totalPrice,
      paymentMethod
    });

    await order.save();

    const updateOps = products.map(item => {
      if (!item.country || !item.quantity) return null;
      return Analytics.updateOne(
        { country: item.country },
        { $inc: { purchases: item.quantity } },
        { upsert: true }
      );
    });

    await Promise.all(updateOps.filter(Boolean));

    console.log('Order saved and analytics updated.');
    res.status(201).json({ message: 'Order placed and analytics updated successfully.' });
  } catch (error) {
    console.error("handlePurchase error:", error);
    res.status(500).json({ error: "Failed to complete purchase." });
  }
}

module.exports = handlePurchase;
