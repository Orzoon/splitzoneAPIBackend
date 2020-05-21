
require('dotenv').config();
const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('./util/socket').init(http);
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

const {handleError} = require('./util/error');
const socketModal = require('./modals/socketModel');
/* OTHER HEADERS MIDDLEWARE --> TO ADD */
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

// ErrorHandling middleware
app.use((err, req,res,next) => {
    handleError(err, res);
})

mongoose.connect('mongodb://localhost:27017/splitzone', {useNewUrlParser: true, useUnifiedTopology: true})
.then(
    () => {    
          http.listen(5000, () => {
            console.log('listening on *:3000');
          });
          io.on('connection', (socket) => {

                    // only check and update the collection once logged in -
                    // console.log("socketID", socket.id)
                    // console.log("query", socket.handshake.query['userID'])
                    // const userID = socket.handshake.query['userID'];
                    // const reSocketID = socket.id;
                    // console.log("reSokcetID", reSocketID)
                    // if(userID && reSocketID){
                    //     ReEstablishment()
                    // }

                    // async function ReEstablishment(){
                    //     try{
                    //         const userExistsOnTheSocket = await socketModal.findOne({userId: userID})
                    //         if(userExistsOnTheSocket){
                    //             userExistsOnTheSocket.socketId = reSocketID;
                    //             await userExistsOnTheSocket.save();
                    //         }
                    //     }catch(e){
                    //         console.log("errorOccured",error)
                    //     }
                    // }

                    /*Events on Connection*/
                    /* loggedIm */
                    socket.on("loggedIn", (userData) => {
                        console.log("userData", userData)
                        async function saveLoginUser (){
                            try{
                                const connected = await socketModal.findOne({userEmail: userData.userEmail})
                                if(connected){
                                    connected.socketId = socket.id;
                                    await connected.save();
                                    return 
                                }
                                // if user is not set previously set now
                                const newSocketUser = new socketModal({socketId: socket.id, userEmail: userData.userEmail, userId: userData.userId})
                                await newSocketUser.save();
                                // fire some event later on
                                return
                            }catch(error){
                                // fire some error events 
                                return 
                            }
                        }
                        saveLoginUser();
                    })
          });
    },
    error => {
    console.log(error)
    }
)
mongoose.set('useCreateIndex', true);
