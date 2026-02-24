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
socket.on("SERVER_RETURN_LENGTH_ACCEPT_FRIEND", (data)=>{
  const badgeUsersAccept = document.querySelector("[badge-users-accept]")
  const userId = badgeUsersAccept.getAttribute("badge-users-accept")
  if(userId == data.userId){
    badgeUsersAccept.innerHTML = data.lengthAcceptFriends
  }
})
// SEVER_RETURN_LENGTH_ACCEPT_FRIEND

// SEVER_RETURN_INFO_ACCEPT_FRIEND
socket.on("SERVER_RETURN_INFO_ACCEPT_FRIEND", (data)=>{
  const dataUsersAccept = document.querySelector("[data-users-accept]")
  const userId = dataUsersAccept.getAttribute("data-users-accept")
  if(userId == data.userId){
    // Vẽ user ra giao diện
    const newBoxUser = document.createElement("div")
    newBoxUser.classList.add("col-6")
    newBoxUser.innerHTML = 
    `
      <div class="box-user">
        <div class="inner-avatar">
          <img src=${data.infoUserA.avatar} alt=${data.infoUserA.fullName}>
        </div>
        <div class="inner-info">
          <div class="inner-name">${data.infoUserA.fullName}</div>
          <div class="inner-buttons">
            <button
              class="btn btn-sm btn-primary mr-1"
              btn-accept-friend=${data.infoUserA._id}>
              Chấp nhận
            </button>

            <button
              class="btn btn-sm btn-secondary mr-1"
              btn-refuse-friend=${data.infoUserA._id}>
              Xóa
            </button>

            <button
              class="btn btn-sm btn-secondary mr-1"
              btn-deleted-friend
              disabled>
              Đã xóa
            </button>

            <button
              class="btn btn-sm btn-primary mr-1"
              btn-accepted-friend
              disabled>
              Đã chấp nhận
            </button>
          </div>
        </div>
      </div>
    `
    dataUsersAccept.appendChild(newBoxUser)
    // End Vẽ user ra giao diện

    // Xóa lời mời kết bạn
    const btnRefuseFriend = newBoxUser.querySelector("[btn-refuse-friend]")
      btnRefuseFriend.addEventListener("click",()=>{
        btnRefuseFriend.closest(".box-user").classList.add("refuse")
        const userId = btnRefuseFriend.getAttribute("btn-refuse-friend")
        socket.emit("CLIENT_REFUSE_FRIEND", userId)
      })
    // End Xóa lời mời kết bạn

    // Chấp nhận lời mời kết bạn
    const btnAcceptFriend = newBoxUser.querySelector("[btn-accept-friend]")
      btnAcceptFriend.addEventListener("click",()=>{
        btnAcceptFriend.closest(".box-user").classList.add("accepted")
        const userId = btnAcceptFriend.getAttribute("btn-accept-friend")
        socket.emit("CLIENT_ACCEPT_FRIEND", userId)
      })
    // End Chấp nhận lời mời kết bạn

  }
})
// SEVER_RETURN_INFO_ACCEPT_FRIEND