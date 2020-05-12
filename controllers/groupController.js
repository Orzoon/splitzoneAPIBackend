const mongoose = require('mongoose');
const groupModel = require("../modals/groupModel");
const userModel = require("../modals/userModel");
const groupActivityModel = require("../modals/groupActivityModel")
const billModel = require("../modals/billModel");

const {Errorhandler} = require("../util/error")
const getGroups= async(req,res, next) => {
    //vaidation
    const userId = req.user._id;
    try{
        const groups= await groupModel.aggregate([
            {$match: {"members._id": mongoose.Types.ObjectId(userId)}},
            {$sort: {createdAt: -1}}
        ]).exec();
        if(groups){
           await Promise.all(groups.map(async(group) => {
               const billCount = await billModel.find({ownerGroup: mongoose.Types.ObjectId(group._id)}).countDocuments();
                console.log()
               group.billCount = billCount;
           }))
        }
        res.status(200).json(groups)
    }
    catch(error){
        if(error){
            next(error)
        }
    }
}

const getGroup = async(req,res,next) => {
    try {    
        const groupId = req.params.groupId.trim();
        if(groupId.length <= 0){
            //return res.status(400).send({'error': 'invalid attempt'})
            throw new Errorhandler(400, 'invalid attempt')
        }
        const group = await groupModel.findOne({_id: mongoose.Types.ObjectId(groupId), "members._id": mongoose.Types.ObjectId(req.user._id)});
        if(!group){
            //return res.status(400).send({"error": "group cannot be found"})
            throw new Errorhandler(400, 'group cannot be found')
        }
        const bgDetails = {}
        // send bills Details Info
        if(req.query.bgDetails === "true"){
            const totalBills = await billModel.find({ownerGroup: mongoose.Types.ObjectId(groupId)}).countDocuments();
            // setting count
            bgDetails.totalBills = totalBills;
            if(totalBills && totalBills === 0){
                bgDetails.totalBalance = 0;
                bgDetails.youLent = 0;
                bgDetails.youOwe = 0;
            }
            else{
                const Bills = await billModel.find({ownerGroup: mongoose.Types.ObjectId(groupId)});
                //OutterStroing
                let totalBalance = 0;
                let totalLent = 0;
                let totalOwe = 0;
                   /* lent */
                Bills.forEach(bill => {
                    totalBalance += bill.paidAmount;
                    // add totalBalanceHere
                    //paidByuser not including him
                    if((bill.paidBy._id.toString() === req.user._id.toString())  && (bill.splittedAmongMembers.every(id => req.user._id.toString() !== id.toString()))) {
                        totalLent += bill.paidAmount;
                    }
                    // paidBy user and including user 
                    /* lent */
                    if((bill.paidBy._id.toString()  === req.user._id.toString()) && (bill.splittedAmongMembers.some(id => req.user._id.toString() === id.toString()))){
                        // divided equally
                        if(bill.dividedEqually){
                            const amountShare = bill.paidAmount/bill.splittedAmongMembers.length;
                            const amountValue = bill.paidAmount - amountShare
                            totalLent += amountValue;
                        }
                        // divided unequally
                        if(!bill.dividedEqually){
                            // finding index of user
                            const userIndex = bill.divided.findIndex(item => item._id.toString()  === req.user._id.toString() )
                            const amountShare = bill.divided[userIndex].amount;
                            const amountValue = bill.paidAmount - amountShare
                            totalLent += amountValue;
                        }
                    }

                    // paid by others including user
                    /* Owe */
                    if(bill.paidBy._id.toString() !== req.user._id.toString() && bill.splittedAmongMembers.some(id => id.toString() === req.user._id.toString())){
                            // divided equally
                            if(bill.dividedEqually){
                                const amountValue = bill.paidAmount/bill.splittedAmongMembers.length;
                                totalOwe += amountValue;
                            }
                            if(!bill.dividedEqually){
                                 // finding index of user
                                 const userIndex = bill.divided.findIndex(item => item._id.toString()  === req.user._id.toString() )
                                 const amountValue = bill.divided[userIndex].amount;
                                 totalOwe += amountValue;
                            }
                    }                   

                })

                // setting values
                bgDetails.totalBalance = +totalBalance.toFixed(2);
                bgDetails.totalLent = +totalLent.toFixed(2);
                bgDetails.totalOwe = +totalOwe.toFixed(2);
            }
        }
        const groupObj = group.toObject();
        groupObj.bgDetails = bgDetails;
        return res.status(200).json(groupObj);
    }catch(error){
        if(error){
            next(error)
        }
    }
}

