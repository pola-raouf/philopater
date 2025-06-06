const bcrypt = require('bcryptjs');
const User = require('../Models/userManagementSchema');

exports.getSignUp = (req, res) => {
  res.render('Sign-in', {
    pageTitle: 'Sign Up',
    errorMessage: null,
    oldInput: null
  });
};

exports.postSignUp = async (req, res) => {
  console.log('Form data received:', req.body);
  
  const { fullName, email, password, confirmPassword } = req.body;

  // التحقق من أن البيانات موجودة
  if (!fullName || !email || !password || !confirmPassword) {
    console.error('Missing form fields');
    return res.status(400).render('Sign-in', {
      pageTitle: 'Sign Up',
      errorMessage: 'All fields are required.',
      oldInput: { fullName, email }
    });
  }

  if (password !== confirmPassword) {
    return res.status(400).render('Sign-in', {
      pageTitle: 'Sign Up',
      errorMessage: 'Passwords do not match.',
      oldInput: { fullName, email }
    });
  }

  if (password.length < 8) {
    return res.status(400).render('Sign-in', {
      pageTitle: 'Sign Up',
      errorMessage: 'Password must be at least 8 characters long.',
      oldInput: { fullName, email }
    });
  }

  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).render('Sign-in', {
        pageTitle: 'Sign Up',
        errorMessage: 'Email is already registered.',
        oldInput: { fullName, email }
      });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const newUser = new User({
      username: fullName,
      email,
      password: hashedPassword
    });

    await newUser.save();
    console.log('User created successfully:', newUser);

    res.redirect('/login');
  } catch (err) {
    console.error('Error during signup:', err);
    res.status(500).render('Sign-in', {
      pageTitle: 'Sign Up',
      errorMessage: 'Something went wrong. Please try again later.',
      oldInput: { fullName, email }
    });
  }
};