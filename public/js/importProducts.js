const fs = require('fs');
const mongoose = require('mongoose');

// ✅ Replace with your actual connection string
mongoose.connect('mongodb+srv://eyad404:1234@cluster0.mwnt4hv.mongodb.net/khalasonabaa?retryWrites=true&w=majority&appName=Cluster0')
    .then(() => console.log('✅ Connected to MongoDB'))
    .catch((err) => console.error('❌ MongoDB connection error:', err));

const Product = mongoose.model('Product', new mongoose.Schema({
    name: String,
    price: Number,
    image: String,
    country: String
}));

const Country = mongoose.model('Country', new mongoose.Schema({
    country: String,
    products: [
        {
            name: String,
            price: Number,
            image: String
        }
    ]
}));

async function importData() {
    const data = JSON.parse(fs.readFileSync('./products.json', 'utf-8'));
    const allProducts = [];
    const countries = [];

    for (const country of data.country) {
        const countryName = country.name;
        const products = country.item.map(item => ({
            name: item.name,
            price: item.price,
            image: item.image
        }));

        for (const product of products) {
            allProducts.push({ ...product, country: countryName });
        }

        countries.push({ country: countryName, products });
    }

    await Product.insertMany(allProducts);
    await Country.insertMany(countries);
    console.log('✅ Import complete!');
    mongoose.disconnect();
}

importData();
