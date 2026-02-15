const express = require('express');
const router = express.Router();
const authController = require('../controller/signin_check');

router.route('/signin')
  .get(authController.getRegister)
  .post(authController.postRegister);

module.exports = router;
