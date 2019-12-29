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
    console.log(req.query)
}

module.exports = {
    getBill,
    getBills,
    postBill
}