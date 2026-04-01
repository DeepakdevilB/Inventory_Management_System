const mongoose = require('mongoose');

const saleItemSchema = new mongoose.Schema({
  item: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Item',
    required: true
  },
  itemName: {
    type: String,
    required: true,
    trim: true
  },
  quantity: {
    type: Number,
    required: true,
    min: 1
  },
  pricePerUnit: {
    type: Number,
    required: true,
    min: 0
  },
  lineTotal: {
    type: Number,
    required: true,
    min: 0
  }
}, { _id: false });

const saleSchema = new mongoose.Schema({
  // Legacy single-item fields (kept for backward compatibility with existing data)
  item: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Item'
  },
  itemName: {
    type: String,
    trim: true
  },
  quantity: {
    type: Number,
    min: 1
  },
  pricePerUnit: {
    type: Number,
    min: 0
  },
  // New multi-item structure
  items: {
    type: [saleItemSchema],
    default: []
  },
  customerName: {
    type: String,
    default: 'Walk-in Customer',
    trim: true
  },
  totalQuantity: {
    type: Number,
    min: 0,
    default: 0
  },
  totalAmount: {
    type: Number,
    required: true,
    min: 0
  },
  saleDate: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Sale', saleSchema);

