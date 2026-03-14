const catchAsync = require("../utils/catchAsync");
const WorkMate = require("../models/workMateModel");
const User = require("../models/userModel")
const AppError = require("../utils/appError");
const mongoose = require("mongoose");

// exports.createWorkMate = catchAsync(async (req,res,next)=>{
//     const body = {...req.body,workMate:req?.user._id}
//     console.log(body)
//     const data = await WorkMate.create(body)
//     res.status(201).json({
//         status:'success',
//         accessToken: res.locals?.accessToken || null,
//         data
//     })
// })



exports.createWorkMate = catchAsync(async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const body = {
      ...req.body,
      workMate: req.user._id,
    };

    // 1️⃣ Create WorkMate (pre-save hook runs here)
    const workMate = await WorkMate.create([body], { session });

    // 2️⃣ Update User skills (avoid duplicates)
    const updatedUser = await User.findByIdAndUpdate(
      req.user._id,
      { $addToSet: { skills: { $each: req.body.skills } } },
      { new: true, session }
    );

    // 3️⃣ Commit transaction
    await session.commitTransaction();
    session.endSession();

    res.status(201).json({
      status: "success",
      accessToken: res.locals?.accessToken || null,
      data: {
        workMate: workMate[0],
        updatedUser,
      },
    });

  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    next(err);
  }
});

exports.getAllWorkMates = catchAsync(async (req, res, next) => {
  const { page = 1, limit = 20, distance, location, skills } = req.query;
  console.log("from get workates >>>>///....",req.query,location)

  let lng, lat;

  if (location) {
    const parts = location.split(",");
    if (parts.length !== 2) {
      return next(new AppError("Invalid location format", 400));
    }

    lng = Number(parts[0]);
    lat = Number(parts[1]);
  } else {
    [lng, lat] = req.user.location.coordinates;
  }
  
  console.log("from get all work mates",lat,lng)

  if (!lng || !lat) {
    return next(new AppError("User location not set", 400));
  }

  const skip = (page - 1) * limit;

  let pipeline = [];

  
  pipeline.push({
    $geoNear: {
    near: {
      type: "Point",
      coordinates: [parseFloat(lng), parseFloat(lat)]
    },
    distanceField: "distanceFromUser",
    spherical: true,
    distanceMultiplier: 0.001   // converts meters → km
  }
  });

  let match = {};


  if (skills) {
    console.log("****",skills)
    const skillArray = skills.split(",").map(s => s.trim());
    match.skills = { $in: skillArray.map(s => new RegExp(`^${s}$`, "i"))};

    // if ALL skills required (AND logic)
    // match.skills = { $all: skillArray };
  }

  // Add other filters dynamically (except banned fields)
  Object.keys(req.query).forEach((key) => {
    if (!["page", "limit", "sort", "location", "distance", "skills"].includes(key)) {
      match[key] = req.query[key];
    }
  });

  if (Object.keys(match).length > 0) {
    pipeline.push({ $match: match });
  }

  // SORT
  if (req.query.sort) {
    const sortObj = {};
    req.query.sort.split(",").forEach((field) => (sortObj[field] = 1));
    pipeline.push({ $sort: sortObj });
  } else {
    pipeline.push({ $sort: { distanceFromUser: 1 } }); // closest first
  }

  // PAGINATION
  pipeline.push({ $skip: Number(skip) });
  pipeline.push({ $limit: Number(limit) });

  pipeline.push(
    {
      $lookup: {
        from: "users",            // collection name
        localField: "workMate",   // ID in WorkMate model
        foreignField: "_id",      // matching field in User model
        as: "workMate"
      }
    },
    { $unwind: "$workMate" }      // convert array into object
  );

  const workmates = await WorkMate.aggregate(pipeline);

  res.status(200).json({
    status: "success",
    results: workmates.length,
    accessToken: res.locals?.accessToken || null,
    data: workmates
  });
});
