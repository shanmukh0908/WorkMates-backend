const mongoose = require('mongoose')
const validator = require('validator')
const User = require('./userModel')

const taskSchema = new mongoose.Schema(
  {
    createdBy: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      required: true
    },

    interestedUsers: [
      {
        type: mongoose.Schema.ObjectId,
        ref: 'User'
      }
    ],

    acceptedBy: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      default: null
    },

    status: {
      type: String,
      enum: ['open', 'pending', 'assigned', 'completed'],
      default: 'open'
    },

    markedAsCompleteByAcceptedBy :{
      type : Boolean,
      default:false
    },

    markedAsCompleteByCreatedBy :{
      type : Boolean,
      default:false
    },

    category: {
      type: String,
      required: [true, 'Please fill the category field']
    },

    taskDescription: {
      type: String,
      required: [true, 'Please describe the task']
    },

    taskImages: [{ type: String }],

    amountOffered: {
      type: Number,
      required: true,
      min: 0
    },

    negotiable: {
      type: Boolean,
      default: false
    },

    taskLocation: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point',
        required: true
      },
      coordinates: {
        type: [Number],
        required: true,
        validate: {
          validator: function (val) {
            return val.length === 2;
          },
          message: 'Coordinates must be [longitude, latitude]'
        }
      }
    },

    priceoffered: {
      type: Number,
      min: 0
    },

    message: {
      type: String
    }
  ,
  date: {
    type:Date,
    default: Date.now()
  }
}
  ,
  { timestamps: true }
);

// Geospatial index
taskSchema.index({ taskLocation: '2dsphere' });

taskSchema.post('save', async function(doc, next) {
  await doc.populate({
    path: 'createdBy',
    select: 'name id profilePhoto'
  });
  next();
});

taskSchema.pre(/^find/,function(next){
  this.populate({
    path: 'createdBy',
    select: 'name id profilePhoto'
  })
  next();
})

const Task = mongoose.model('Task',taskSchema)
module.exports = Task 