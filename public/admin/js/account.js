// Delete Account
const buttonsDelete = document.querySelectorAll("[button-delete]")
if(buttonsDelete.length > 0){
  buttonsDelete.forEach(button=>{
    button.addEventListener("click",()=>{
      const isConfirm = confirm("Bạn có chắc muốn xóa tài khoản này")
      if(!isConfirm){
        return
      }
      const formDeleteAccount = document.querySelector("#form-delete-account")
      const id = button.getAttribute("data-id")
      const path = formDeleteAccount.getAttribute("data-path")
      const action = `${path}/${id}?_method=PATCH`
      formDeleteAccount.action = action
      formDeleteAccount.submit()
    })
  })
}
// End Delete Account
// Change Status
const buttonsChangeStatus = document.querySelectorAll("[button-change-status]")
if(buttonsChangeStatus.length > 0){
  buttonsChangeStatus.forEach(button=>{
    const formChangeStatus = document.querySelector("#form-change-status")
    const path = formChangeStatus.getAttribute("data-path")
    button.addEventListener("click", ()=>{
      const status = button.getAttribute("data-status")
      const id = button.getAttribute("data-id")
      let newStatus = status == "active" ? "inactive": "active"
      const action = `${path}/${newStatus}/${id}?_method=PATCH`
      formChangeStatus.action = action
      formChangeStatus.submit()
    })
  })
}
// End Change Status