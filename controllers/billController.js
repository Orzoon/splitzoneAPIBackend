const mongoose = require('mongoose');
const billModel = require("../modals/billModel");
const groupModel = require("../modals/groupModel");

const getBills = async(req,res) => {
    const {groupId,limit,skip} = req.params;
    if(!groupId){
        return res.status(400).send({"error": "missing group parameter"})
    }

    try{
        const groupCount = await groupModel.findOne({_id: mongoose.Types.ObjectId(groupId), "members._id": mongoose.Types.ObjectId(req.user._id)}).countDocuments();
        if(groupCount !== 1){
            throw new error("invalid groupId parameter")
        }
        const bills = await billModel.aggregate([
            {$match: {ownerGroup: mongoose.Types.ObjectId(groupId)}},
            {$sort: {dateCreated: -1}},
            {$limit: parseInt(limit,10)},
            {$skip: parseInt(skip,10)}
        ]).exec();
        res.status(200).json(bills)
    }
    catch(error){
        if(error.message){
            res.send({"error": error.message});
        }
        else {
            res.send(error);
        }
    }
}
const getBill = async(req,res) => {
    if(!req.params.billId){
        return res.sendStatus(400).json({"error": "missing parameter"})
    }
    const billId = req.params.billId;
    try{
        const bill = await billModel.findOne({_id:mongoose.Types.ObjectId(billId)});
        if(!bill){
            throw new Error('invalid parameter')
        }
        const groupCount = await groupModel.findOne({_id:mongoose.Types.ObjectId(bill.ownerGroup[0]), "members._id":mongoose.Types.ObjectId(req.user._id)}).countDocuments();
        if(groupCount !== 1){
            throw new Error("invalid attempt");
        }
        res.status(200).json(bill);
    }catch(error){
        if(error.message){
            res.send({error: error.message});
        }
        else {
            res.send(error);
        }
    }
}
const postBill = async(req,res) => {
    const {groupId} = req.params;
    const allowedProperty = ["paidById","paidAmount", "splittedAmongNumber", "paidDate", "dividedEqually", "splittedAmongMembers", "paidCategory", "ownerGroup"];
    const properties = Object.keys(req.body);
    if(allowedProperty.length !== properties.length){
        return res.status(400).json({"error": "invalid entry of properties"});
    }
    const includes = properties.every(item => allowedProperty.includes(item));
    if(!includes){
        return res.stauts(400).json({"error": "invalid attempt to create a bill"})
    }
    try{
        const groupCount = await groupModel.findOne({_id: mongoose.Types.ObjectId(groupId), "members._id": req.user._id}).countDocuments();
        if(groupCount !== 1){
            return res.status(400).json({"error": "invalid attempt to insert a bill into a group"})
        }
        const bill = await billModel.insertOne(req.body);
        res.status(200).json(bill)
    }catch(error){
        if(error.message){
            res.send({error: error.message})
        }
        else{
            res.send(error)
        }
    }
}
const updateBill = async(req,res) => {
    const {groupId, billId} = req.params;
    const properties = Object.keys(req.body);
    const allowedProperty = ["paidById","paidAmount", "splittedAmongNumber", "paidDate", "dividedEqually", "splittedAmongMembers", "paidCategory", "ownerGroup"];
    if(properties.length < 1){
        return res.status(400).json({"error": "invalid attempt to update the bill"})
    }
    const includes = properties.every(item => allowedProperty.includes(item))
    if(!includes){
        return res.stauts(400).json({"error": "invalid attempt to update a bill"})
    }

    try{
        const bill = await billModel.findOne({_id: mongooose.Types.ObjectId(billId), ownerGroup: mongoose.Types.ObjectId(groupId)});
        if(!bill){
            throw new Error('invalid attempt to update a bill')
        }
        const tempArray = [...bill.splittedAmongMembers];
        bill.forEach(item => {
            if(item === "splittedAmongMembers"){
                if(req.body[item].length !== 0){
                    let i = req.body[item];
                    tempArray = [...bill.splittedAmongMembers,...i]
                }
            }
            else {
                bill[item] = req.body[item];
            }
        })
        await bill.save();
        res.stauts(200).json(bill)   
    }
    catch(error){
        if(error.message){
            res.send(error.message)
        }
        else {
            res.send(error)
        }
    }
}

module.exports = {
    getBill,
    getBills,
    postBill,
    updateBill
}