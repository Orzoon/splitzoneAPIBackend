
require('dotenv').config();
const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const passport = require('passport');
/*  Oauth  */
const authRoutes = require('./routes/authRoutes');
const authConfig = require('./config/authConfig');

/* ROUTES */
const userRoutes = require('./routes/userRoutes');
const groupRoutes = require('./routes/groupRoutes');
const billRoutes = require('./routes/billRoutes');
const activityRoutes = require('./routes/activityRoutes');
const friendRoutes = require('./routes/friendRoutes');

/*----------BodyParser-------------*/
app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());

/*------------------HEADERS--------------*/
app.use((req,res,next) => {
    res.setHeader("Access-Control-Allow-origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "POST, GET, PATCH, DELETE");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
    next();
})
app.use(passport.initialize())

/*---------ROUTES-----------*/
app.get('/', (req,res) => {
    if(req.url === "./favicon"){
    
    }
    res.status(200).send();
})

app.use('/auth',authRoutes);
app.use('/api',userRoutes);
app.use('/api',groupRoutes);
app.use('/api', billRoutes);
app.use('/api', activityRoutes);
app.use('/api', friendRoutes)



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
