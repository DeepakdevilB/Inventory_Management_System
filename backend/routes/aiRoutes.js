const express = require('express');
const router = express.Router();
const aiController = require('../controllers/aiController');

// @route   POST /api/ai/chat
// @desc    Chat with the AI inventory assistant
// @access  Public (for demo purposes) or Private depending on your auth middleware
router.post('/chat', aiController.chat);

// @route   POST /api/ai/magic-fill
// @desc    Generate product details from name
// @access  Public or Private
router.post('/magic-fill', aiController.magicFill);

module.exports = router;
