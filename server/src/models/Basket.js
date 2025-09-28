const mongoose = require('mongoose');

const basketSchema = new mongoose.Schema({
  basketId: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  riskRange: { type: [Number], required: true },
  targetAPY: { type: Number, required: true },
  active: { type: Boolean, default: true }
});

module.exports = mongoose.model('Basket', basketSchema);
