const express = require('express');
const ActivityLog = require('../models/ActivityLog');

const router = express.Router();

// Get latest 50 activity logs
router.get('/', async (req, res) => {
  try {
    const logs = await ActivityLog.find().sort({ createdAt: -1 }).limit(50);
    res.json(logs);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch activity logs', error: err.message });
  }
});

module.exports = router;
