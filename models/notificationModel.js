const mongoose = require('mongoose')

const notificationSchema = new mongoose.Schema(
    {

        user: {
             type: mongoose.Schema.ObjectId,
             required: [true, 'Notification must belong to a user'],
             ref: 'User' 
        },

        to:{
             type: mongoose.Schema.ObjectId,
             required: [true, 'notification reciever details are required'],
             ref: 'User' 
        },
            
        message:{
            type:String,
            required: [true, 'Notification message cannot be empty'],
        },

        readStatus:{
            type:Boolean,
            default:false
        }
    },
    { timestamps: true } // adds createdAt and updatedAt
)

const Notification = mongoose.model('Notification',notificationSchema)

module.exports = Notification