const express = require('express');
const router = express.Router();
const authController = require('../controller/authController');
const { requireLogin, requireAdmin } = require('../middleware/auth');
const { verifyToken, requireJwtAdmin } = require('../middleware/jwtAuth');

// ✅ Public Pages
router.get('/signin', authController.getRegister);     // Show Sign-Up Form
router.post('/signin', authController.postRegister);   // Handle Sign-Up

router.get('/login', authController.getLogin);         // Show Login Form
router.post('/login', authController.postLogin);       // Handle Login

router.get('/logout', authController.logout);          // Handle Logout

// ✅ AJAX: Check if user exists (for live search / login)
router.get('/check-user', authController.ajaxCheckUser);

// ✅ Session-Protected Dashboard (for normal users or admins)
router.get('/dashboard', requireLogin, authController.getDashboard);

// ✅ JWT-Protected Routes
router.get('/secure-data', verifyToken, (req, res) => {
    res.send('✅ Secure content for logged-in user');
});

router.get('/admin-only', verifyToken, requireJwtAdmin, (req, res) => {
    res.send('🔐 Admin-only content');
});

module.exports = router;
