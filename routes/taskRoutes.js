const express = require('express');
const authController = require('../controllers/authController')
const taskController = require('../controllers/taskController');
const { getUploadSignature } = require('../utils/getUploadSignature');
const router = express.Router(); 

// Protect all routes below
router.use(authController.protect);

// Example: GET /api/v1/tasks-within/:distance/center/:latlng
router.route('/within/:distance/center/:latlng')
  .get(taskController.tasksWithInDistance);

router.route("/cloudinary-signature").get(getUploadSignature)  

router.route('/').get(taskController.getAllTasks).post(taskController.createTask)

router.route('/:id').patch(taskController.updateTask)

module.exports = router;

