const mongoose = require('mongoose');

const investmentSchema = new mongoose.Schema({
  basketId: { type: String, required: true },
  investor: { type: String, required: true },
  amount: { type: Number, required: true },
  timestamp: { type: Date, default: Date.now },
  status: { type: String, default: 'active' }
});

module.exports = mongoose.model('Investment', investmentSchema);