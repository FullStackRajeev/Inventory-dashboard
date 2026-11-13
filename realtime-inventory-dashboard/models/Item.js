const mongoose = require('mongoose');

const itemSchema = new mongoose.Schema({
  sku: { type: String, required: true, unique: true, trim: true },
  name: { type: String, required: true, trim: true },
  category: { type: String, default: 'General', trim: true },
  quantity: { type: Number, required: true, min: 0, default: 0 },
  unitPriceUSD: { type: Number, required: true, min: 0, default: 0 },
  reorderLevel: { type: Number, default: 10, min: 0 }
}, { timestamps: true });

module.exports = mongoose.model('Item', itemSchema);
