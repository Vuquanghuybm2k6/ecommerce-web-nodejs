const Chat = require("../../models/chat.model")
module.exports = async (req, res) =>{
  const userId = res.locals.user.id
  const fullName = res.locals.user.fullName
  const roomChatId = req.params.roomChatId
  // SocketIO
  _io.once('connection', (socket) => { 
    socket.userId = userId
    socket.fullName = fullName
    socket.join(roomChatId)
    socket.on("CLIENT_SEND_MESSAGE", async (content)=>{

      // Lưu vào db
      const chat = new Chat({
        user_id: socket.userId,
        content: content,
        room_chat_id: roomChatId
      })
      await chat.save()

      // Trả data về client
      _io.to(roomChatId).emit("SERVER_RETURN_MESSAGE",{ // chỉ gửi cho những người nào có id phòng chat chung
        userId: socket.userId,
        fullName: socket.fullName,
        content: content
      })
    })
    socket.on("CLIENT_SEND_TYPING", (type)=>{
      socket.broadcast.to(roomChatId).emit("SERVER_RETURN_TYPING",{
          userId: socket.userId,
          fullName: socket.fullName,
          type: type
      })
    })
  });  
  // End SocketIO
}