const express = require('express')
const authController = require('../controllers/authController')
const notificationController = require('../controllers/notificationController')

const router = express.Router()

router.use(authController.protect)

router.route('/').get(notificationController.getAllNotifications).post(notificationController.createNotification)
router.route('/:id').patch(notificationController.updateNotification).get(notificationController.getNotification)

module.exports = router