const postGroup = async(req,res, next) => {
    const allowedProperties = ["groupName"];
    const properties = Object.keys(req.body)
    const includes = properties.every(item => allowedProperties.includes(item))
    if(!includes){
        //return res.send({"error": "invalid properties"})
        throw new Errorhandler(400, 'invalid properties')
    }
    try{
        const group = new groupModel({groupName: req.body.groupName, createdBy: req.user.username, createdById: req.user._id, members: [{_id: mongoose.Types.ObjectId(req.user._id), name: req.user.username, email: req.user.email}]});
        await group.save();

        // setting group activity
        const invokedBy = {
            _id: req.user._id,
            name: req.user.username
        }

        /*GROUP ACTIVITY*/
        const groupActivity = new groupActivityModel({
            activityGroupId: group._id, 
            groupName: group.groupName,
            invokedBy: invokedBy,
            activity: `created`});
        await groupActivity.save();
        return res.status(200).json(group);
       
    }
    catch(error){
        if(error){
            next(error)
        }
    }
};
const updateGroup = async(req,res, next) => {
    
    if(req.params.groupId.length = 0 || !req.params.groupId){
        //return res.status(400).send({"error": "invalid group link"})
        throw new Errorhandler(400, 'invalid group link')
    }
    const allowedProperties = ["groupName", "members"];
    const properties = Object.keys(req.body)
    if(req.body.members){
        if(typeof(req.body.members) != "object"){
            //return res.status(400).send({"error": "invalid update attempt"})
            throw new Errorhandler(400, 'invalid update attempt')
        }
    }
    const includes = properties.every((item) => allowedProperties.includes(item));
    if(!includes){
        //return res.status(400).send({"error": "invalid update attempt"})
        throw new Errorhandler(400, 'invalid update attempt')
    }
    try{
        const group = await groupModel.findOne({"members._id": mongoose.Types.ObjectId(req.user._id), _id: mongoose.Types.ObjectId(req.params.groupId)}, {members: 1, groupName: 1});
        if(!group){
            throw new Error('Group doesnot exist, create one');
        }
        if(req.body.groupName){
            group.groupName = req.body.groupName
        }
        if(req.body.members){
            const check = group.members.every(item => {
                // cheking _id instead of an email
                if(item._id === (req.body.members[0]._id)){
                   return false
                }
                else {
                    return true
                }
            })
            if(check === false){
                throw new Error("cannot update existing user")
            }

            let members;
            if(req.params.action && req.params.action === "removeMember"){
                members = group.members.filter(member => member._id.toString() !== req.body.members[0]._id.toString())
                
            }else{
                members = [...group.members,...req.body.members]
            }
            group.members = members;
        }
        await group.save();

        /*GroupActivity*/
        const groupObj = group.toObject();

        /* check for activity status to set for updated_property */
        if(req.body.hasOwnProperty("groupName")){
            const groupActivity = new groupActivityModel({
                activityGroupId: groupObj._id,
                groupName: groupObj.groupName,
                invokedBy: {
                    _id: req.user._id,
                    name: req.user.username
                },
                activity: `changed groupName to ${groupObj.groupName}`
            })
            groupActivity.save();
        };

        if(req.body.hasOwnProperty("members")){
            // NOTE -----> Member ID and email already creadted on friendList 
            // get memeber.id from threre later on, for now just email
            const groupActivity = new groupActivityModel({
                activityGroupId: groupObj._id,
                groupName: group.groupName,
                invokedBy: {
                    _id: req.user._id,
                    name: req.user.username
                },
                'member.name': req.body.members[0].name,
                activity: `added`
            });
            groupActivity.save();
        }

        return res.status(200).json(group);
    }
    catch(error){
      if(error){
          next(error)
      }
    }
};

