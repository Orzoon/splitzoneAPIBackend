const mongoose = require("mongoose");
const userModel = require('../modals/userModel');
const billModel = require("../modals/billModel");
const groupModel = require('../modals/groupModel');
const bcrypt = require('bcryptjs');
const jwt = require("jsonwebtoken");

/* Importing entire ActivityModals */
const userActivityModel = require("../modals/userActivityModel");
const friendActivityModel = require("../modals/friendActivityModel");
const groupActivityModel = require("../modals/groupActivityModel");
const billActivityModel = require("../modals/billActivityModel")


// single User API
const userSignin = async(req,res) => {

    const {email, password} = req.body;
    // check validation
    try{
        const userExists = await userModel.findOne({email: email});
        if(!userExists){
            throw new Error('User does not exist');
        }
        const passwordCheck = await bcrypt.compare(password, userExists.password);
        if(!passwordCheck){
            throw new Error('Invalid username or password');
        }
        const token = jwt.sign({userID: userExists._id}, process.env.TOKENSECRET);
        const user = await userModel.findByIdAndUpdate(userExists._id, {$push: {"tokens": {token: token}}}, {useFindAndModify: false});
        const userObj = user.toObject();
        delete userObj.password;
        delete userObj.tokens;
        const userActivity = new userActivityModel({activityUserId: user._id, activity: `you signed-in on ${new Date().toDateString()} at ${new Date().getHours()}:${new Date().getMinutes()} `});
        await userActivity.save();
        res.status(200).json({userObj, token});
    }
    catch(error){
        if(error.message){
            res.send({error: error.message})
        }
        else {
            res.send(error)
        }
    }
}

const userSignup = async(req,res) => {
    const {email,password, name} = req.body;
    // validate email and password
    //check for pre-exsisting data
    try{
        const exists = await userModel.findOne({email: email});
        if(exists){
            throw new Error ('User already exists');
        }
        const hashedPassword = await bcrypt.hash(password,10);
        const user = new userModel({email: email, password: hashedPassword, username: name});
        await user.save();
        const token = jwt.sign({userID: user._id}, process.env.TOKENSECRET);
        await userModel.findByIdAndUpdate(user._id, {$push: {"tokens": {token: token}}}, {useFindAndModify: false});
        const userObj = user.toObject();
        delete userObj.tokens;
        delete userObj.password;
        const userActivity = new userActivityModel({activityUserId: req.user._id, activity: `you created your Account on ${new Date().toDateString} at ${new Date().getHours()}:${new Date().getMinutes()} `});
        await userActivity.save();
        return res.status(200).json({userObj, token});
    }
    catch(error){
        if(error.message){
            return res.send({error: error.message})
        }
        else {
            return res.send(error)
        }
    
    }

}
const getUser = async(req,res) => {
    try{
      return res.json(req.user);
    }
    catch(error){
        return res.status(500).send();
    }
}

