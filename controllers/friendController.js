const mongoose = require('mongoose');
const friendsModal = require('../modals/friendModel');
const userModal = require('../modals/userModel.js');

const getFriends = async (req,res) => {
    const userId = req.user._id;
    try{
        const userfriends = await friendsModal.findOne({_id: mongoose.Types.ObjectId(userId)});
        // if(!userfriends){
        //     return res.status(400).send({"error": "invalid friend Seatch attempt"})
        // }

        return res.status(200).json(userfriends)

    }catch(error){
        if(error.message){
            res.send({error: error.message})
        }
        else {
            res.send(error)
        }
    }
}
// validation necessary
const postFriend = async(req,res) => {
    const {email, name} = req.body;
    const allowedproperties = ["name", "email"];
    const containsProperties = Object.keys(req.body).every(item => allowedproperties.includes(item));
    if(!containsProperties){
        return res.status(400).json({"error": "invalid properties detected"})
    }
    // check already in the friend list or not
    try{
        const userExist = await friendsModal.find({
            _id: mongoose.Types.ObjectId(req.user._id), $or : [
               {"friends": {$elemMatch: {email: email, name: name} }},
               {"friends": {$elemMatch: {email: email}}},
               {"friends": {$elemMatch: {email: {$type: 10}, name : {$type: 10}}}}
            ]
        })
        // returns an array
        if(userExist.length !== 0){
            return res.status(400).json({"error": "cannot add the exisiting friend"})
        }

        // if email is provided check for existing user
        let userExists = null;
        if(email){
            userExists = await userModal.findOne({email: email})
        }

        if(userExists){
            const userExistsData = {
                email: userExists.email,
                name: userExists.username,
                _id: mongoose.Types.ObjectId()
                // check for registered or not
            }

            let user = await friendsModal.findOne({_id: mongoose.Types.ObjectId(req.user._id)});
            if(!user){
                user = await friendsModal.create({_id: mongoose.Types.ObjectId(req.user._id)})
            }
            const userFriendsCopy = [...user.friends];
            userFriendsCopy.push(userExistsData);
            user.friends = userFriendsCopy;
            await user.save();
            console.log(user)
            return res.status(200).json(user);
        }


        let user = await friendsModal.findOne({_id: mongoose.Types.ObjectId(req.user._id)});
        if(!user){
            user = await friendsModal.create({_id: mongoose.Types.ObjectId(req.user._id)})
        }
        const userFriendsCopy = [...user.friends];
        userFriendsCopy.push({...req.body, _id: mongoose.Types.ObjectId()});
        user.friends = userFriendsCopy;
        await user.save();
        console.log(user)
        return res.status(200).json(user);
        // proceed adding friend to the list   
    }catch(error){
        console.log(error)
        if(error.message){
            res.status(500).send({error: error.message})
        }
        else {
            res.status(500).send(error)
        }
    }
}

const deleteFriend = async(req,res) => {
    const {id} = req.params;

    if(!id){
        return res.status(400).json({"error": "invalid delete attempt"})
    }

    try{
        const friend = await friendsModal.findOne({_id: mongoose.Types.ObjectId(req.user._id), 
            "friends._id": mongoose.Types.ObjectId(id)}, {"friends.$": 1});

        if(!friend){
            return res.status(400).json({"error": "invalid delete attempt"})
        }

        const removedFriend = await friendsModal.updateOne({_id: mongoose.Types.ObjectId(req.user._id)}, {$pull: {"friends": {_id: mongoose.Types.ObjectId(id)} }})
        if(!removedFriend.ok){
            return res.status(500).send({"Error": "something went wrong try again later"})
        }

        return res.status(200).json({"success": "successfully removed a friend from the friend list"})
    }
    catch(error){
        console.log(error)
        if(error.message){
            res.status(500).send({error: error.message})
        }
        else {
            res.status(500).send(error)
        }
    }
}




module.exports = {
    getFriends,
    postFriend,
    deleteFriend
}