const express = require('express');
const authController = require('../controllers/authcontroller1')
const taskController = require('../controllers/taskController');
const {uploadImages,resizeImage}  = require('../utils/uploadImages')

const router = express.Router(); 

// Protect all routes below
router.use(authController.protect);

// Example: GET /api/v1/tasks-within/:distance/center/:latlng
router.route('/within/:distance/center/:latlng')
  .get(taskController.tasksWithInDistance);

router.route('/').get(taskController.getAllTasks).post(uploadImages,resizeImage,taskController.createTask)

router.route('/:id').patch(uploadImages,resizeImage,taskController.updateTask)

module.exports = router;

