const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authLimiter } = require('../middleware/security');

// Authentication routes - with rate limiting
router.post('/login', authLimiter, authController.handleLogin.bind(authController));
router.post('/logout', authController.handleLogout.bind(authController));
router.get('/status', authController.getStatus.bind(authController));

module.exports = router;