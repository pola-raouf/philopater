const express = require('express');
const path = require('path');
const mongoose = require('mongoose');
const cookieParser = require('cookie-parser');
const session = require('express-session');
const MongoStore = require('connect-mongo');

const app = express();

// ✅ MongoDB connection
mongoose.connect('mongodb+srv://eyad404:1234@cluster0.mwnt4hv.mongodb.net/khalasonabaa?retryWrites=true&w=majority&appName=Cluster0')
    .then(() => console.log('✅ Connected to MongoDB'))
    .catch((err) => console.error('❌ MongoDB connection error:', err));

// ✅ Middleware to parse JSON and URL-encoded bodies
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// ✅ Sessions setup with MongoDB store
app.use(session({
  secret: process.env.SESSION_SECRET || 'supersecret_session_key',
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({
    mongoUrl: 'mongodb+srv://eyad404:1234@cluster0.mwnt4hv.mongodb.net/khalasonabaa?retryWrites=true&w=majority&appName=Cluster0',
  }),
  cookie: {
    maxAge: 24 * 60 * 60 * 1000, // 1 day in milliseconds
    httpOnly: true,
    secure: false, // set to true if HTTPS in production
  },
}));

// ✅ Set EJS as view engine and views folder
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// ✅ Serve static files from /public
app.use(express.static(path.join(__dirname, 'public')));

// ✅ Make session user available to all EJS views as 'user'
app.use((req, res, next) => {
  res.locals.user = req.session.user || null;
  next();
});

// ✅ Use route modules
app.use('/', require('./routes/main'));
app.use('/', require('./routes/users'));
app.use('/', require('./routes/products_route'));
app.use('/', require('./routes/protectedRoutes'));
app.use('/', require('./routes/authRoutes'));

const { router: sseRouter } = require('./routes/sse');
app.use('/', sseRouter);

// ✅ Mount order routes under /api
const orderRoutes = require('./routes/order');
app.use('/api', orderRoutes);

// Route not found
app.use((req, res) => {
  res.status(404).render('404'); // هنا المشكلة لو الملف مش موجود
});

// Internal server error
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).render('500'); // هنا المشكلة لو الملف مش موجود
});

// ✅ Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