const removeGroupMember = async(req,res, next) => {
    // validate body of the user to be removed--> NOTE
    // console.log("reqBody", req.body);
    // console.log("reqbody", req.body)
    if(req.params.groupId.length === 0 || !req.params.groupId || req.params.memberId.length === 0 || !req.params.memberId){
        return res.status(400).send({"error": "invalid attempt"})
    }
    try{
        const group = await groupModel.findOne({"members._id": mongoose.Types.ObjectId(req.user._id), _id: mongoose.Types.ObjectId(req.params.groupId)}, {members: 1, groupName: 1});
        if(!group){
            throw new Error('Group doesnot exist, create one');
        }
        const tempMembers = [...group.members];
        const memberToBeRemoved = req.params.memberId;
        if(tempMembers.length != 0){
            const filteredArray = tempMembers.filter(item => {
                return item._id.toString() !== req.params.memberId.toString()
            })
            group.members = [...filteredArray]
        }
        await group.save();
        /*
        groupActivityModel.js
        */
        // const removedMember = await userModel.findOne({_id: mongoose.Types.ObjectId(memberToBeRemoved)}, {email: 1, username: 1, tempUser: 1});
        // console.log("removedMember",removedMember)
        const invokedBy ={
            _id: req.user._id,
            name: req.user.username
        }
        // * member if does exist in our database
        // what if he deleted his/her account???and still the details exist in the group!!!!
        // if(removedMember){
        //     console.log("inside Remove")
        //     const removedMemberObj = removedMember.toObject();
        //     if(removedMemberObj.tempUser === false){
        //         const activity = await groupActivityModel.create({
        //             activityGroupId: group._id,
        //             groupName: group.groupName,
        //             invokedBy: invokedBy,
        //             member: {
        //                 //_id: removedMemberObj._id,
        //                //email: removedMemberObj.email,
        //                 name: removedMemberObj.name
        //             },
        //             activity: `removed`
        //         })
        //         console.log("activtiy", activity)
        //     }
        //     else {
                
        const activity = await groupActivityModel.create({
            activityGroupId: group._id,
            groupName: group.groupName,
            invokedBy: invokedBy,
            member: {
                _id: req.params.memberId,
                email: req.body.email,
                name: req.body.name,
            },
            activity: `removed`
        })
    //}
        // }

        // setActivity while removing the user
        // get memebrIdName before removing from a group
        return res.status(200).json(group);
    }
    catch(error){
        if(error){
            next(error)
        }
    }
}
const deleteGroup = async(req,res) => {
    const {groupId} = req.params;
    try{
        const group = await groupModel.findOne({_id: mongoose.Types.ObjectId(groupId), createdById: mongoose.Types.ObjectId(req.user._id)});
        if(!group){
            throw new Error('invalid operation')
        }
        // deleting bills associated with group frist and then deleting group
        await billModel.deleteMany({ownerGroup: mongoose.Types.ObjectId(groupId)})
        await group.remove();
        const removedGroupName = group.groupName;
        const invokedBy ={
            _id: req.user._id,
            name: req.user.username
        }
        const groupParties = [...group.members]
        res.status(200).json({"message": "successfully deleted the group"});

        const groupActivity = new groupActivityModel({
            activityGroupId: group._id,
            groupName: removedGroupName,
            invokedBy,
            activity: `deleted`,
            groupParties
        })
        await groupActivity.save();
        console.log("deleted", groupActivity)
    }catch(error){
        if(error.message){
            res.send({error: error.message})
        }
        else {
            res.send(error)
        }
    }
}
/*-----------
    GROUP SUMMARY
*/

const getGroupSummary = async(req,res) => {
    
    try{
        //check for allowed properties
        // check for existence of a group
        // check for bills length if exists
        // check if the the lastest bill is of existing month
        const {groupId} = req.params.trim();
        const allowedProperties = []
        // const properties = Object.keys(req.body);
        // const includes = properties.every(property => allowedProperties.includes(property));
        // if(!includes){
        //    return  res.status(400).json({"error": "invalid list of properties"})
        // }


        /*------
            EXISTENCE OF A GROUP
        --------*/
        if(groupId.length <= 0){
            return res.status(400).send({'error': 'invalid attempt'})
        }
        const group = await groupModel.findOne({_id: mongoose.Types.ObjectId(groupId), "members._id": mongoose.Types.ObjectId(req.user._id)});
        if(!group){
            return res.status(400).send({"error": "group cannot be found"})
        }

        /* GETTING BILLS */
        const bills = await billModel.find({ownerGroup: mongoose.Types.ObjectId(groupId), $or: [{paidBy : mongoose.Types.ObjectId(req.user._id)}, {"splittedAmongMembers": mongoose.Types.ObjectId(req.user._id)}]})
        if(!bills){
            return res.status(200).json({"msg": "no data"})
        }

        return res.status(200).json(bills)

        // return group detauls as well
    }catch(error){
        if(error.message){
            res.send({error: error.message})
        }
        else {
            res.send(error)
        }
    }   
}



module.exports = {
    getGroups,
    getGroup,
    postGroup,
    updateGroup,
    removeGroupMember,
    deleteGroup,
    getGroupSummary
}
