// CLIENT_SEND_MESSAGE
const formSentData = document.querySelector(".chat .inner-form")
if(formSentData){
  formSentData.addEventListener("submit", (e)=>{
    e.preventDefault()
    const content = e.target.elements.content.value
    if(content){
      socket.emit("CLIENT_SEND_MESSAGE", content) // bên phía controller cũng nhận được sự kiện này, sang bên đó để lấy sự kiện
      e.target.elements.content.value = ""
    }
  })
}
// End CLIENT_SEND_MESSAGE