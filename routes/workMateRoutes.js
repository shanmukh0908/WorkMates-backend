const express = require('express')
const authController = require('../controllers/authcontroller1')
const workMateController = require('../controllers/workMateController');

const router = express.Router()

router.use(authController.protect);

router.route('/').get(workMateController.getAllWorkMates).post(workMateController.createWorkMate)

module.exports = router