const express = require('express');
const webhookController = require('../controllers/webhookController');

const router = express.Router();

// Defined as a simple POST, but parsing happens in app.js
router.post('/stripe', webhookController.handleWebhook);

module.exports = router;