/*User Summary */
const getUserSummary = async(req,res) => {
    // based on Month and year
    try{
        const {currentMonth, previousMonth, year} = req.query;
        // check for queryLength
        if(Object.keys(req.query).length <= 0){
            throw new Error("invalid url parameters")
        }
        const allowedQuery = ["currentMonth", "previousMonth", "year"];
        const includes = Object.keys(req.query).some(item => allowedQuery.includes(item));
        if(!includes){
            throw new Error("unmatched url parameters")
        }

        /* 
        -----------getting all the groups first and checking for bills 
        */
        // getting groups 
        const userId = req.user._id;
        const groups= await groupModel.aggregate([
            {$match: {"members._id": mongoose.Types.ObjectId(userId)}},
            {$sort: {createdOn: 1}}
        ]).exec();
        if(!groups){
            return res.status(404).json({"msg": "data not found"})
        }
        const groupsArray = [];
        groups.forEach(item => {
            groupsArray.push(item._id)
        });

        /* 
        -----------getting all the groups first and checking for bills 
        */
        // getting bills
        const previousBills = [];
        const currentBills = [];
        //Date
        const date = new Date();
        const C_Month = date.getMonth();
        const C_Month_Date = date.getDate();
        // setting starting date
        const setStartDate = date.setDate(1);
        const startDate = new Date(setStartDate)
        const setEndDate = new Date().setDate(C_Month_Date)
        const endDate = new Date(setEndDate);

        // for previous month
        let preStartDate;
        let preEndDate;

        if((C_Month - 1) >= 0){
            preStartDate = new Date(date.getFullYear(), date.getMonth()-1, 1);
            preEndDate = new Date(date.getFullYear(), date.getMonth(), 0);
        }

        /* 
        -------loop Across all the groupsArray and push bills to currentBills 
        */
        // currentBills
        await Promise.all(groupsArray.map(async(groupID) => {
            const bills = await billModel.find({
                                ownerGroup: mongoose.Types.ObjectId(groupID),
                                $or: [{paidBy : mongoose.Types.ObjectId(req.user._id)}, {"splittedAmongMembers": mongoose.Types.ObjectId(req.user._id)}],
                                paidDate: {
                                    $gte: startDate,
                                    $lte: endDate
                                }
                            })
            currentBills.push(...bills)
        }))

        if((C_Month - 1) >= 0){
            // previous month bills
            await Promise.all(groupsArray.map(async(groupID) => {
                const bills = await billModel.find({
                                    ownerGroup: mongoose.Types.ObjectId(groupID),
                                    $or: [{paidBy : mongoose.Types.ObjectId(req.user._id)}, {"splittedAmongMembers": mongoose.Types.ObjectId(req.user._id)}],
                                    paidDate: {
                                        $gte: preStartDate,
                                        $lte: preEndDate
                                    }
                                })
                previousBills.push(...bills)
            }))
        }

        let currentRefined = [];
        let previousRefined = [];

        // Pushing data into currentRefinedArray
        currentBills.forEach(bill => {     
            // paidBy user and including user
            /* lent */
            if((bill.paidBy._id.toString() === req.user._id.toString()  && bill.splittedAmongMembers.some(id => id.toString()  === req.user._id.toString())) || (bill.paidBy._id.toString() === req.user._id.toString() && bill.splittedAmongMembers.some(id => id.toString() !== req.user._id.toString() ))){  
                // divided equally
                    if(bill.dividedEqually){
                        const amountValue = bill.paidAmount/bill.splittedAmongMembers.length;
                        const object = {
                            paidDate: bill.paidDate,
                            amount: amountValue
                        }
                        currentRefined.push(object)
                    }
                    // divided unequally
                    if(!bill.dividedEqually){
                        // finding index of user
                        const userIndex = bill.divided.findIndex(item => item._id.toString()  === req.user._id.toString())
                        const amountValue = bill.divided[userIndex].amount;
                        const object = {
                            paidDate: bill.paidDate,
                            amount: amountValue
                        }
                        currentRefined.push(object)
                    }
            }
    
            // paid by others including user
            /* Owe */
            if(bill.paidBy._id.toString() !== req.user._id.toString()){
                    // divided equally
                    if(bill.dividedEqually){
                        const amountValue = bill.paidAmount/bill.splittedAmongMembers.length;
                        const object = {
                            paidDate: bill.paidDate,
                            amount: amountValue
                        }
                        currentRefined.push(object)
                    }
                    if(!bill.dividedEqually){
                         // finding index of user
                         const userIndex = bill.divided.findIndex(item => item._id.toString()  === req.user._id.toString() )
                         const amountValue = bill.divided[userIndex].amount;
                         const object = {
                             paidDate: bill.paidDate,
                             amount: amountValue
                         }
                         currentRefined.push(object)
                    }
            }
        })

        previousBills.forEach(bill => {     
            // paidBy user and including user
            /* lent */
            if((bill.paidBy._id.toString()  === req.user._id.toString()  && bill.splittedAmongMembers.some(id => req.user._id.toString()   === id.toString() )) || (bill.paidBy._id.toString()  === req.user._id.toString()   && bill.splittedAmongMembers.some(id => req.user._id.toString()   !== id.toString() ))){
                    // divided equally
                    if(bill.dividedEqually){
                        const amountValue = bill.paidAmount/bill.splittedAmongMembers.length;
                        const object = {
                            paidDate: bill.paidDate,
                            amount: amountValue
                        }
                        previousRefined.push(object)
                    }
                    // divided unequally
                    if(!bill.dividedEqually){
                        // finding index of user
                        const userIndex = bill.divided.findIndex(item => item._id.toString()  === req.user._id.toString() )
                        const amountValue = bill.divided[userIndex].amount;
                        const object = {
                            paidDate: bill.paidDate,
                            amount: amountValue
                        }
                        previousRefined.push(object)
                    }
            }
    
            // paid by others including user
            /* Owe */
            if(bill.paidBy._id.toString()  !== req.user._id.toString() ){
                    // divided equally
                    if(bill.dividedEqually){
                        const amountValue = bill.paidAmount/bill.splittedAmongMembers.length;
                        const object = {
                            paidDate: bill.paidDate,
                            amount: amountValue
                        }
                        previousRefined.push(object)
                    }
                    if(!bill.dividedEqually){
                         // finding index of user
                         const userIndex = bill.divided.findIndex(item => item._id.toString()  === req.user._id.toString() )
                         const amountValue = bill.divided[userIndex].amount;
                         const object = {
                             paidDate: bill.paidDate,
                             amount: amountValue
                         }
                         previousRefined.push(object)
                    }
            }
        })

        // sorting the bills
        currentRefined.sort((a,b) => {
            const firstDate = new Date(a.paidDate);
            const secondDate =  new Date(b.paidDate);

            return firstDate - secondDate
        })
        previousRefined.sort((a,b) => {
            const firstDate = new Date(a.paidDate);
            const secondDate =  new Date(b.paidDate);

            return firstDate - secondDate
        })
        // merging similar dates
        const currentFinalRefined = Object.values(currentRefined.reduce((a, {paidDate, amount}) => {
                                    const getDate = new Date(paidDate).getDate();
                                    if(!a[getDate]){
                                    a[getDate] = Object.assign({}, {paidDate, amount})
                                    }
                                    else {
                                        a[getDate].amount += amount
                                    }
                                    return a;
                                    }, {}))

        const previousFinalRefined = Object.values(previousRefined.reduce((a, {paidDate, amount}) => {
                                    const getDate = new Date(paidDate).getDate();
                                    if(!a[getDate]){
                                    a[getDate] = Object.assign({}, {paidDate, amount})
                                    }
                                    else {
                                        a[getDate].amount += amount
                                    }
                                    return a;
                                 }, {}))

        return res.status(200).json({
            currentFinalRefined,
            previousFinalRefined
        })

    }catch(error){
        console.log("Consoleerror", error)
        if(error.message){
            res.send({error: error.message})
        }
        else {
            res.send(error)
        }
    }
}


