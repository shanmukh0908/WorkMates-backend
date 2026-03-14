const mongoose = require('mongoose')
// const Task = require("./taskModel")
// const User = require('./userModel')

const messageSchema = new mongoose.Schema(
  {
    from: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      required: [true, "bad request: sender details not received"]
    },
    to: {
      type: mongoose.Schema.ObjectId,
      ref: 'User', 
      required: [true, "bad request: receiver details not received"]
    },
    task:{
        type:mongoose.Schema.ObjectId,
        ref:'Task',
        default: null
    },
    taskStatus:{
      type:String,
      default:""
    },
    message: {
      type: String,
      required: [true, "message cannot be empty"]
    },
    readStatus:{
      type:Boolean,
      default:false
    },
    messageType:{
      type:String,
      default:"normal"
    }
  },
  { timestamps: true } // adds createdAt and updatedAt
);

messageSchema.index({ from: 1, to: 1, createdAt: -1 });

// messageSchema.post('save', async function (doc) {
//   await doc.populate([
//     { path: 'to', select: 'name id' },
//     { path: 'from', select: 'name id' }
//   ]);
// });

messageSchema.pre(/^find/, function (next) {
  this.populate({
    path: 'from',
    select: 'name id'
  }).populate({
    path: 'to',
    select: 'name id'
  });
  next();
});

const Message = mongoose.model('Message', messageSchema);

module.exports = Message;
