const express = require('express');
const router = express.Router();
const {
  getLowStockItems,
  getInventorySummary,
  getQuantityExtremes,
  getSupplierStockReport,
  getCategoryStockReport,
  getPredictiveRestockAlerts
} = require('../controllers/reportController');

// Get low stock items
router.get('/low-stock', getLowStockItems);

// Get inventory summary
router.get('/summary', getInventorySummary);

// Get top 5 and bottom 5 products by quantity
router.get('/quantity-extremes', getQuantityExtremes);

// Get supplier-wise stock report
router.get('/supplier-stock', getSupplierStockReport);

// Get category-wise stock report
router.get('/category-stock', getCategoryStockReport);

// Get predictive restock alerts
router.get('/predictive-restock', getPredictiveRestockAlerts);

module.exports = router;