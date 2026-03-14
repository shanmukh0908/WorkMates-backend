const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs')
const WorkMate = require("./workMateModel")



const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "name is required"]
    },
    email: {
      type: String,
      required: [true, "email is required"],
      unique: true, // usually for emails
      lowercase: true, // normalize emails
      validate: [validator.isEmail, "Please provide a valid email"]
    },
    password: {
      type: String,
      required: [true, "password is required"],
      minlength: 8,
      select: false
    },
    passwordConfirm: {
      type: String,
      required: [true, "passwordConfirm is required"],
      validate: {
        validator: function(el) {
          return el === this.password;
        },
        message: 'Passwords do not match'
      }
    },
    location: {
      type: {
        type: String,
        default: 'Point',
        enum: ['Point']
      },
      coordinates: {
        type: [Number],
        required: true
      },
      address: String,
    },
    rating:{
      type:Number,
      min:0,
      max:5,
    },

    passwordChangedAt: Date,
    
    profilePhoto:{
      type:String
    },

    skills:{
      type:[String],
    },
    
  }
);

userSchema.index({ location: '2dsphere' });

// remove passwordConfirm before saving
userSchema.pre('save', function(next) {
  this.passwordConfirm = undefined;
  next();
});

// encrypting password before saving to data base, runs when signedup and password modified

userSchema.pre('save', async function (next) {
  // Only run if password was modified
  if (!this.isModified('password')) return next();//when the password is being set for the first time, this.isModified('password') will return true, so your hashing logic runs for 1st time creation and also after password updation

  // If this is NOT a new document (i.e., password is being UPDATED, not first set)
  if (!this.isNew) {
    // Set passwordChangedAt to "just before now" to avoid token iat issues
    this.passwordChangedAt = Date.now() - 1;
  }
  // Hash the password
  this.password = await bcrypt.hash(this.password, 12);

  next();
});

userSchema.post('findOneAndUpdate', async function (doc) {
  if (!doc) return;

  // Only proceed if location was updated
  const update = this.getUpdate();
  const newLocation = update.location || update.$set?.location;

  if (!newLocation) return;

  // Update all WorkMates linked to this user
  await WorkMate.updateMany(
    { workMate: doc._id },
    { location: newLocation }
  );
});


// verify entered passowrd
userSchema.methods.verifypassword = async function(candidatePassword, storedHash) {
  return await bcrypt.compare(candidatePassword, storedHash)
}

userSchema.methods.isPasswordChangedAfterToken = function (tokenTimeStamp) {
  if (this.passwordChangedAt) {
    const changedAt = parseInt(this.passwordChangedAt.getTime() / 1000, 10);
    return tokenTimeStamp < changedAt; // true means password was changed after token
  }

  return false;
};


const User = mongoose.model('User', userSchema);

module.exports = User;


