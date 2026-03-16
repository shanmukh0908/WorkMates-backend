const express = require('express')
const userController = require('../controllers/userController') 
const authController = require('../controllers/authController')
const { getUploadSignature } = require('../utils/getUploadSignature');

const router = express.Router()

router.post('/signup', authController.signUp)
router.post('/login',  authController.logIn)
router.post('/logout',authController.logOut)

router.use(authController.protect)

router.route("/cloudinary-signature").get(getUploadSignature) 
router.get('/details',userController.getUser)
router.patch('/details',userController.updateUserDetails)
router.patch('/emailpassword',userController.updateEmailPassWord)

module.exports = router