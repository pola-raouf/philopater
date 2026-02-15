const mongoose = require('mongoose');

const companySchema = new mongoose.Schema({
  name: { type: String, required: true },
  location: { type: String }
});

module.exports = mongoose.models.Company || mongoose.model('Company', companySchema);
