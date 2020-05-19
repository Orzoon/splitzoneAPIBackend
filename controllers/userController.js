const mongoose = require("mongoose");
const userModel = require('../modals/userModel');
const billModel = require("../modals/billModel");
const groupModel = require('../modals/groupModel');
const friendModel = require('../modals/friendModel');
const bcrypt = require('bcryptjs');
const jwt = require("jsonwebtoken");

/*  Express-Validator  */
const {body, validationResult} = require('express-validator');

/* Importing entire ActivityModals */
const userActivityModel = require("../modals/userActivityModel");
const friendActivityModel = require("../modals/friendActivityModel");
const groupActivityModel = require("../modals/groupActivityModel");
const billActivityModel = require("../modals/billActivityModel")

const {Errorhandler} = require("../util/error");

// single User API
const userSignin = async(req,res, next) => {
    try{
        /* validation errors */
        const errors = validationResult(req);
        if(!errors.isEmpty()){
            //return res.status(400).send({errors: errors.array()})
            throw new Errorhandler(400, errors.array())
        }
        
        const {email, password} = req.body;
        const userExists = await userModel.findOne({email: email});
        if(!userExists){
            //return res.status(400).send({error: 'user doesnot exist'})
            throw new Errorhandler(400, 'User doesnot exist')
        }
        const passwordCheck = await bcrypt.compare(password, userExists.password);
        if(!passwordCheck){
            //throw new Error('Invalid username or password');
            //return res.status(400).send({error: 'Invalid username or password'})
            throw new Errorhandler(400, 'Invalid username or password')
        }
        const token = jwt.sign({userID: userExists._id}, process.env.TOKENSECRET);
        const user = await userModel.findByIdAndUpdate(userExists._id, {$push: {"tokens": {token: token}}}, {useFindAndModify: false});
        const userObj = user.toObject();
        delete userObj.password;
        delete userObj.tokens;

        /* USER SIGNIN ACTIVITY */
        const userActivity = new userActivityModel({
            activityUserId: user._id, 
            activity: `signedIn`,
            invokedBy: {
                _id: mongoose.Types.ObjectId(user._id)
            }
        });
        await userActivity.save();

        // sending response
        return res.status(200).json({userObj, token});
    }
    catch(error){
       if(error){
           next(error)
       }
    }
}

const userSignup = async(req,res, next) => {
    try{
        // validation errors
        const errors = validationResult(req);
        if(!errors.isEmpty()){
            //return res.status(400).send({errors : errors.array()})
            throw new Errorhandler(400, errors.array())
        }
        const {email,password, name} = req.body;
        const exists = await userModel.findOne({email: email});
        if(exists){
            throw new Errorhandler (400, 'User already exists');
        }

        // check the existence of user in the friendCollection first
        let friendID = mongoose.Types.ObjectId();
        const userInFriendModel = await friendModel.findOne({"friends.email": email}, {friends:{$elemMatch: {'email': email}}});
        if(userInFriendModel){
            friendID = userInFriendModel.friends[0]._id;
        }
        const hashedPassword = await bcrypt.hash(password,10);
        const user = await new userModel({_id : mongoose.Types.ObjectId(friendID) ,email: email, password: hashedPassword, username: name, created: true});
        await user.save();

        const token = jwt.sign({userID: user._id}, process.env.TOKENSECRET);
        await userModel.findByIdAndUpdate(user._id, {$push: {"tokens": {token: token}}}, {useFindAndModify: false});
        const userObj = user.toObject();
        delete userObj.tokens;
        delete userObj.password;

        /* USER SIGNUPActivity ACTIVITY */
        const userActivity = new userActivityModel({
            activityUserId:user._id, 
            activity: `signedUp`,
            invokedBy: {
                _id: mongoose.Types.ObjectId(user._id)
            }
        });
        await userActivity.save();
        return res.status(201).json({userObj, token});
    }catch(error){
       if(error){
           next(error);
       }
    }

}

const getUser = async(req,res) => {
    try{
      return res.status(200).json(req.user);
    }
    catch(error){
        return res.status(500).send();
    }
}

const logoutUser = async(req,res, next) => {
    try{
        const user = await userModel.findOne({_id: mongoose.Types.ObjectId(req.user._id)})
        if(!user){
            throw new Errorhandler(400, "invalid attempt")
        }
        const filteredTokens = user.tokens.filter(token => token.token.toString() !== req.user.token.toString())
        user.tokens = filteredTokens;
        await user.save();

        // setting logout activity 
        return res.status(200).send();
    }
    catch(e){
        if(e){
            next(e)
        }
    }
}


/**  Validation **/
const validateUser = (type) => {
    switch(type){
        case "userSignUp":
            return [
                body('email')
                    .exists()
                    .isEmail()
                    .withMessage('Invalid email')
                    .normalizeEmail(),
                body('name')
                    .exists()
                    .notEmpty()
                    .withMessage('Name cannot be empty')
                    .isLength({min: 4})
                    .withMessage('Name should be at least 4 characters long'),
                body('password')
                    .exists()
                    .notEmpty()
                    .withMessage('Password field is required')
                    .isLength({min: 6})
                    .withMessage('Password should be at least 6 characters long')
            ]
            case "userSignIn":
                return [
                    body('email')
                        .exists()
                        .isEmail()
                        .withMessage('Invalid email')
                        .normalizeEmail(),
                    body('password')
                        .exists()
                        .notEmpty()
                        .withMessage('Password field is required')
                        .isLength({min: 6})
                        .withMessage('Password should be at least 6 characters long')
                ]
    }
}





