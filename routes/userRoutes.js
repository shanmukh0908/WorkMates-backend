const express = require('express')
const {uploadImages,resizeImage}  = require('../utils/uploadImages')
const userController = require('../controllers/userController') 
const authController = require('../controllers/authController')

const router = express.Router()

router.post('/signup',uploadImages,resizeImage,authController.signUp)
router.post('/login',authController.logIn)
router.post('/logout',authController.logOut)

router.use(authController.protect)

router.get('/details',userController.getUser)
router.patch('/details',uploadImages,resizeImage,userController.updateUserDetails)
router.patch('/emailpassword',userController.updateEmailPassWord)

module.exports = router