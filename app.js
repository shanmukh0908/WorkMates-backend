const express = require('express')
const morgan = require('morgan')
const cookieParser = require("cookie-parser");
const path = require('path');
const cors = require('cors');

const userRouter = require('./routes/userRoutes')
const taskRouter = require('./routes/taskRoutes')
const messageRouter = require('./routes/messageRoutes')
const notificationRouter = require('./routes/notificationRoutes')
const ratingRouter = require('./routes/ratingsRoute')
const savedTasksRouter = require('./routes/savedTasksRoutes')
const workMateRouter = require('./routes/workMateRoutes')
const globalErrorHandler = require('./controllers/errorController') 


const app = express()
app.use(morgan("dev"));
app.use('/public', express.static(path.join(__dirname,'public')));

const allowedOrigins = [
      "http://localhost:5173", 
      "http://localhost:5174", 
       process.env.FRONTEND_URL 
    ];

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl) 
    // or if the origin is in our allowed list
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));

app.use(express.json());
app.use(cookieParser());
app.use(express.urlencoded({extended:true,limit:'10kb'}))

app.use('/api/v1/users',userRouter)
app.use('/api/v1/tasks',taskRouter)
app.use('/api/v1/messages',messageRouter)
app.use('/api/v1/notifications',notificationRouter)
app.use('/api/v1/ratings',ratingRouter)
app.use('/api/v1/savedtasks',savedTasksRouter)
app.use('/api/v1/workmates',workMateRouter)

app.use(globalErrorHandler)



module.exports = app