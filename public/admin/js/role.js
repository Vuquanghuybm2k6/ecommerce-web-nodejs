// Delete Role
const buttonsDelete = document.querySelectorAll("[button-delete]")
if(buttonsDelete.length > 0){
  buttonsDelete.forEach(button=>{
    button.addEventListener("click",()=>{
      const isConfirm = confirm("Bạn có chắc muốn xóa nhóm quyền này")
      if(!isConfirm){
        return
      }
      const formDeleteRole = document.querySelector("#form-delete-role")
      const id = button.getAttribute("data-id")
      const path = formDeleteRole.getAttribute("data-path")
      const action = `${path}/${id}?_method=PATCH`
      formDeleteRole.action = action
      formDeleteRole.submit()
    })
  })
}
// End Delete Role