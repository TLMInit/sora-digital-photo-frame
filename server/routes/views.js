const express = require('express');
const router = express.Router();
const viewController = require('../controllers/viewController');
const { requireAuth, requireGuest, requireUploadAuth } = require('../middleware/auth');

// Public routes
router.get('/', viewController.redirectToSlideshow.bind(viewController));
router.get('/slideshow', viewController.serveSlideshow.bind(viewController));
router.get('/folder-selection', viewController.serveFolderSelection.bind(viewController));
router.get('/login', requireGuest, viewController.serveLogin.bind(viewController));

// Protected routes
router.get('/admin', requireAuth, viewController.serveAdmin.bind(viewController));
router.get('/access-accounts', requireAuth, viewController.serveAccessAccounts.bind(viewController));
router.get('/upload-tokens', requireAuth, viewController.serveUploadTokens.bind(viewController));

// Guest upload page (token-based, no login required)
router.get('/guest-upload', viewController.serveGuestUpload.bind(viewController));

module.exports = router;