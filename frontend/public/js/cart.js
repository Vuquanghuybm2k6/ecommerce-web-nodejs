// Cập nhật số lượng sản phẩm giỏ hàng
const inputsQuantity = document.querySelectorAll("input[name='quantity']") // muốn tìm theo thuộc tính thì phải viết vào trong ngoặc vuông
if(inputsQuantity.length > 0){
  inputsQuantity.forEach(input=>{
    input.addEventListener("change", (e)=>{
      const productId = input.getAttribute("product-id")
      const quantity = parseInt(input.value)
      if(quantity>0){
        window.location.href = `cart/update/${productId}/${quantity}`
      }
    })
  })
}
// End Cập nhật số lượng sản phẩm giỏ hàng