
require('dotenv').config();
const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const mongoose = require('mongoose');

// Routes
const userRoutes = require('./routes/userRoutes');
const groupRoutes = require('./routes/groupRoutes');
const billRoutes = require('./routes/billRoutes');
const activityRoutes = require('./routes/activityRoutes');

/*----------BodyParser-------------*/
app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());

/*------------------HEADERS--------------*/
app.use((req,res,next) => {
    res.setHeader("Access-Control-Allow-origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "POST", "GET", "PATCH", "DELETE");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization", "Content-Type, application/json");
    next();
})


/*---------ROUTES-----------*/
app.get('/', (req,res) => {
    if(req.url === "./favicon"){
    
    }
    res.status(200).send();
})
app.use('/api',userRoutes);
app.use('/api',groupRoutes);
app.use('/api', billRoutes);
app.use('/api', activityRoutes);



mongoose.connect('mongodb://localhost:27017/splitzone', {useNewUrlParser: true, useUnifiedTopology: true})
.then(
    () => {
        app.listen(5000, () => {
          console.log('listening')
        })
    },
    error => {
    console.log(error)
    }
)
mongoose.set('useCreateIndex', true);
