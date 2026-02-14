const User = require("../../models/user.model")
module.exports = async (res) =>{
  // SocketIO
  _io.once('connection', (socket) => { 
    socket.on("CLIENT_ADD_FRIEND", async (userId)=>{
      const myUserId = res.locals.user.id 
      // Add current user's ID into target user's acceptFriend array
      const existUserAInB = await User.findOne({
        _id: userId,
        acceptFriends: myUserId
      })
      if(!existUserAInB){
        await User.updateOne({
          _id: userId
        }, {
          $push: {
            acceptFriends: myUserId
          }
        })
      }
      // Add target user's ID into current user's acceptFriends array
      const existUserBInA = await User.findOne({  
        _id: myUserId,
        requestFriends: userId
      })
      if(!existUserBInA){
        await User.updateOne({
          _id: myUserId
        }, {
          $push: {
            requestFriends: userId
          }
        })
      }
    })
  });  
  // End SocketIO
}