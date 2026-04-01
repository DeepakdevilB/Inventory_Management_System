const Item = require('../models/Item');
const Sale = require('../models/Sale');

// @desc    Get low stock items
// @route   GET /api/reports/low-stock
// @access  Public
const getLowStockItems = async (req, res) => {
  try {
    // Find items where quantity is less than or equal to minStockLevel
    const lowStockItems = await Item.find({
      $expr: { $lte: ["$quantity", "$minStockLevel"] }
    });
    
    res.status(200).json(lowStockItems);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get inventory summary
// @route   GET /api/reports/summary
// @access  Public
const getInventorySummary = async (req, res) => {
  try {
    const [items, salesStats] = await Promise.all([
      Item.find(),
      Sale.aggregate([
        {
          $group: {
            _id: null,
            totalSalesAmount: { $sum: '$totalAmount' },
            totalItemsSold: {
              $sum: {
                $ifNull: ['$totalQuantity', '$quantity']
              }
            }
          }
        }
      ])
    ]);
    
    // Calculate total inventory value
    const totalValue = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    
    // Get total item count
    const totalItems = items.length;
    
    // Get total quantity
    const totalQuantity = items.reduce((sum, item) => sum + item.quantity, 0);
    
    // Get low stock items count
    const lowStockCount = items.filter(item => item.quantity <= item.minStockLevel).length;
    
    const { totalSalesAmount = 0, totalItemsSold = 0 } = salesStats[0] || {};

    res.status(200).json({
      totalValue,
      totalItems,
      totalQuantity,
      lowStockCount,
      totalSalesAmount,
      totalItemsSold
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get top and bottom products by quantity
// @route   GET /api/reports/quantity-extremes
// @access  Public
const getQuantityExtremes = async (req, res) => {
  try {
    // Get all items
    const items = await Item.find();
    
    // Sort by quantity (descending and ascending)
    const sortedByQuantityDesc = [...items].sort((a, b) => b.quantity - a.quantity);
    const sortedByQuantityAsc = [...items].sort((a, b) => a.quantity - b.quantity);
    
    // Get top 5 and bottom 5
    const top5 = sortedByQuantityDesc.slice(0, 5);
    const bottom5 = sortedByQuantityAsc.slice(0, 5);
    
    res.status(200).json({
      top5,
      bottom5
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get supplier-wise stock report
// @route   GET /api/reports/supplier-stock
// @access  Public
const getSupplierStockReport = async (req, res) => {
  try {
    const items = await Item.find();
    
    // Group items by supplier
    const supplierData = {};
    
    items.forEach(item => {
      const supplier = item.supplier;
      
      if (!supplierData[supplier]) {
        supplierData[supplier] = {
          totalItems: 0,
          totalQuantity: 0,
          totalValue: 0,
          categories: {},
          items: []
        };
      }
      
      supplierData[supplier].totalItems += 1;
      supplierData[supplier].totalQuantity += item.quantity;
      supplierData[supplier].totalValue += (item.price * item.quantity);
      supplierData[supplier].items.push(item);
      
      // Track categories
      if (!supplierData[supplier].categories[item.category]) {
        supplierData[supplier].categories[item.category] = 0;
      }
      supplierData[supplier].categories[item.category] += item.quantity;
    });
    
    res.status(200).json(supplierData);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get category-wise stock report
// @route   GET /api/reports/category-stock
// @access  Public
const getCategoryStockReport = async (req, res) => {
  try {
    const items = await Item.find();
    
    // Group items by category
    const categoryData = {};
    
    items.forEach(item => {
      const category = item.category;
      
      if (!categoryData[category]) {
        categoryData[category] = {
          totalItems: 0,
          totalQuantity: 0,
          totalValue: 0,
          suppliers: {},
          items: []
        };
      }
      
      categoryData[category].totalItems += 1;
      categoryData[category].totalQuantity += item.quantity;
      categoryData[category].totalValue += (item.price * item.quantity);
      categoryData[category].items.push(item);
      
      // Track suppliers
      if (!categoryData[category].suppliers[item.supplier]) {
        categoryData[category].suppliers[item.supplier] = 0;
      }
      categoryData[category].suppliers[item.supplier] += item.quantity;
    });
    
    res.status(200).json(categoryData);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getLowStockItems,
  getInventorySummary,
  getQuantityExtremes,
  getSupplierStockReport,
  getCategoryStockReport
}; 