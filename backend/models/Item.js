const mongoose = require('mongoose');

const itemSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please add a name'],
    trim: true
  },
  category: {
    type: String,
    required: [true, 'Please add a category'],
    trim: true
  },
  description: {
    type: String,
    trim: true,
    default: ''
  },
  quantity: {
    type: Number,
    required: [true, 'Please add a quantity'],
    min: 0
  },
  price: {
    type: Number,
    required: [true, 'Please add a price'],
    min: 0
  },
  supplier: {
    type: String,
    required: [true, 'Please add a supplier'],
    trim: true
  },
  minStockLevel: {
    type: Number,
    default: 10,
    min: 0
  },
  dateAdded: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Item', itemSchema); 