const Notification = require('../models/notificationModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');

exports.createNotification = catchAsync(async (req, res, next) => {
  const notification = await Notification.create({ ...req.body, user: req.user.id });

  res.status(201).json({
    status: "success",
    accessToken: res.locals?.accessToken || null,
    data: notification
  });
});

exports.updateNotification = catchAsync(async (req, res, next) => {
  const { readStatus } = req.body;

  const notification = await Notification.findByIdAndUpdate(
    req.params.id,
    { readStatus },
    { new: true }
  );

  if (!notification) {
    return next(new AppError("Notification not found", 404));
  }

  res.status(200).json({
    status: "success",
    accessToken: res.locals?.accessToken || null,
    data: notification
  });
});

exports.getAllNotifications = catchAsync(async (req, res, next) => {
  // 1) Base query: user’s notifications, newest first
  let query = Notification.find({ to: req.user.id }).sort('-createdAt');

  // 2) Pagination
  const page = req.query.page * 1 || 1;
  const limit = req.query.limit * 1 || 10;
  const skip = (page - 1) * limit;

  const numDocs = await Notification.countDocuments({ user: req.user.id });
  if (req.query.page && skip >= numDocs) {
    return next(new AppError(`Page ${page} doesn’t exist`, 404));
  }

  query = query.skip(skip).limit(limit);

  // 3) Execute query
  const notifications = await query;

  // 4) Send response
  res.status(200).json({
    status: "success",
    results: notifications.length,
    accessToken: res.locals?.accessToken || null,
    data: notifications
  });
});

exports.getNotification = catchAsync (async (req,res,next)=>{

  const notification = await Notification.findById(req.params.id)

  if(!notification){
    return next(new AppError(`couldnt find the notification`, 404))
  }

  res.status(200).json({
    status: "success",
    accessToken: res.locals?.accessToken || null,
    data: notification
  });

}

)

// const Notification = require('../models/notificationModel');
// const catchAsync = require('../utils/catchAsync');
// const AppError = require('../utils/appError')


// exports.createNotification = catchAsync(async (req, res, next) => {
//   const notification = await Notification.create({ ...req.body, user: req.user.id });

//   res.status(201).json({
//     status: "successfully created",
//     accessToken: res.locals?.accessToken || null,
//     data: notification
//   });
// });

// exports.updateNotification = catchAsync(async (req, res, next) => {
//   const { readStatus } = req.body;

//   const notification = await Notification.findByIdAndUpdate(
//     req.params.id,
//     { readStatus },
//     { new: true }
//   );

//   if (!notification) {
//     return next({ status: 404, message: "Notification not found" });
//   }

//   res.status(200).json({
//     status: "successfully updated",
//     accessToken: res.locals?.accessToken || null,
//     data: notification
//   });
// });

// exports.getAllNotifications = catchAsync(async (req, res, next) => {
//   // 1) Base query: user’s notifications, newest first
//   let query = Notification.find({ user: req.user.id }).sort('-createdAt');

//   // 2) Pagination
//   const page = req.query.page * 1 || 1;
//   const limit = req.query.limit * 1 || 10;
//   const skip = (page - 1) * limit;

//   const numDocs = await Notification.countDocuments({ user: req.user.id });
//   if (req.query.page && skip >= numDocs) {
//     return next(new AppError(`Page ${page} doesn’t exist`, 404));
//   }

//   query = query.skip(skip).limit(limit);

//   // 3) Execute query
//   const notifications = await query;

//   // 4) Send response
//   res.status(200).json({
//     status: "success",
//     results: notifications.length,
//     accessToken: res.locals?.accessToken || null,
//     data: notifications
//   });
// });
