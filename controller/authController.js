const User = require('../Models/userManagementSchema');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'supersecret';

// ===== عرض صفحة التسجيل =====
async function getRegister(req, res) {
    console.log('📄 Register page opened');
    return res.render('Sign-in', { errorMessage: null, pageTitle: 'Sign IN' });
}

// ===== تنفيذ التسجيل =====
async function postRegister(req, res) {
    const { fullName, email, password, confirmPassword } = req.body;
    console.log("📥 Received registration data:", req.body);

    if (!fullName || !email || !password || !confirmPassword) {
        return res.render('Sign-in', {
            errorMessage: 'All fields are required.',
            pageTitle: 'Sign IN'
        });
    }

    if (password !== confirmPassword) {
        return res.render('Sign-in', {
            errorMessage: 'Passwords do not match.',
            pageTitle: 'Sign IN'
        });
    }

    try {
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.render('Sign-in', {
                errorMessage: 'Email already exists.',
                pageTitle: 'Sign IN'
            });
        }

        const hashedPassword = await bcrypt.hash(password, 12);

        const newUser = new User({
            username: fullName,
            email,
            password: hashedPassword,
            admin: false
        });

        await newUser.save();
        console.log("✅ User registered:", newUser.email);

        return res.redirect('/login');
    } catch (err) {
        console.error("❌ Registration failed:", err.message);
        return res.render('Sign-in', {
            errorMessage: 'Something went wrong. Please try again.',
            pageTitle: 'Sign IN'
        });
    }
}

// ===== عرض صفحة تسجيل الدخول =====
function getLogin(req, res) {
    return res.render('Login', { errorMessage: null, pageTitle: 'Login' });
}

// ===== تنفيذ تسجيل الدخول =====
async function postLogin(req, res) {
    const { email, password } = req.body;
    console.log("🔑 Login attempt:", email);

    if (!email || !password) {
        return res.render('Login', {
            errorMessage: 'Email and password are required.',
            pageTitle: 'Login'
        });
    }

    try {
        const user = await User.findOne({ email }).select('+password');
        if (!user) {
            return res.render('Login', {
                errorMessage: 'No account with this email.',
                pageTitle: 'Login'
            });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.render('Login', {
                errorMessage: 'Invalid password.',
                pageTitle: 'Login'
            });
        }

        const token = jwt.sign(
            { userId: user._id, admin: user.admin },
            JWT_SECRET,
            { expiresIn: '1d' }
        );

        res.cookie('token', token, {
            httpOnly: true,
            secure: false,
            maxAge: 24 * 60 * 60 * 1000
        });

        req.session.user = {
            _id: user._id,
            username: user.username,
            isAdmin: user.admin
        };

        user.lastLogin = new Date();
        await user.save();

        console.log("✅ Login successful:", user.email);
        return res.redirect('/homepage');
    } catch (err) {
        console.error("❌ Login error:", err.message);
        return res.render('Login', {
            errorMessage: 'Login failed. Please try again.',
            pageTitle: 'Login'
        });
    }
}

// ===== صفحة لوحة التحكم =====
async function getDashboard(req, res) {
    try {
        const sessionUser = req.session.user;

        if (!sessionUser) {
            return res.redirect('/login');
        }

        const user = await User.findById(sessionUser._id);
        if (!user) return res.redirect('/login');

        req.session.user.isAdmin = user.admin;

        return res.render('dashboard', {
            pageTitle: 'Dashboard',
            username: user.username,
            isAdmin: user.admin
        });
    } catch (err) {
        console.error("❌ Dashboard error:", err.message);
        return res.redirect('/login');
    }
}

// ===== تسجيل الخروج =====
function logout(req, res) {
    req.session.destroy(() => {
        res.clearCookie('token');
        res.redirect('/login');
    });
}

// ===== API AJAX check for user existence =====
async function ajaxCheckUser(req, res) {
    try {
        const { email } = req.query;
        const user = await User.exists({ email });
        res.json({ exists: !!user });
    } catch (error) {
        console.error('❌ AJAX check error:', error);
        res.status(500).json({ exists: false });
    }
}

module.exports = {
    getRegister,
    postRegister,
    getLogin,
    postLogin,
    getDashboard,
    logout,
    ajaxCheckUser
};
