const express = require('express');
const router = express.Router();
const { recordSale, getSalesHistory } = require('../controllers/saleController');

router.route('/')
  .get(getSalesHistory)
  .post(recordSale);

module.exports = router;

