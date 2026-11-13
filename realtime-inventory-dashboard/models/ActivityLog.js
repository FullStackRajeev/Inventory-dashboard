const mongoose = require('mongoose');

const activityLogSchema = new mongoose.Schema({
  action: { type: String, enum: ['CREATED', 'UPDATED', 'DELETED', 'STOCK_ADJUSTED'], required: true },
  itemName: { type: String, required: true },
  sku: { type: String, required: true },
  details: { type: String, required: true },
  performedBy: { type: String, default: 'System' }
}, { timestamps: true });

module.exports = mongoose.model('ActivityLog', activityLogSchema);
