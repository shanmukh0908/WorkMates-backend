const mongoose = require('mongoose');

const savedTaskSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: [true, 'Bad request: user details not received'],
  },
  task: {
    type: mongoose.Schema.ObjectId,
    ref: 'Task',
    required: [true, 'Bad request: task details not received'],
  },
  savedAt: { type: Date, default: Date.now },
});


savedTaskSchema.index({ user: 1, task: 1 }, { unique: true });


// savedTaskSchema.pre(/^find/, function (next) {
//   this.populate({
//     path: 'task',
//     select: 'title description status category',
//   });
//   next();
// });

const SavedTask = mongoose.model('SavedTask', savedTaskSchema);

module.exports = SavedTask;
