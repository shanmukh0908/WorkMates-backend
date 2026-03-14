const Message = require('../models/messageModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');

exports.createMessage = catchAsync(async (req, res, next) => {
  console.log(req.body)
  
  const message = await Message.create({ ...req.body, from: req.user.id });


  res.status(201).json({
    status: "success",
    accessToken: res.locals?.accessToken || null,
    data: message
  });
});

exports.updateMessage = catchAsync(async (req, res, next) => {
  const { readStatus } = req.body;

  const message = await Message.findByIdAndUpdate(
    req.params.id,
    { readStatus },
    { new: true }
  );

  if (!message) {
    return next(new AppError("Message not found", 404));
  }

  res.status(200).json({
    status: "success",
    accessToken: res.locals?.accessToken || null,
    data: message
  });
});

exports.getAllMessages = catchAsync(async (req, res, next) => {
  console.log(req.user.id)
  let query = Message.find({ to: req.user.id }).sort('-createdAt');

  if(req.query.from && req.query.to){
    console.log("signal ****")
    query = Message.find({
                          $or: [
                      { from: req.query.to, to: req.query.from },
                      { from: req.query.from, to: req.query.to }
                      ]
                      }).sort('-createdAt');
  }


  // Pagination
  const page = req.query.page * 1 || 1;
  const limit = req.query.limit * 1 || 10;
  const skip = (page - 1) * limit;

  const numDocs = await Message.countDocuments({ to: req.user.id });
  if (req.query.page && skip >= numDocs) {
    return next(new AppError(`Page ${page} does not exist`, 404));
  }

  query = query.skip(skip).limit(limit);

  const messages = await query;

  res.status(200).json({
    status: "success",
    results: messages.length,
    accessToken: res.locals?.accessToken || null,
    data: messages,
  });
});

exports.getMessage = catchAsync(async (req,res,next)=>{
  const message = await Message.findById(req.params.id)
  if(!message){
    return next(new AppError(`Pcouldnt find the message`, 404))
  }

  res.status(200).json({
    status: "success",
    accessToken: res.locals?.accessToken || null,
    data: message,
  });

})

exports.updateMessage = catchAsync(async (req,res,next)=>{

  const message = await Message.findByIdAndUpdate(req.params.id,req.body,{
    new:true,runValidators:true
  })

  if(!message){
    return next(new AppError(`couldnt find the message`, 404))
  }

    res.status(200).json({
    status: "success",
    accessToken: res.locals?.accessToken || null,
    data: message,
  });
  
})


// const Message = require('../models/messageModel');
// const catchAsync = require('../utils/catchAsync');

// exports.createMessage = catchAsync(async (req, res, next) => {
//   const message = await Message.create({ ...req.body, from: req.user.id });

//   res.status(201).json({
//     status: "successfully created",
//     accessToken: res.locals?.accessToken || null,
//     data: message
//   });
// });

// exports.updateMessage = catchAsync(async (req, res, next) => {
//   const { readStatus } = req.body;

//   const message = await Message.findByIdAndUpdate(
//     req.params.id,
//     { readStatus },
//     { new: true }
//   );

//   if (!message) {
//     return next({ status: 404, message: "Message not found" });
//   }

//   res.status(200).json({
//     status: "successfully updated",
//     accessToken: res.locals?.accessToken || null,
//     data: message
//   });
// });

// exports.getAllMessages = catchAsync(async (req, res, next) => {
  
//   let query = Message.find({ to: req.user.id }).sort('-createdAt');


//   const page = req.query.page * 1 || 1;
//   const limit = req.query.limit * 1 || 10;
//   const skip = (page - 1) * limit;

//   const numDocs = await Message.countDocuments({ to: req.user.id });
//   if (req.query.page && skip >= numDocs) {
//     return next({ status: 404, message: "page doesnt exist" })
//   }

//   query = query.skip(skip).limit(limit);


//   const messages = await query;

//   res.status(200).json({
//     status: "success",
//     results: messages.length,
//     accessToken: res.locals?.accessToken || null,
//     data: messages,
//   });
// });
