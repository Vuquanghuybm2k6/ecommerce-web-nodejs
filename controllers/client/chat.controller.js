const Chat = require("../../models/chat.model")
const User = require("../../models/user.model")
// [GET]: /chat
module.exports.index = async (req,res)=>{
  const userId = res.locals.user.id
  // SocketIO
  _io.once('connection', (socket) => { // bắt sự kiện connect, kết nối 1 lần duy nhất, không bị load lại, chỉ gửi 1 lần
    socket.once("CLIENT_SEND_MESSAGE", async (content)=>{
      // Lưu vào db
      const chat = new Chat({
        user_id: userId,
        content: content
      })
      await chat.save()
    })
  });  
  // End SocketIO
  const chats = await Chat.find({deleted: false})
  console.log(chats)
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