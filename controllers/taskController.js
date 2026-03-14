const User = require('../models/userModel');
const Task = require('../models/taskModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const { getDistance } = require('geolib')

exports.tasksWithInDistance = catchAsync(async (req, res, next) => {
  console.log(req.params)
  const { distance } = req.params;
  const latlng = req.params.latlng
  const [lng,lat] =  latlng.split(',')
  console.log(lng,lat)

  if (!lat || !lng) {
    return next(new AppError("User location not set", 401));
  }

  const tasksWithInDistance = await Task.find({
    taskLocation: {
      $near: {
        $geometry: { type: "Point", coordinates: [lat, lng] },
        $maxDistance: distance * 1000
      }
    }
  }).lean();

  const userLocation = { latitude: lat, longitude: lng };

    tasksWithInDistance.forEach((task)=>{
    const [tasklng,tasklat] = task.taskLocation.coordinates
    const taskLocation = { latitude: tasklat, longitude: tasklng };
    const distanceInMeters = getDistance(userLocation, taskLocation);
    task.distanceFromUser = distanceInMeters/1000
  })

  res.status(200).json({
    status: "success",
    results: tasksWithInDistance.length,
    accessToken: res.locals?.accessToken || null,
    data: { tasks: tasksWithInDistance }
  });
});


exports.getAllTasks = catchAsync(async (req, res, next) => {
  // 1) Filtering
  let queryObj = { ...req.query };
  // const [lng, lat] = req.user.location?.coordinates || [];
  const [lng, lat] = req.query?.location?.split(",") || req.user.location?.coordinates || [] ;
  console.log(queryObj,"*****")
  const excludedFields = ['page', 'sort', 'limit', 'fields','date','location','distance','or'];
  excludedFields.forEach(el => delete queryObj[el]);
  let queryStr = JSON.stringify(queryObj);
  queryStr = queryStr.replace(/\b(gte|gt|lte|lt)\b/g, match => `"$${match}"`).replace('"{','{').replace('}"','}');
  console.log("querystrng",queryStr)
  console.log(JSON.parse(queryStr),"parsed")

  let query

  if(req.query.or){
    console.log("or here",JSON.parse(req.query.or))
    query = Task.find(
      {
        $or:JSON.parse(req.query.or)
      }
    )
  }

  if (req.query.distance) {
    const distance = parseFloat(req.query.distance);
    if (!lat || !lng)
      return next(new AppError("User location not set", 401));

    query = Task.find({
      taskLocation: {
        $near: {
          $geometry: { type: "Point", coordinates: [lng*1, lat*1] },
          $maxDistance: distance * 1000
        }
      }
    });
  }

  if(query){
    query = query.find(JSON.parse(queryStr));
  }
  else{
    query = Task.find(JSON.parse(queryStr));
  }
  
  //filtering date 
  if(req.query.date){
    const dateObj = JSON.parse(req.query.date)
    console.log(dateObj,"***/////")
    let from 
    let to 
    if (dateObj.from) {
    from = new Date(dateObj.from);
    to = new Date(dateObj.to); 
    }
    else{
    from = new Date(req.query.date)
    to = new Date(from);
    to.setDate(to.getDate() + 1); 
    }
   query = query.find({
   date: {
    $gte: from,
    $lt: to
   }
});
  }

  // 2) Sorting
  if (req.query.sort) {
    const sortBy = req.query.sort.split(',').join(' ');
    query = query.sort(sortBy);
  } else {
    query = query.sort('-createdAt'); // default sort
  }

  // 3) Field limiting
  if (req.query.fields) {
    const fields = req.query.fields.split(',').join(' ');
    query = query.select(fields);
  } else {
    query = query.select('-__v');
  }

  // 4) Pagination
  const page = req.query.page * 1 || 1;
  const limit = req.query.limit * 1 || 1000000;
  const skip = (page - 1) * limit;

  const numDocs = await Task.countDocuments(JSON.parse(queryStr));
  if (req.query.page && skip >= numDocs) {
    return next(new AppError("Page does not exist", 404));
  }

  query = query.skip(skip).limit(limit);

  // 5) Execute query
  const tasks = await query.lean();

  const userLocation = { latitude: lat, longitude: lng };

  tasks.forEach((task)=>{
    const [tasklng,tasklat] = task.taskLocation.coordinates
    const taskLocation = { latitude: tasklat, longitude: tasklng };
    const distanceInMeters = getDistance(userLocation, taskLocation);
    task.distanceFromUser = distanceInMeters/1000
  })

  // 6) Send response
  res.status(200).json({
    status: "success",
    results: tasks.length,
    accessToken: res.locals?.accessToken || null,
    data: tasks
  });
});


exports.createTask = catchAsync(async (req, res, next) => {
  req.body.negotiable = req.body.negotiable === 'true';
  req.body.price = req.body.price * 1;
  if (typeof req.body.taskLocation === 'string') {
    req.body.taskLocation = JSON.parse(req.body.taskLocation);
  }

  const taskData = { 
    ...req.body, 
    createdBy: req.user._id  
  };

  console.log(taskData,"*****task data ****")

const tasks = await Task.create(taskData);

  res.status(201).json({
    status: "success",
    accessToken: res.locals?.accessToken || null,
    data: tasks
  });
});



exports.updateTask = catchAsync(async (req, res, next) => {
  const updateData = req.body;
  const updatedTask = await Task.findByIdAndUpdate(
    req.params.id,
    updateData,
    { new: true, runValidators: true }
  );

  if (!updatedTask) {
    return next(new AppError("Task not found", 404));
  }

  res.status(200).json({
    status: "success",
    accessToken: res.locals?.accessToken || null,
    data: updatedTask
  });
});



// const User = require('../models/userModel')
// const Task = require('../models/taskModel')
// const catchAsync = require('../utils/catchAsync');
// const { json } = require('express');

// exports.tasksWithInDistance = catchAsync(async (req, res, next) => {
//     const { distance } = req.params;
//     const [lng, lat] = req.user.location?.coordinates || [];
  
//     if (!lat || !lng) {
//        return next({ status: 401, message: "user location not set" });
//     }
  
//     const tasksWithInDistance = await Task.find({
//       taskLocation: {
//         $near: {
//           $geometry: { type: "Point", coordinates: [lng, lat] },
//           $maxDistance: distance * 1000
//         }
//       }
//     });
  
//     res.status(200).json({
//         status: "success",
//         results: tasksWithInDistance.length,
//         accessToken: res.locals?.accessToken || null,
//         data: {
//           tasks: tasksWithInDistance
//         }
//       });
      
//   });

//   exports.getAllTasks = catchAsync(async (req, res, next) => {
//   // 1) Filtering
//   let queryObj = { ...req.query };
//   const excludedFields = ['page', 'sort', 'limit', 'fields'];
//   excludedFields.forEach(el => delete queryObj[el]);

//   let queryStr = JSON.stringify(queryObj);
//   queryStr = queryStr.replace(/\b(gte|gt|lte|lt)\b/g, match => `$${match}`);

//   let query = Task.find(JSON.parse(queryStr));

//   // 2) Sorting
//   if (req.query.sort) {
//     const sortBy = req.query.sort.split(',').join(' ');
//     query = query.sort(sortBy);
//   } else {
//     query = query.sort('-createdAt'); // default sort
//   }

//   // 3) Field limiting
//   if (req.query.fields) {
//     const fields = req.query.fields.split(',').join(' ');
//     query = query.select(fields);
//   } else {
//     query = query.select('-__v');
//   }

//   // 4) Pagination
//   const page = req.query.page * 1 || 1;
//   const limit = req.query.limit * 1 || 9;
//   const skip = (page - 1) * limit;

//   const numDocs = await Task.countDocuments(JSON.parse(queryStr));
//   if (req.query.page && skip >= numDocs) {
//     return next({ status: 404, message: "page doesnt exist" });
//   }

//   query = query.skip(skip).limit(limit);

//   // 5) Execute query
//   const tasks = await query;

//   // 6) Send response
//   res.status(200).json({
//     status: "success",
//     results: tasks.length,
//     accessToken: res.locals?.accessToken || null,
//     data: tasks
//   });
// });


// exports.createTask = catchAsync(async (req, res, next) => {

//   req.body.negotiable = req.body.negotiable === 'true';
//   req.body.price = req.body.price*1;
//    if (typeof req.body.taskLocation === 'string') {
//   req.body.taskLocation = JSON.parse(req.body.taskLocation);
// }

//   const taskData = { 
//     ...req.body, 
//     createdBy: req.user._id  
//   };

//   const task = await Task.create(taskData);

//   res.status(201).json({
//     status: "task creation successful",
//     accessToken: res.locals?.accessToken || null,
//     data: task
//   });
// });

// exports.updateTask = catchAsync(async (req, res, next) => {
//   const updateData = req.body;
//   const updatedTask = await Task.findByIdAndUpdate(
//     req.params.id,         
//     updateData,
//     { new: true, runValidators: true }  // ✅ return updated doc, validate
//   );

//   if (!updatedTask) {
//     return next({ status: 404, message: "Task not found" });
//   }

//   res.status(200).json({
//     status: "task updation successful",
//     accessToken: res.locals?.accessToken || null,
//     data: updatedTask
//   });
// });


// exports.getAllTasks = catchAsync(async (req, res, next) => {
//   const [lng, lat] = req.user.location?.coordinates || [];
//   if (!lat || !lng)
//     return next(new AppError("User location not set", 401));

//   const distance = parseFloat(req.query.distance) || 100000; // default: 100 km
//   const page = parseInt(req.query.page) || 1;
//   const limit = parseInt(req.query.limit) || 10;
//   const skip = (page - 1) * limit;

//   // Prepare filters
//   const excludedFields = ['page', 'sort', 'limit', 'fields', 'distance', 'date'];
//   const queryObj = { ...req.query };
//   excludedFields.forEach(el => delete queryObj[el]);

//   let filters = JSON.stringify(queryObj);
//   filters = filters.replace(/\b(gte|gt|lte|lt)\b/g, match => `"$${match}"`).replace('"{','{').replace('}"','}');
//   filters = JSON.parse(filters);

//   if(req.query.date){
//     const dateObj = JSON.parse(req.query.date)
//     let from 
//     let to 
//     if (dateObj.from) {
//     from = new Date(dateObj.from);
//     to = new Date(dateObj.to); 
//     }
//     else{
//     from = new Date(req.query.date)
//     to = new Date(from);
//     to.setDate(to.getDate() + 1); 
//     }
//    filters.date = {$gte:from,$lt: to}
//   };

//   let sort = {}
//   if (req.query.sort) {
//      sort[`${req.query.sort}`] = 1
//   } else {
//     sort = {createdAt:-1}; // default sort
//   }

//   const pipeline = [
//   {
//     $geoNear: {
//       near: { type: 'Point', coordinates: [lng, lat] },
//       distanceField: 'distanceFromUser',
//       spherical: true,
//       maxDistance: distance * 1000,
//       key: 'taskLocation'
//     }
//   },

//   { $match: filters },

//   {
//     $lookup: {
//       from: 'users',
//       localField: 'createdBy',
//       foreignField: '_id',
//       as: 'createdBy'
//     }
//   },

//   { $unwind: "$createdBy" },

//   { $sort: sort },

//   { $skip: skip },

//   { $limit: limit },

//   {
//     $project: {
//       interestedUsers: 1,
//       distanceFromUser:1,
//       acceptedBy: 1,
//       status: 1,
//       category: 1,
//       taskDescription: 1,
//       taskImages: 1,
//       amountOffered: 1,
//       negotiable: 1,
//       taskLocation: 1,
//       priceoffered: 1,
//       message: 1,
//       "createdBy.name": 1,
//       "createdBy.id": "$createdBy._id"
//     }
//   }
// ];

//   const tasks = await Task.aggregate(pipeline);

//   res.status(200).json({
//     status: 'success',
//     results: tasks.length,
//     accessToken: res.locals?.accessToken || null,
//     data: tasks,
//   });

//   }
// )
