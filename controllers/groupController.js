const mongoose = require('mongoose');
const groupModel = require("../modals/groupModel");
const userModel = require("../")
const groupActivityModel = require("../modals/groupActivityModel")
const billModel = require("../modals/billModel");

const getGroups= async(req,res) => {
    //vaidation
    const userId = req.user._id;
    try{
        const groups= await groupModel.aggregate([
            {$match: {"members._id": mongoose.Types.ObjectId(userId)}},
            {$sort: {createdOn: 1}}
        ]).exec();
        res.status(200).json(groups)
    }
    catch(error){
        if(error.message){
            res.send({error: error.message});
        }
        else {
            res.send(error);
        }
    }
}//------Cleared
const postGroup = async(req,res) => {
    const allowedProperties = ["groupName"];
    const properties = Object.keys(req.body)
    const includes = properties.every(item => allowedProperties.includes(item))
    if(!includes){
        return res.send({"error": "invalid properties"})
    }
    try{
        const group = new groupModel({groupName: req.body.groupName, createdBy: req.user.username, createdById: req.user._id, members: [{_id: mongoose.Types.ObjectId(req.user._id), name: req.user.username, email: req.user.email}] ,createdOn: new Date()});
        await group.save();

        // setting group activity
        const invokedBy = {
            _id: req.user._id,
            name: req.user.username
        }

        /*
        GROUP ACTIVITY
        */
        const groupActivity = new groupActivityModel({
            activityGroupId: group._id, 
            invokedBy: invokedBy,
            activity: `created group ${group.groupName} on ${new Date().toDateString} at ${new Date().getHours()}:${new Date().getMinutes()} `});
        await groupActivity.save();
        res.status(200).json(group);
    }
    catch(error){
        if(error.message){
            res.send({error: error.message})
        }
        else {
            res.send(error)
        }
    }
};//-----cleared
const updateGroup = async(req,res) => {
    if(req.params.groupId.length = 0 || !req.params.groupId){
        return res.status(400).send({"error": "invalid group link"})
    }
    const allowedProperties = ["groupName", "members"];
    const properties = Object.keys(req.body)
    if(req.body.members){
        if(typeof(req.body.members) != "object"){
            return res.status(400).send({"error": "invalid update"})
        }
    }
    const includes = properties.every((item) => allowedProperties.includes(item));
    if(!includes){
        return res.status(400).send({"error": "invalid update attempt"})
    }
    try{
        const group = await groupModel.findOne({createdById: req.user._id, _id: mongoose.Types.ObjectId(req.params.groupId)}, {members: 1, groupName: 1});
        if(!group){
            throw new Error('Group doesnot exist, create one');
        }
        if(req.body.groupName){
            group.groupName = req.body.groupName
        }
        if(req.body.members){
            const check = group.members.every(item => {
                if(item.email === (req.body.members[0].email)){
                   return false
                }
                else {
                    return true
                }
            })
            if(check === false){
                throw new Error("cannot update existing user")
            }
            const members = [...group.members,...req.body.members]
            group.members = members;
        }
        await group.save();


        /*
        GroupActivity
        */
        const groupObj = group.toObject();

        /* check for activity status to set for updated_property */
        if(req.body.hasOwnProperty("groupName")){
            const groupActivity = new groupActivityModel({
                activityGroupId: groupObj._id,
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
                invokedBy: {
                    _id: req.user._id,
                    name: req.user.username
                },
                'member.email': req.body.members[0].email,
                activity: `added`
            });
            groupActivity.save();
        }
        res.status(200).json(group);
    }
    catch(error){
        if(error.message){
            res.send({error: error.message})
        }
        else {
            res.send(error)
        }
    }
};//-----cleared
const removeGroupMember = async(req,res) => {
    if(req.params.groupId.length === 0 || !req.params.groupId || req.params.memberId.length === 0 || !req.params.memberId){
        return res.status(400).send({"error": "invalid attempt"})
    }
    try{
        const group = await groupModel.findOne({createdById: req.user._id, _id: mongoose.Types.ObjectId(req.params.groupId)}, {members: 1, groupName: 1});
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
        const removedMember = await userModel.findOne({_id: mongoose.Types.ObjectId(memberToBeRemoved)}, {email: 1, username: 1, tempUser: 1});
        const invokedBy ={
            _id: req.user._id,
            name: req.user.username
        }
        // * member if does exist in our database
        // what if he deleted his/her account???and still the details exist in the group!!!!
        if(removedMember){
            const removedMemberObj = removedMember.toObject();
            if(removedMemberObj.tempUser === false){
                await groupActivityModel.insertOne({
                    activityGroupId: group._id,
                    invokedBy: invokedBy,
                    member: {
                        _id: removedMemberObj._id,
                        email: removedMemberObj.email
                    },
                    activity: `removed from the group`
                })
            }
            else {
                await groupActivityModel.insertOne({
                    activityGroupId: group._id,
                    invokedBy: invokedBy,
                    member: {
                        _id: removedMemberObj._id,
                        email: removedMemberObj.email
                    },
                    activity: `removed from the group`
                })

            }
        }

        // setActivity while removing the user
        // get memebrIdName before removing from a group
        res.status(200).json(group);
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
        res.status(200).json({"message": "successfully deleted the group"});
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
    postGroup,
    updateGroup,
    removeGroupMember,
    deleteGroup
}
