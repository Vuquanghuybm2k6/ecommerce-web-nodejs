const Chat = require("../../models/chat.model")
module.exports = async (res) =>{
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
        userId: socket.userId,
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
}