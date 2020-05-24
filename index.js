
require('dotenv').config();
const express = require('express');
const app = express();
const http = require('http').createServer(app);
const PORT = 5000 || process.env.PORT;
const path = require('path')
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



app.use(express.static(path.join(__dirname, 'client/build')));
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

app.use('/auth',authRoutes);
app.use('/api',userRoutes);
app.use('/api',groupRoutes);
app.use('/api', billRoutes);
app.use('/api', activityRoutes);
app.use('/api', friendRoutes)

app.get('/*', (req,res) => {
    /* preventing double request from chrome*/
    if(req.url === "./favicon"){
    }
    res.sendFile(path.join(__dirname, 'client', 'build', 'app.html'));
})
// ErrorHandling middleware
app.use((err, req,res,next) => {
    handleError(err, res);
})

mongoose.connect(process.env.MONGOURI, {useNewUrlParser: true, useUnifiedTopology: true})
.then(
    () => {    
          http.listen(PORT, () => {
            console.log(PORT + "is the port number");
          });
          io.on('connection', (socket) => {
                    /* MAKE MODULE AND UPDATE SOCKET CONNECTION WITH USERS ID LATER ON */
                    /* CHECK FOR CONNECTON AND UPDATE CONNECTED USER [TODO LATER ON] */
                    /* DATA NOT AVAILABLE ON CONNECTION*/
                    /*just one way clean up later on */
                    socket.on("loggedIn", (userData) => {
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
