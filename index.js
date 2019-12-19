const express = require('express');
const app = express();
const mongoose = require('mongoose');
// Routes
const userRoutes = require('./routes/userRoutes')


app.use(express.json());




app.get('./', (req,res) => {
    if(req.url === "./favicon"){

    }
})
app.use('/api',userRoutes);


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
