const Rating = require('../models/ratingsModel');
const catchAsync = require("../utils/catchAsync");

exports.createRating = catchAsync(async (req, res, next) => {
  // Convert rating to number
  req.body.rating = req.body.rating * 1;

  const ratingData = {
    ...req.body,
    ratedBy: req.user.id
  };

  // Create rating
  const rating = await Rating.create(ratingData);

  res.status(201).json({
    status: "rating creation successful",
    accessToken: res.locals?.accessToken || null,
    data: rating
  });
});

exports.updateRating = catchAsync(async (req, res, next) => {

  req.body.rating = Number(req.body.rating);

  const rating = await Rating.findByIdAndUpdate(
    req.params.id,
    { rating: req.body.rating },
    { new: true, upsert: true }
  );

  res.status(200).json({
    status: "successfully updated",
    accessToken: res.locals?.accessToken || null,
    data: rating
  });
});