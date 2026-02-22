const User = require("../../models/user.model")
module.exports = async (res) =>{
  // SocketIO
  _io.once('connection', (socket) => { 
    socket.on("CLIENT_ADD_FRIEND", async (userId)=>{
      const myUserId = res.locals.user.id 
      // Thêm Id của người dùng hiện tại vào trong mảng acceptFriend của người kia
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
      // Thêm ID của người kia vào trong acceptFriend của người dùng hiện tại
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
    // Người dùng hủy gửi yêu cầu kết bạn
    socket.on("CLIENT_CANCEL_FRIEND", async (userId)=>{
        const myUserId = res.locals.user.id 
        // Xóa Id của người dùng hiện tại trong mảng acceptFriend của người kia
        const existUserAInB = await User.findOne({
          _id: userId,
          acceptFriends: myUserId
        })
        if(existUserAInB){
          await User.updateOne({
            _id: userId
          }, {
            $pull: {
              acceptFriends: myUserId
            }
          })
        }
        // Xóa ID của người kia trong acceptFriend của người dùng hiện tại
        const existUserBInA = await User.findOne({  
          _id: myUserId,
          requestFriends: userId
        })
        if(existUserBInA){
          await User.updateOne({
            _id: myUserId
          }, {
            $pull: {
              requestFriends: userId
            }
          })
        }
      })
    // End Người dùng hủy gửi yêu cầu kết bạn
  });  
  

  // End SocketIO
}