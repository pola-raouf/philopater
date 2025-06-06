const express =require('express');
const router =express.Router();
const {insert_users,get_users,delete_user,user_update}=require('../controller/users_controller')
router.post('/insert', insert_users)
router.get('/search', get_users)
router.post('/delete', delete_user)
router.post('/update',user_update)
module.exports = router;