const express = require('express');
const router = express.Router();
const authController = require('../controller/signin_check');

// تحقق من أن المسارات مطابقة لما في النموذج HTML
router.route('/signin')
  .get(authController.getRegister)
  .post(authController.postRegister);

module.exports = router;