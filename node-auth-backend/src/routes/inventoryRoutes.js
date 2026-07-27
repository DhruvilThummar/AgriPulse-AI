const express = require('express');
const router = express.Router();
const User = require('../models/User');
const authMiddleware = require('../middleware/auth');

// GET /api/inventory - Fetch current persistent inventory and cash reserves
router.get('/', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }
    
    // Return saved values, or default state if empty
    return res.json({
      success: true,
      inventory: user.inventory || [],
      cashReserves: user.cashReserves !== undefined ? user.cashReserves : 2103280,
      storageLimit: user.storageLimit !== undefined ? user.storageLimit : 400
    });
  } catch (error) {
    console.error('Fetch inventory error:', error);
    return res.status(500).json({ success: false, error: 'Server error fetching inventory.' });
  }
});

// POST /api/inventory/adjust - Persist new inventory array and cash reserves
router.post('/adjust', authMiddleware, async (req, res) => {
  try {
    const { inventory, cashReserves, storageLimit } = req.body;
    
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    if (inventory !== undefined) user.inventory = inventory;
    if (cashReserves !== undefined) user.cashReserves = cashReserves;
    if (storageLimit !== undefined) user.storageLimit = storageLimit;

    await user.save();

    return res.json({
      success: true,
      message: 'Inventory persisted successfully',
      inventory: user.inventory,
      cashReserves: user.cashReserves,
      storageLimit: user.storageLimit
    });
  } catch (error) {
    console.error('Adjust inventory error:', error);
    return res.status(500).json({ success: false, error: 'Server error updating inventory.' });
  }
});

module.exports = router;
