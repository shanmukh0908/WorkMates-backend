const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");
const User = require('../models/userModel');
const { findByIdAndUpdate } = require("../models/taskModel");

exports.getUser = catchAsync(async (req, res, next) => {
  console.log(req.user.id);

  const user = await User.findById(req.user.id);

  return res.status(200).json({
    status: "success",
    accessToken: res.locals?.accessToken || null,
    data: { user },
  });
});

exports.updateUserDetails = catchAsync( async (req,res,next) =>{
  console.log(req.user.id);
  const data = { ...req.body }
  console.log(data)
  const userData = await User.findByIdAndUpdate((req.user.id),data,{ new: true})
  console.log("@@@@user",userData)
  return res.status(200).json({
    status: "success",
    accessToken: res.locals?.accessToken || null,
    data: { userData },
  });
})

exports.updateEmailPassWord =  catchAsync(async (req,res,next) =>{
  const user = await User.findById(req.user.id).select('+password');

  if(req.body.password){

  if (
    !(await user.verifypassword(
      req.body.currentPassword,
      user.password
    ))
  ) {
    return next(new AppError('Your current password is wrong', 401));
  }
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;

  }

  if(req.body.email?.trim().length > 0){
  user.email = req.body.email;
  }

  await user.save();
 
  console.log("@@@@user",user)

  return res.status(200).json({
    status: "success",
    accessToken: res.locals?.accessToken || null,
    data: { user },
  });
})