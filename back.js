const express = require('express');
const path = require('path');
const mongoose = require('mongoose');
const cookieParser = require('cookie-parser');
const session = require('express-session');
const MongoStore = require('connect-mongo');

const app = express();

app.disable('x-powered-by');

mongoose.connect('mongodb+srv://eyad404:1234@cluster0.mwnt4hv.mongodb.net/khalasonabaa?retryWrites=true&w=majority&appName=Cluster0')
    .then(() => console.log('Connected to MongoDB'))
    .catch((err) => console.error('MongoDB connection error:', err));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.use(session({
  secret: process.env.SESSION_SECRET || 'supersecret_session_key',
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({
    mongoUrl: 'mongodb+srv://eyad404:1234@cluster0.mwnt4hv.mongodb.net/khalasonabaa?retryWrites=true&w=majority&appName=Cluster0',
  }),
  cookie: {
    maxAge: 24 * 60 * 60 * 1000, 
    httpOnly: true,
    secure: false, 
  },
}));

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(express.static(path.join(__dirname, 'public')));

app.use((req, res, next) => {
  res.locals.user = req.session.user || null;
  next();
});

app.use('/', require('./routes/main'));
app.use('/', require('./routes/users'));
app.use('/', require('./routes/products_route'));
app.use('/', require('./routes/protectedRoutes'));
app.use('/', require('./routes/authRoutes'));
app.use('/partners', require('./routes/partners'));
const categoryRoutes = require('./routes/category');
app.use('/', categoryRoutes);

const { router: sseRouter } = require('./routes/sse');
app.use('/', sseRouter);

const orderRoutes = require('./routes/order');
app.use('/api', orderRoutes);

app.use((req, res) => {
  res.status(404).render('404');
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).render('500');
});

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

