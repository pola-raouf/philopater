const Company = require('../Models/Company');
const Product = require('../Models/productManagementSchema'); // حسب اسم الموديل عندك

// عرض كل الشركات
exports.showCompanies = async (req, res) => {
    try {
        const companies = await Company.find();
        res.render('partners', { companies });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server error');
    }
};

// عرض منتجات شركة معينة
exports.showCompanyProducts = async (req, res) => {
    try {
        const companyId = req.params.id;
        const company = await Company.findById(companyId);
        if (!company) return res.status(404).send('Company not found');

        const products = await Product.find({ company: company.name });
        res.render('company-products', { company, products });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server error');
    }
};