const getUserMisc = async(req,res) => {
    try{
        const userID = req.user._id;

        const groups = await groupModel.find({"members._id": mongoose.Types.ObjectId(userID)});

        // groupCount 0 terminate
        if(!groups){
            return res.status(200).json({
                "totalGroups": 0,
                "totalBills" : 0
            })
        }
        
        const groupIDArray = [];
        groups.forEach(group => groupIDArray.push(group._id))
        
        let billCount = 0;

        await Promise.all(groupIDArray.map(async(groupID) => {
            const bills = await billModel.find({ownerGroup: mongoose.Types.ObjectId(groupID)}).countDocuments();
            billCount += bills
        }))

        // GroupsCount BillsCount terminate
        return res.status(200).json({
            "totalGroups": groups.length,
            "totalBills": billCount
        })



                          
    }catch(error){
        console.log(error)
    }

}


const getActivitySummary = async(req,res) => {
    try{

        // declare value for constants
        // const userActivity; //basedON user ID
        // const groupActivity;//basedonGroupID user is in
        // const billActivity;

        const sort = {'createdAt': 1}

        // getting userActivity
        const userActivity = await userActivityModel.aggregate([
                                            {$match: {activityUserId: mongoose.Types.ObjectId(req.user._id)}},
                                            {$limit: 10},
                                            {$sort: sort}
        ])
       
        const groupsUserIsIn = await groupModel.find({"members._id": mongoose.Types.ObjectId(req.user._id)});
        const groupsArray = [];
        let groupActivity = [];
        groupsUserIsIn.forEach(group => groupsArray.push(group._id));

        await Promise.all(groupsArray.map(async function(groupId){
            const groupActivities = await groupActivityModel.aggregate([
                    {$match: {activityGroupId: mongoose.Types.ObjectId(groupId)}},
                    {$limit: 6},
                    {$sort: sort}
            ])

            if(groupActivities){
                groupActivity.push(...groupActivities)
            }
        }))


        const combinedActivityArray = [...userActivity, ...groupActivity];
        combinedActivityArray.sort((a, b) => {
            const firstDate = new Date(a.createdAt);
            const secondDate =  new Date(b.createdAt);
            return secondDate - firstDate
        })

        const removed = combinedActivityArray.splice(11,combinedActivityArray.length - 1);
        return res.status(200).json(combinedActivityArray)
    }catch(error){
        console.log(error)
    }
}
module.exports = {
    userSignin,
    userSignup,
    getUser,
    getUserSummary,
    getUserMisc,
    getActivitySummary
}