const User = require("../../models/user.model")
module.exports = async (res) => {
  // SocketIO
  _io.once('connection', (socket) => {

    // Người dùng gửi yêu cầu kết bạn
    socket.on("CLIENT_ADD_FRIEND", async (userId) => {
      const myUserId = res.locals.user.id
      // Thêm Id của A vào acceptFriends của B
      const existUserAInB = await User.findOne({
        _id: userId,
        acceptFriends: myUserId
      })
      if (!existUserAInB) {
        await User.updateOne({
          _id: userId
        }, {
          $push: {
            acceptFriends: myUserId
          }
        })
      }
      // Thêm ID của B vào requestFriends của A
      const existUserBInA = await User.findOne({
        _id: myUserId,
        requestFriends: userId
      })
      if (!existUserBInA) {
        await User.updateOne({
          _id: myUserId
        }, {
          $push: {
            requestFriends: userId
          }
        })
      }
      // Lấy độ dài acceptFriends của B và trả về cho B
      const infoUserB = await User.findOne({
        _id: userId
      })
      const lengthAcceptFriends = infoUserB.acceptFriends.length 
      socket.broadcast.emit("SEVER_RETURN_LENGTH_ACCEPT_FRIEND", {
        userId: userId,
        lengthAcceptFriends: lengthAcceptFriends
      })
    })

    // Người dùng hủy gửi yêu cầu kết bạn
    socket.on("CLIENT_CANCEL_FRIEND", async (userId) => {
      const myUserId = res.locals.user.id
      // Xóa Id A trong acceptFriend của B
      const existUserAInB = await User.findOne({
        _id: userId,
        acceptFriends: myUserId
      })
      if (existUserAInB) {
        await User.updateOne({
          _id: userId
        }, {
          $pull: {
            acceptFriends: myUserId
          }
        })
      }
      // Xóa ID của B trong requestFriend của A
      const existUserBInA = await User.findOne({
        _id: myUserId,
        requestFriends: userId
      })
      if (existUserBInA) {
        await User.updateOne({
          _id: myUserId
        }, {
          $pull: {
            requestFriends: userId
          }
        })
      }
      // Lấy độ dài acceptFriends của B và trả về cho B
      const infoUserB = await User.findOne({
        _id: userId
      })
      const lengthAcceptFriends = infoUserB.acceptFriends.length 
      socket.broadcast.emit("SEVER_RETURN_LENGTH_ACCEPT_FRIEND", {
        userId: userId,
        lengthAcceptFriends: lengthAcceptFriends
      })
    })

    // Người dùng từ chối kết bạn
    socket.on("CLIENT_REFUSE_FRIEND", async (userId) => {
      const myUserId = res.locals.user.id 
      // Xóa Id của A trong acceptFriend của B
      const existUserAInB = await User.findOne({
        _id: myUserId,
        acceptFriends: userId
      })
      if (existUserAInB) {
        await User.updateOne({
          _id: myUserId
        }, {
          $pull: {
            acceptFriends: userId
          }
        })
      }
      // Xóa Id của B trong requestFriend của A
      const existUserBInA = await User.findOne({
        _id: userId,
        requestFriends: myUserId
      })
      if (existUserBInA) {
        await User.updateOne({
          _id: myUserId
        }, {
          $pull: {
            requestFriends: myUserId
          }
        })
      }
    })

    // Người dùng đồng ý kết bạn
    socket.on("CLIENT_ACCEPT_FRIEND", async (userId) => {
      const myUserId = res.locals.user.id // id của B

      // Thêm {user_id, room_chat_id} của A vào friendsList của B
      // Xóa Id của A trong acceptFriend của B
      const existUserAInB = await User.findOne({
        _id: myUserId,
        acceptFriends: userId
      })
      if (existUserAInB) {
        await User.updateOne({
          _id: myUserId
        }, {
          $push: {
            friendList: {
              user_id: userId, 
              room_chat_id: ""
            }
          },
          $pull: {
            acceptFriends: userId
          }
        })
      }

      // Thêm {user_id, room_chat_id} của B vào friendsList của A
      // Xóa Id của B trong requestFriend của A
      const existUserBInA = await User.findOne({
        _id: userId,
        requestFriends: myUserId
      })
      if (existUserBInA) {
        await User.updateOne({
          _id: userId
        }, {
          $push: {
            friendList: {
              user_id: myUserId,
              room_chat_id: ""
            }
          },
          $pull: {
            requestFriends: myUserId
          }
        })
      }
    })
  });


  // End SocketIO
}