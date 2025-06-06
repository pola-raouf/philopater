const jwt = require('jsonwebtoken');
const User = require('../Models/userManagementSchema');
const JWT_SECRET = process.env.JWT_SECRET || 'supersecret';

async function syncSessionUser(req, res, next) {
    if (req.session.user?._id) {
        try {
            const dbUser = await User.findById(req.session.user._id);
            if (dbUser) {
                req.session.user.isAdmin = dbUser.admin;
                req.session.user.username = dbUser.username;

                res.locals.user = {
                    _id: dbUser._id,
                    username: dbUser.username,
                    isAdmin: dbUser.admin
                };

                // ✅ Refresh token with updated admin value
                const token = jwt.sign(
                    { userId: dbUser._id, admin: dbUser.admin },
                    JWT_SECRET,
                    { expiresIn: '1d' }
                );
                res.cookie('token', token, {
                    httpOnly: true,
                    secure: false,
                    maxAge: 24 * 60 * 60 * 1000
                });

            } else {
                res.locals.user = null;
            }
        } catch (err) {
            console.error('❌ sessionSync error:', err.message);
            res.locals.user = null;
        }
    } else {
        res.locals.user = null;
    }

    next();
}

module.exports = syncSessionUser;
