const User = require("../../models/user.model")
const usersSocket = require("../../sockets/client/users.socket")
// [GET]: /users/not-friend
module.exports.notFriend = async (req, res) => {
  // Socket
  usersSocket(res)
  // End Socket
  const userId = res.locals.user.id
  const myUser = await User.findOne({
    _id: userId
  })
  const requestFriends = myUser.requestFriends
  const acceptFriends = myUser.acceptFriends
  const users = await User.find({
    $and:[
      {
        _id: {$ne: userId} // Exclude current user
      },{
        _id:{$nin: requestFriends}, // Exclude sent friend request
      },{
        _id: {$nin: acceptFriends} // Excude recieved friend request
      }
    ],
    deleted: false,
    status: "active"
  }).select("avatar fullName")
  console.log(users)
  res.render("client/pages/users/not-friend", {
    pageTitle: "Danh sách người dùng",
    users: users
  })
}
// [GET]: /users/request
module.exports.request = async (req, res) => {
  // Socket
  usersSocket(res)
  // End Socket
  const userId = res.locals.user.id
  const myUser = await User.findOne({
    _id: userId
  })
  const requestFriends = myUser.requestFriends
  const users = await User.find({
    _id: {$in: requestFriends},
    status: "active",
    deleted: false
  }).select("id fullName avatar")
  res.render("client/pages/users/request", {
    pageTitle: "Lời mời đã gửi", 
    users: users
  })
}