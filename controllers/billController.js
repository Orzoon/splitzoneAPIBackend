const mongoose = require('mongoose');
const billModel = require("../modals/billModel");
const groupModel = require("../modals/groupModel");
const billActivityModel = require("../modals/billActivityModel");

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
    const allowedProperty = ["paidBy","addedBy","paidAmount", "splittedAmongNumber", "paidDate", "dividedEqually","divided", "splittedAmongMembers", "paidCategory", "ownerGroup"];
    const properties = Object.keys(req.body);
    if(allowedProperty.length !== properties.length){
        return res.status(400).json({"error": "invalid entry of properties"});
    }
    const includes = properties.every(item => allowedProperty.includes(item));
    if(!includes){
        return res.status(400).json({"error": "invalid attempt to create a bill"})
    }
    try{
        const groupCount = await groupModel.findOne({_id: mongoose.Types.ObjectId(groupId), "members._id": req.user._id}).countDocuments();
        if(groupCount !== 1){
            return res.status(400).json({"error": "invalid attempt to insert a bill into a group"})
        }
        const bill = await billModel.create({...req.body, paidDate: new Date()});
        if(!bill){
            throw new Error("bill couldnot be created, try again later")
        }

        /*
        billActivity upon creation of a bill
        */
        const billActivity = await billActivityModel.create({
            invokedBy: {
                _id: req.user._id,
                name: req.user.username
            },
            groupId: req.params.groupId,
            activity: "added the bill to the group"
        })
        
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
        const billActivity = await billActivityModel.insertOne({
            invokedBy: {
                _id: req.user._id,
                name: req.user.username
            },
            groupId: req.params.groupId,
            activity: "made changes to the bill in the group"
        })
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
const deleteBill = async(req,res) => {
     const {groupId, billId} = req.params;
     if(!groupId || !billId) {
         return res.status(400).json({"error": "billId and groupId not supplied in URL parameter"})
     }
     try{
        const bill = await billModel.deleteOne({_id: mongoose.Types.ObjectId(billId), ownerGroup: mongoose.Types.ObjectId(groupId)});
        if(!bill){
            throw new Error('bill doesnot exist!')
        }
        res.status(200).send();
        /*
        bill deletion Activity
        */
        const billActivity = await billActivityModel.insertOne({
            invokedBy: {
                _id: req.user._id,
                name: req.user.username
            },
            groupId: groupId,
            activity: "deleted a bill from the group"
        })
     }catch(error){
         if(error.message){
             res.status(500).json(error.message)
         }
         else {
             res.status(500).json(error.message)
         }
     }
}
module.exports = {
    getBill,
    getBills,
    postBill,
    updateBill,
    deleteBill
}