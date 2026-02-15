const express = require('express');
const router = express.Router();
const { verifyToken, requireJwtAdmin } = require('../middleware/jwtAuth');

router.get('/users', verifyToken, requireJwtAdmin, (req, res) => {
    res.render('users', {
        pageTitle: 'Manage Users',
        username: req.user?.userId || 'Admin'
    });
});

router.get('/product_info', verifyToken, requireJwtAdmin, (req, res) => {
    res.render('manage-product', {
        pageTitle: 'Product Management',
        username: req.user?.userId || 'Admin'
    });
});

router.get('/analytics', verifyToken, requireJwtAdmin, (req, res) => {
    res.render('analytics', {
        pageTitle: 'Analytics',
        username: req.user?.userId || 'Admin'
    });
});

router.get('/settings', verifyToken, requireJwtAdmin, (req, res) => {
    res.render('settings', {
        pageTitle: 'Settings',
        username: req.user?.userId || 'Admin'
    });
});

module.exports = router;
