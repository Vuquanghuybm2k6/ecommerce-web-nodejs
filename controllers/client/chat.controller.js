const Chat = require("../../models/chat.model")
const User = require("../../models/user.model")
// [GET]: /chat
module.exports.index = async (req,res)=>{
  const userId = res.locals.user.id
  const fullName = res.locals.user.fullName
  // SocketIO
  _io.once('connection', (socket) => { 
    socket.userId = userId
    socket.fullName = fullName
    socket.on("CLIENT_SEND_MESSAGE", async (content)=>{
      // Lưu vào db
      const chat = new Chat({
        user_id: socket.userId,
        content: content
      })
      await chat.save()
      // Trả data về client
      _io.emit("SERVER_RETURN_MESSAGE",{
        user_id: socket.userId,
        fullName: socket.fullName,
        content: content
      })
    })
    socket.on("CLIENT_SEND_TYPING", (type)=>{
      socket.broadcast.emit("SERVER_RETURN_TYPING",{
          userId: socket.userId,
          fullName: socket.fullName,
          type: type
      })
    })
  });  
  // End SocketIO
  const chats = await Chat.find({deleted: false})
  for(const chat of chats){
    const infoUser = await User.findOne({
      _id: chat.user_id
    }).select("fullName")
    chat.infoUser = infoUser
  }
  res.render("client/pages/chat/index",{
    pageTitle: "Chat",  
    chats: chats
  })
}