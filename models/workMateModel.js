const mongoose = require('mongoose');
const AppError = require('../utils/appError');

const workMateSchema = new mongoose.Schema({
  workMate: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: [true, "Bad request: no user details received"],
  },
   location: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point',
    },
    coordinates: {
      type: [Number],
      required: false,
    }
  },
  skills: {
    type: [String],      
    required: [true, "At least one skill is required"],
  },
});

workMateSchema.index({ location: '2dsphere' });

workMateSchema.pre('save', async function (next) {
  if (!this.isModified('workMate')) return next();

  const user = await mongoose.model('User')
    .findById(this.workMate)
    .select('location');
  
  console.log("USER LOCATION: >>>> from workmates", user.location);
    
  if (!user || !user.location) {
    return next(new AppError("User location not found"));
  }

  this.location = user.location;

  next();
});

 workMateSchema.pre(/^find/, function (next) {
  this.populate({
    path: 'workMate',
  });
  next();
});

const WorkMate = mongoose.model('WorkMate', workMateSchema);

module.exports = WorkMate;
