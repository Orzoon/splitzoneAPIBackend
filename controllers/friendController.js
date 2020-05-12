const mongoose = require('mongoose');
const friendsModal = require('../modals/friendModel');
const userModal = require('../modals/userModel.js');
const {Errorhandler} = require('../util/error')
const {validationResult } = require('express-validator');
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
const postFriend = async(req,res, next) => {  
    if(req.body.email){
            // catching validationErrors
        const errors = validationResult(req).array();
        //-> validation errors!
        if(errors.length > 0){
           // return res.status(422).json(errors)
            throw new Errorhandler(400, errors.array())
        }
    }
    const {email, name} = req.body;
    const allowedproperties = ["name", "email"];
    const containsProperties = Object.keys(req.body).every(item => allowedproperties.includes(item));
    if(!containsProperties){
        //return res.status(400).json({"error": "invalid properties detected"})
        throw new Errorhandler(400, 'invalid properties detected');
    }
    // check already in the friend list or not
    try{
        // exclude name checking
        if(email){
            const userExist = await friendsModal.find({
                _id: mongoose.Types.ObjectId(req.user._id), $or : [
                    {"friends": {$elemMatch: {email: email, name: name}}},
                    {"friends": {$elemMatch: {email: email}}},
                    /*{"friends": {$elemMatch: {email: {$type: 10}, name : {$type: 10}}}}*/
                ]
            })
            if(userExist.length !== 0){
                //return res.status(400).json({"error": "cannot add the exisiting friend"})
                throw new Errorhandler(400, "cannot add the exisiting friend");
            }
        }
        // if email is provided check for existing user in userModal
        let userExists = null;
        if(email){
            userExists = await userModal.findOne({email: email})
        }
        if(userExists){
            const userExistsData = {
                email: userExists.email,
                name: userExists.username,
                _id: userExists._id
                // check for registered or not
            }
            let user = await friendsModal.findOne({_id: mongoose.Types.ObjectId(req.user._id)});
            if(!user){
                user = await friendsModal.create({_id: mongoose.Types.ObjectId(req.user._id)})
            }
            const userFriendsCopy = [userExistsData,...user.friends];
            //userFriendsCopy.push(userExistsData);
            user.friends = userFriendsCopy;
            await user.save();
            return res.status(200).json(user);
        }
        // check for existence of user in other's friend model
        let existAsFriend = null;
        if(email){
            existAsFriend = await friendsModal.findOne({"friends.email": email}, {friends:{$elemMatch : {'email': email}}})
            if(existAsFriend){
                friendID = existAsFriend.friends[0]._id;
                // let the name be kept by the user for now
                const userExistsData = {
                    email: existAsFriend.friends[0].email,
                    name: req.body.name,
                    _id: friendID
                    // check for registered or not
                }           
                // find the user to whom we want to add a friend
                let user = await friendsModal.findOne({_id: mongoose.Types.ObjectId(req.user._id)});            
                if(!user){
                    user = await friendsModal.create({_id: mongoose.Types.ObjectId(req.user._id)})
                }
                const userFriendsCopy = [userExistsData,...user.friends];            
                //userFriendsCopy.push({...req.body, _id: mongoose.Types.ObjectId()});
                user.friends = userFriendsCopy;
                await user.save();
                return res.status(200).json(user);
            }
        }

        // normal addition
        let user = await friendsModal.findOne({_id: mongoose.Types.ObjectId(req.user._id)});
        if(!user){
            user = await friendsModal.create({_id: mongoose.Types.ObjectId(req.user._id)})
        }
        const userFriendsCopy = [{...req.body, _id: mongoose.Types.ObjectId()},...user.friends];
        //userFriendsCopy.push({...req.body, _id: mongoose.Types.ObjectId()});
        user.friends = userFriendsCopy;
        await user.save();
        return res.status(200).json(user);
        // proceed adding friend to the list   
    }catch(error){
       if(error){
           next(error)
       }
    }
}
const updateFriend = async(req,res, next) => {
    // catching validationErrors
    const errors = validationResult(req).array();
    //-> validation errors!
    if(errors.length > 0){
        return res.status(422).json(errors)
    }
    const {email, name, friendId} = req.body;
    const allowedproperties = ["name", "email", "friendId"];
    const containsProperties = Object.keys(req.body).every(item => allowedproperties.includes(item));
    if(!containsProperties){
        //return res.status(400).json({"error": "invalid properties detected"})
        throw new Errorhandler(400, "invalid properties detected");
    }
    try{
        // find the existence of the user
        let userExists = null;
        if(email){
            userExists = await userModal.findOne({email: email})
        }
        if(userExists){
            const userExistsData = {
                email: userExists.email,
                name: userExists.username, // toogle user defined name
                _id: userExists._id
                // check for registered or not
            }

            // userAlreadyExists
            let userFriendData = await friendsModal.findOne({_id: mongoose.Types.ObjectId(req.user._id)});

            let userFriendDataCopy = [...userFriendData.friends]
            const index= userFriendDataCopy.findIndex(item => item._id.toString() === friendId.toString());
            userFriendDataCopy[index] = userExistsData;
            userFriendData.friends = userFriendDataCopy;
            await userFriendData.save();
            return res.status(200).json(user);
        }

        // check for existence of user in other's friend model
        let existAsFriend = null;
        if(email){
            existAsFriend = await friendsModal.findOne({"friends.email": email}, {friends:{$elemMatch : {'email': email}}})
            if(existAsFriend){
                friendID = existAsFriend.friends[0]._id;
                // let the name be kept by the user for now
                const userExistsData = {
                    email: existAsFriend.friends[0].email,
                    name: req.body.name,
                    _id: friendID
                    // check for registered or not
                }

                // find the user to whom we want to add a friend
                let user = await friendsModal.findOne({_id: mongoose.Types.ObjectId(req.user._id)});
                if(!user){
                    user = await friendsModal.create({_id: mongoose.Types.ObjectId(req.user._id)})
                }
                const userFriendsCopy = [userExistsData,...user.friends];
                //userFriendsCopy.push({...req.body, _id: mongoose.Types.ObjectId()});
                user.friends = userFriendsCopy;
                await user.save();
                return res.status(200).json(user);
            }
        }

        // userDoesnot exist
        let userFriendData = await friendsModal.findOne({_id: mongoose.Types.ObjectId(req.user._id)});
        let userFriendDataCopy = [...userFriendData.friends]
        const index= userFriendDataCopy.findIndex(item => item._id.toString() === friendId.toString());
        userFriendDataCopy[index].email = email;
        userFriendData.friends = userFriendDataCopy;
        await userFriendData.save();
        return res.status(200).json(userFriendData);

        // set Activities if the user is registered and exists --> toDoLater
    }catch(error){
        if(error){
            next(error)
        }
    }
}
const deleteFriend = async(req,res, next) => {
    const {id} = req.params;
    if(!id){
        //return res.status(400).json({"error": "invalid delete attempt"})
        throw new Errorhandler(400, 'delete')
    }
    try{
        const friend = await friendsModal.findOne({_id: mongoose.Types.ObjectId(req.user._id), 
            "friends._id": mongoose.Types.ObjectId(id)}, {"friends.$": 1});
        if(!friend){
            //return res.status(400).json({"error": "invalid delete attempt"})
            throw new Errorhandler(400, 'invalid delete attempt');
        }

        const removedFriend = await friendsModal.updateOne({_id: mongoose.Types.ObjectId(req.user._id)}, {$pull: {"friends": {_id: mongoose.Types.ObjectId(id)} }})
        if(!removedFriend.ok){
            return res.status(500).send({"Error": "something went wrong try again later"})
        }

        return res.status(200).json({"success": "successfully removed a friend from the friend list"})
    }
    catch(error){
      if(error){
          next(error)
      }
    }
}

module.exports = {
    getFriends,
    postFriend,
    updateFriend,
    deleteFriend
}