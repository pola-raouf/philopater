const express = require('express');
const router = express.Router();
const authController = require('../controller/authController');
const { requireLogin, requireAdmin } = require('../middleware/auth');
const { verifyToken, requireJwtAdmin } = require('../middleware/jwtAuth');

router.get('/signin', authController.getRegister);     
router.post('/signin', authController.postRegister);   

router.get('/login', authController.getLogin);         
router.post('/login', authController.postLogin);      

router.get('/logout', authController.logout);          

router.get('/check-user', authController.ajaxCheckUser);

router.get('/dashboard', requireLogin, authController.getDashboard);

router.get('/secure-data', verifyToken, (req, res) => {
    res.send('Secure content for logged-in user');
});

router.get('/admin-only', verifyToken, requireJwtAdmin, (req, res) => {
    res.send('Admin-only content');
});

module.exports = router;
