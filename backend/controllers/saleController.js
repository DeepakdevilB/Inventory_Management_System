const Item = require('../models/Item');
const Sale = require('../models/Sale');

// @desc    Record a sale with multiple items and update inventory
// @route   POST /api/sales
// @access  Public
const recordSale = async (req, res) => {
  try {
    const { items, customerName } = req.body;

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: 'Please add at least one item to the sale' });
    }

    const normalizedItems = items.map((entry = {}) => ({
      itemId: entry.itemId,
      quantity: Number(entry.quantity)
    }));

    const invalidEntry = normalizedItems.find(
      (entry) => !entry.itemId || Number.isNaN(entry.quantity) || entry.quantity <= 0
    );

    if (invalidEntry) {
      return res.status(400).json({ message: 'Each sale item requires a valid item and quantity' });
    }

    const saleLineItems = [];
    const updatedItems = [];
    let totalAmount = 0;
    let totalQuantity = 0;

    for (const { itemId, quantity } of normalizedItems) {
      const item = await Item.findById(itemId);

      if (!item) {
        return res.status(404).json({ message: 'One of the items could not be found' });
      }

      if (item.quantity < quantity) {
        return res.status(400).json({
          message: `Insufficient stock for ${item.name}. Available: ${item.quantity}`
        });
      }

      item.quantity -= quantity;
      await item.save();

      const lineTotal = quantity * item.price;
      totalAmount += lineTotal;
      totalQuantity += quantity;

      saleLineItems.push({
        item: item._id,
        itemName: item.name,
        quantity,
        pricePerUnit: item.price,
        lineTotal
      });

      updatedItems.push({
        _id: item._id,
        name: item.name,
        quantity: item.quantity
      });
    }

    const sale = await Sale.create({
      items: saleLineItems,
      customerName: customerName?.trim() || 'Walk-in Customer',
      totalAmount,
      totalQuantity
    });

    res.status(201).json({
      message: 'Sale recorded successfully',
      sale,
      updatedItems
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get sales history
// @route   GET /api/sales
// @access  Public
const getSalesHistory = async (req, res) => {
  try {
    const sales = await Sale.find()
      .sort({ saleDate: -1 })
      .lean();

    res.status(200).json(sales);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  recordSale,
  getSalesHistory
};

