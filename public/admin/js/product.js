// Tách ra thành file riêng như này cho các tính năng liên quan đến phần product, các tính năng như phân trang hay tìm kiếm thì có thế để ở file 
// chung để sử dụng cho nhiều trang khác
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
// Delete Item
const buttonsDelete = document.querySelectorAll("[button-delete]")
if(buttonsDelete.length>0){
  buttonsDelete.forEach(button=>{
    button.addEventListener("click",()=>{
      const isConfirm = confirm("Bạn có chắc muốn xóa sản phẩm này")
      if(isConfirm){
        const formDeleteItem = document.querySelector("#form-delete-item")
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

// Update Position
const inputsPosition = document.querySelectorAll("input[name='position']") // muốn tìm theo thuộc tính thì phải viết vào trong ngoặc vuông
if(inputsPosition.length > 0){
  inputsPosition.forEach(input=>{
    input.addEventListener("change", (e)=>{
      e.preventDefault()
      const productId = input.getAttribute("product-id")
      const position = parseInt(input.value)
      if(position>0){
        window.location.href = `products/update-position/${productId}/${position}`
      }
    })
  })
}
// End Update Position