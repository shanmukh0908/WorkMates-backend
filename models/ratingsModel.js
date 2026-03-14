const mongoose = require('mongoose');
const User = require('./userModel');

const ratingSchema = new mongoose.Schema({
  rating: {
    type: Number,
    min: 0,
    max: 5,
    required: true
  },
  ratedBy: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: true
  },
  ratedTo: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: true
  },
  task: {
    type: mongoose.Schema.ObjectId,
    ref: 'Task',
    required: true
  }
});

// Prevent duplicate rating (one user can rate another user once per task)
ratingSchema.index({ ratedBy: 1, ratedTo: 1, task: 1 }, { unique: true });

ratingSchema.statics.calcAverageRatings = async function(userId) {
  const stats = await this.aggregate([
    { $match: { ratedTo: userId } },
    { $group: {
        _id: '$ratedTo',
        nratings: { $sum: 1 },
        avgratings: { $avg: '$rating' }
    }}
  ]);

  if (stats.length > 0) {
    await User.findByIdAndUpdate(userId, { rating: stats[0].avgratings });
  } else {
    await User.findByIdAndUpdate(userId, { rating: 0 });
  }
};

// Trigger recalculation on save
ratingSchema.post('save', function() {
  this.constructor.calcAverageRatings(this.ratedTo);
});

// Trigger recalculation on update & delete
ratingSchema.post(/^findOneAnd/, async function(doc) {
  if (doc) {
    await doc.constructor.calcAverageRatings(doc.ratedTo);
  }
});

const Rating = mongoose.model('Rating', ratingSchema);
module.exports = Rating;


module.exports = Rating;