/*********************************************/
/*------------ROUTES OTHER THAN USERS---------------------*/
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
            if(bill.paidBy._id.toString() !== req.user._id.toString() && bill.splittedAmongMembers.some(id => id.toString() === req.user._id.toString())){
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
            if(bill.paidBy._id.toString() !== req.user._id.toString() && bill.splittedAmongMembers.some(id => id.toString() === req.user._id.toString())){
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
                "totalBills" : 0,
                "totalBalance": 0,
                "summaryOverlay": false
            })
        }
        
        const groupIDArray = [];
        groups.forEach(group => groupIDArray.push(group._id))
        
        let billCount = 0;

        await Promise.all(groupIDArray.map(async(groupID) => {
            const bills = await billModel.find({ownerGroup: mongoose.Types.ObjectId(groupID)}).countDocuments();
            billCount += bills
        }))

        /* calculation Total balance*/
        /* total Balance --> bills paid by user, bills paid by other including a user */
        let totalBalance = 0;
        let summaryOverlay = false;
        await Promise.all(groupIDArray.map(async(groupID) => {
            const bills =await billModel.find({ownerGroup: mongoose.Types.ObjectId(groupID)});
            
            if(bills){
                bills.forEach(bill => {
                    // total balance is including lent and spent and including how much user owe to others
                    // if paid by user add total
                    if(bill.paidBy._id.toString() === req.user._id.toString()){
                        totalBalance += bill.paidAmount;

                        // setting overalyvalue
                        summaryOverlay = true;
                    }

                    // if paid by other then get the users share
                    if(bill.paidBy._id.toString() !== req.user._id.toString() && bill.splittedAmongMembers.some(id => id.toString() === req.user._id.toString())){
                        if(summaryOverlay !== true){
                            summaryOverlay = true
                        }
                        // divided equally
                        if(bill.dividedEqually){
                            const amountValue = bill.paidAmount/bill.splittedAmongMembers.length;
                            totalBalance += amountValue
                        }
                        if(!bill.dividedEqually){
                             // finding index of user
                            const userIndex = bill.divided.findIndex(item => item._id.toString()  === req.user._id.toString() )
                            const amountValue = bill.divided[userIndex].amount;
                            totalBalance += amountValue
                        }
                }
                })
            }
        }))

        // GroupsCount BillsCount terminate
        return res.status(200).json({
            "totalGroups": groups.length,
            "totalBills": billCount,
            "totalBalance": totalBalance,
            "summaryOverlay": summaryOverlay
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
        const {step} = req.query;
        if(!Number(step)){
            throw Error("not a number")
        }
        const sort = {createdAt: 1}

        // getting userActivity
        const userActivity = await userActivityModel.aggregate([
                                            {$match: {activityUserId: mongoose.Types.ObjectId(req.user._id)}},
                                            {$limit: 500*step},
                                            {$sort: sort}
        ])
       
        const groupsUserIsIn = await groupModel.find({"members._id": mongoose.Types.ObjectId(req.user._id)});
        const groupsArray = [];

        let groupActivity = [];

        // ------ START OF L1
        // groupsUserIsIn.forEach(group => groupsArray.push(group._id));

        // await Promise.all(groupsArray.map(async function(groupId){
        //     const groupActivities = await groupActivityModel.aggregate([
        //             {$match: {activityGroupId: mongoose.Types.ObjectId(groupId)}},
        //             {$limit: 500*step},
        //             {$sort: sort}
        //     ])

        //     if(groupActivities){
        //         groupActivity.push(...groupActivities)
        //     }
        // }))
        //----> END OF L 1

        /* CHANGED LOGIC TO INCLUDE ACTIVITES INTO REMOVED USERS */
        const groupActivities = await groupActivityModel.aggregate([
                        {$match: {"groupParties._id": mongoose.Types.ObjectId(req.user._id)}},
                        {$project: {groupParties: 0}},
                        {$limit: 500*step},
                        {$sort: sort}])
         groupActivity.push(...groupActivities)
        /* Added later since user in no longer present in group */
        // const deletedGroupActivities = await groupActivityModel.aggregate([
        //     {$match: {"groupParties._id": mongoose.Types.ObjectId(req.user._id)}},
        //     {$limit: 500*step},
        //     {$sort: sort}
        // ])
        //groupActivity.push(...deletedGroupActivities)


        const combinedActivityArray = [...userActivity, ...groupActivity];
        combinedActivityArray.sort((a, b) => {
            const firstDate = new Date(a.createdAt);
            const secondDate =  new Date(b.createdAt);
            return secondDate - firstDate
        })
        const removed = combinedActivityArray.splice(11*step,combinedActivityArray.length - 1);

        let stepInfo = {};
        if(combinedActivityArray.length > (10 * step)){
           combinedActivityArray.pop();
           stepInfo.exists = true;
           stepInfo.currentStep = step;
        }
        else {
            stepInfo.exists = false;
        }
        return res.status(200).json({activities: combinedActivityArray, stepInfo})
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
    getActivitySummary,
    logoutUser,
    validateUser
}