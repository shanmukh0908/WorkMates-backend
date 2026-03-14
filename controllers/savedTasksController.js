const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");
const SavedTask = require("../models/savedTasksModel");

exports.createSavedTask = catchAsync(async (req, res, next) => {
  const savedTask = await SavedTask.create({
    user: req.user.id,
    task: req.body.taskId,
  });

  res.status(201).json({
    status: "success",
    accessToken: res.locals?.accessToken || null,
    data: savedTask,
  });
});

exports.getSavedTasks = catchAsync(async (req, res, next) => {
  const savedTasks = await SavedTask.find({ user: req.user.id }).populate({
    path: "task",
    // populate: { path: "createdBy", select: "name profilePhoto" },
  });

  res.status(200).json({
    status: "success",
    accessToken: res.locals?.accessToken || null,
    data: savedTasks,
  });
});

exports.deleteSavedTask = catchAsync(async (req, res, next) => {
  await SavedTask.findOneAndDelete({
    user: req.user.id,
    task: req.params.taskId,
  });

  res.status(200).json({
    status: "success",
    message: "Task removed from saved list",
    accessToken: res.locals?.accessToken || null,
  });
});

