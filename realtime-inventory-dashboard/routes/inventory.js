const express = require('express');
const Item = require('../models/Item');
const ActivityLog = require('../models/ActivityLog');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

// Get all inventory items
router.get('/', async (req, res) => {
  try {
    const items = await Item.find().sort({ updatedAt: -1 });
    res.json(items);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch inventory', error: err.message });
  }
});

// Create new inventory item
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { sku, name, category, quantity, unitPriceUSD, reorderLevel } = req.body;
    if (!sku || !name) {
      return res.status(400).json({ message: 'SKU and Item Name are required' });
    }

    const item = await Item.create({
      sku,
      name,
      category: category || 'General',
      quantity: Number(quantity) || 0,
      unitPriceUSD: Number(unitPriceUSD) || 0,
      reorderLevel: Number(reorderLevel) || 10
    });

    const log = await ActivityLog.create({
      action: 'CREATED',
      itemName: item.name,
      sku: item.sku,
      details: `Added ${item.quantity} units at $${item.unitPriceUSD.toFixed(2)}/unit`,
      performedBy: req.user.username
    });

    req.io.emit('inventory-updated', { type: 'CREATED', item, log });
    res.status(201).json(item);
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ message: 'Item with this SKU already exists' });
    }
    res.status(500).json({ message: 'Failed to create item', error: err.message });
  }
});

// Update stock quantity or item details
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const existingItem = await Item.findById(req.params.id);
    if (!existingItem) {
      return res.status(404).json({ message: 'Item not found' });
    }

    const oldQty = existingItem.quantity;
    const { name, category, quantity, unitPriceUSD, reorderLevel } = req.body;

    if (name !== undefined) existingItem.name = name;
    if (category !== undefined) existingItem.category = category;
    if (quantity !== undefined) existingItem.quantity = Math.max(0, Number(quantity));
    if (unitPriceUSD !== undefined) existingItem.unitPriceUSD = Math.max(0, Number(unitPriceUSD));
    if (reorderLevel !== undefined) existingItem.reorderLevel = Math.max(0, Number(reorderLevel));

    await existingItem.save();

    const actionType = oldQty !== existingItem.quantity ? 'STOCK_ADJUSTED' : 'UPDATED';
    const details =
      oldQty !== existingItem.quantity
        ? `Stock changed from ${oldQty} to ${existingItem.quantity} units`
        : `Updated item metadata/pricing`;

    const log = await ActivityLog.create({
      action: actionType,
      itemName: existingItem.name,
      sku: existingItem.sku,
      details,
      performedBy: req.user.username
    });

    req.io.emit('inventory-updated', { type: actionType, item: existingItem, log });
    res.json(existingItem);
  } catch (err) {
    res.status(500).json({ message: 'Failed to update item', error: err.message });
  }
});

// Delete an item
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const item = await Item.findByIdAndDelete(req.params.id);
    if (!item) {
      return res.status(404).json({ message: 'Item not found' });
    }

    const log = await ActivityLog.create({
      action: 'DELETED',
      itemName: item.name,
      sku: item.sku,
      details: `Removed item (${item.quantity} units remaining) from inventory`,
      performedBy: req.user.username
    });

    req.io.emit('inventory-updated', { type: 'DELETED', itemId: item._id, log });
    res.json({ message: 'Item deleted', itemId: item._id });
  } catch (err) {
    res.status(500).json({ message: 'Failed to delete item', error: err.message });
  }
});

module.exports = router;
