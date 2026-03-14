const express = require('express');
const authController = require('../controllers/authController');
const ratingsController = require('../controllers/ratingsController');

const router = express.Router(); 

router.use(authController.protect);

router.route('/')
  .post(ratingsController.createRating);

router.route('/:id')
  .patch(ratingsController.updateRating);

module.exports = router;
