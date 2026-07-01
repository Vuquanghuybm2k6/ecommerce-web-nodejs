// Delete Item
const buttonsDelete = document.querySelectorAll("[button-delete]")
if(buttonsDelete.length>0){
  buttonsDelete.forEach(button=>{
    button.addEventListener("click",()=>{
      const isConfirm = confirm("Bạn có chắc muốn xóa sản phẩm này")
      if(isConfirm){
        const formDeleteItem = document.querySelector("#form-delete-category")
        const id = button.getAttribute("data-id")
        const path = formDeleteItem.getAttribute("data-path")
        const action = `${path}/${id}?_method=PATCH`
        formDeleteItem.action = action
        formDeleteItem.submit()
      }
    })
  })
}
// End Delete Item