const User = require('../Models/userManagementSchema');
const bcrypt = require('bcryptjs');
const  insert_users = async(req, res,next) =>{
    try{
         const { username, email, password, admin } = req.body;
         const isAdmin = admin === 'on' || admin === true || admin === 'true';
           const hashedPassword = await bcrypt.hash(password, 10);
             const newuser = new User({
             username,
             email,
             password:hashedPassword,
             admin: isAdmin
            });

            await newuser.save();

            res.status(201).redirect('/users');
    
        }catch (error) {
 console.error(error);
    res.status(500).send('Error inserting user');
  }
};
const get_users = async (req, res,next) => {
  try {
    const search = req.query.username;
    const filter = search
      ? { username: { $regex: search, $options: 'i' } }
      : {};

    const users = await User.find(filter).select('username email admin createdAt');
    res.render('result', { users, search }); 

  } catch (error) {
    console.error(error);
    res.status(500).send('Error fetching users');
  }
};
const delete_user = async (req, res, next) => {
  const username = req.body.username;

  try {
    const result = await User.deleteOne({ username });

    if (result.deletedCount === 0) {
      return res.status(404).send('User not found');
    }

    // بعد الحذف، إعادة التوجيه لصفحة إدارة المستخدمين
    return res.redirect('/users');
  } catch (err) {
    console.error(err);
    res.status(500).send('Error deleting user');
  }
};

const user_update = async (req, res, next) => {
  const username = req.body.username;

  const update = {
    email: req.body.email,
  };

  if (req.body.password) {
    update.password = await bcrypt.hash(req.body.password, 10);
  }

  try {
    const result = await User.updateOne(
      { username: username },
      { $set: update }
    );

    if (result.matchedCount === 0) {
      return res.status(404).send('User not found');
    }

    // لا ترسل res.send هنا، فقط ريديركت
    return res.redirect('/users');

  } catch (err) {
    console.error(err);
    // هنا ترسل رسالة خطأ واحدة فقط
    res.status(500).send('Error updating user');
  }
};


module.exports={insert_users,get_users,delete_user,user_update}