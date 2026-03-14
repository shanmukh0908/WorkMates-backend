const express = require('express')
const authController = require('../controllers/authController');
const savedTaskController = require('../controllers/savedTasksController')

const router = express.Router();

router.use(authController.protect)

router
  .route("/")
  .get(savedTaskController.getSavedTasks)
  .post(savedTaskController.createSavedTask);

router
  .route("/:taskId")
  .delete(savedTaskController.deleteSavedTask);

module.exports = router;