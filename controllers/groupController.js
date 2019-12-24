const mongoose = require('mongoose');
const groupModel = require("../modals/groupModel");

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
}
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
};
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
        if(req.body.groupName){
            group.groupName = req.body.groupName
        }
        if(req.body.members){
            const members = [...group.members, req.body.members]
            group.members = members;
        }
        await group.save();
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
};
module.exports = {
    getGroups,
    postGroup,
    updateGroup
}