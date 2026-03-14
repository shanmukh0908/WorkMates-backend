const express = require('express')
const authController = require('../controllers/authController')
const messageController = require('../controllers/messageController')

const router = express.Router()

router.use(authController.protect)

router.route('/').get(messageController.getAllMessages).post(messageController.createMessage)
router.route('/:id').get(messageController.getMessage).patch(messageController.updateMessage)

module.exports = router