// Send Friend Request
const listBtnAddFriend = document.querySelectorAll("[btn-add-friend]")
if(listBtnAddFriend.length>0){
  listBtnAddFriend.forEach(button=>{
    button.addEventListener("click",()=>{
      button.closest(".box-user").classList.add("add")
      const userId = button.getAttribute("btn-add-friend")
      socket.emit("CLIENT_ADD_FRIEND", userId)
    })
  })
}
// End Send Friend Request

// Delete Friend Request
const listBtnCancelFriend = document.querySelectorAll("[btn-cancel-friend]")
if(listBtnCancelFriend.length>0){
  listBtnCancelFriend.forEach(button=>{
    button.addEventListener("click",()=>{
      button.closest(".box-user").classList.remove("add")
      const userId = button.getAttribute("btn-cancel-friend")
      socket.emit("CLIENT_CANCEL_FRIEND", userId)
    })
  })
}
// End Delete Friend Request

// Refuse Friend Request
const listBtnRefuseFriend = document.querySelectorAll("[btn-refuse-friend]")
if(listBtnRefuseFriend.length>0){
  listBtnRefuseFriend.forEach(button=>{
    button.addEventListener("click",()=>{
      button.closest(".box-user").classList.add("refuse")
      const userId = button.getAttribute("btn-refuse-friend")
      socket.emit("CLIENT_REFUSE_FRIEND", userId)
    })
  })
}
// End Refuse Friend Request

// Accept Friend Request
const listBtnAcceptFriend = document.querySelectorAll("[btn-accept-friend]")
if(listBtnAcceptFriend.length>0){
  listBtnAcceptFriend.forEach(button=>{
    button.addEventListener("click",()=>{
      button.closest(".box-user").classList.add("accepted")
      const userId = button.getAttribute("btn-accept-friend")
      socket.emit("CLIENT_ACCEPT_FRIEND", userId)
    })
  })
}
// End Accept Friend Request

// SEVER_RETURN_LENGTH_ACCEPT_FRIEND
socket.on("SEVER_RETURN_LENGTH_ACCEPT_FRIEND", (data)=>{
  const badgeUsersAccept = document.querySelector("[badge-users-accept]")
  const userId = badgeUsersAccept.getAttribute("badge-users-accept")
  if(userId == data.userId){
    badgeUsersAccept.innerHTML = data.lengthAcceptFriends
  }
})
// SEVER_RETURN_LENGTH_ACCEPT_FRIEND