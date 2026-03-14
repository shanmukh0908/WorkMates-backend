require('dotenv').config();
const mongoose = require('mongoose');
const app = require('./app');

const port = process.env.PORT || 3000;
const DB = process.env.MONGO_URI;  // use MONGO_URI instead of DATA_BASE

// connect to database
mongoose.connect(DB)
  .then(() => console.log('Connected to DB',mongoose.connection.name))
  .catch(err => {
    console.error('DB connection error:', err);
    process.exit(1); 
  });

  app.get("/",(req,res)=>{
    res.send('workmates Mates backend is live!');
})



// start server
app.listen(port, () => {
  console.log(`App running on port ${port}...`);
});

