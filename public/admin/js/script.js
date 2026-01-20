// Button status
const buttonsStatus = document.querySelectorAll("[button-status]")
if(buttonsStatus.length > 0){
  let url = new URL(window.location.href)
  buttonsStatus.forEach(button=>{
    button.addEventListener("click",()=>{
      const status = button.getAttribute("button-status")
      if(status){
        url.searchParams.set("status",status)
      }
      else{
        url.searchParams.delete("status")
      }
      window.location.href = url.href
    })
  })
}
// End button status
// Form Search
const formSearch = document.querySelector("#form-search")
if(formSearch){
  formSearch.addEventListener("submit",(e)=>{
    e.preventDefault()
    const url = new URL(window.location.href)
    const keyword = e.target.elements.keyword.value
    if(keyword){
      url.searchParams.set("keyword", keyword)
    }
    else{
      url.searchParams.delete("keyword")
    }
    window.location.href = url.href

  })
}
// End Form Search
// Pagination
const buttonsPagination = document.querySelectorAll("[button-pagination]")
if(buttonsPagination.length > 0){
  buttonsPagination.forEach(button=>{
    button.addEventListener("click",()=>{
      let url =new URL(window.location.href)
      const page = button.getAttribute("button-pagination")
      url.searchParams.set("page", page)
      window.location.href = url.href
    })
  })
}
// End Pagination

// Checkbox
const checkboxMulti = document.querySelector("[checkbox-multi]")
if (checkboxMulti) {
  const inputCheckAll = checkboxMulti.querySelector("input[name='checkall']");
  const inputsId = checkboxMulti.querySelectorAll("input[name= 'id']");
  inputCheckAll.addEventListener("click", () => {
    if (inputCheckAll.checked) {
      inputsId.forEach((input) => {
        input.checked = true;
      })
    } else {

      inputsId.forEach((input) => {
        input.checked = false;
      })
    }
  })

  inputsId.forEach((input) => {
    input.addEventListener("click", () => {
      const countChecked = checkboxMulti.querySelectorAll("input[name='id']:checked").length
      if (countChecked == inputsId.length) {
        inputCheckAll.checked = true
      }
      else{
        inputCheckAll.checked = false
      }
    })
  })
}
// End Checkbox

// Form Change Multi
const formChangeMulti = document.querySelector("[form-change-multi]")
if(formChangeMulti){
  formChangeMulti.addEventListener("submit", (e)=>{
    e.preventDefault();
    const checkboxMulti = document.querySelector("[checkbox-multi]")
    const inputsCheck = checkboxMulti.querySelectorAll("input[name='id']:checked")
    const typeChange = e.target.elements.type.value
    if(typeChange == "delete-all"){
      const isConfirm = confirm("Bạn có chắc muốn xóa sản phẩm này")
      if(!isConfirm){
        return
      }
    }
    if(inputsCheck.length>0){
      let ids = [];
      const inputIds = formChangeMulti.querySelector("input[name='ids']")
      inputsCheck.forEach(input =>{
        const id = input.value;
        if(typeChange === "change-position"){
          const position = input.closest("tr").querySelector("input[name = 'position']").value 
          // từ cái thẻ input, tìm phần tử cha là "tr" gần thẻ input nhất, xong rồi querySelector đến cái "input[name = 'position']"
          // để tìm cái giá trị người dùng nhập
          ids.push(`${id}-${position}`)
        }
        else{
          ids.push(id)
        }
      })
      inputIds.value = ids.join(", ")
      console.log(ids.join(", "));
      formChangeMulti.submit();
    }
    else{
      alert("Vui lòng nhập lại")
    }
  })
}

// End Form Change Multi
// Show Alert
const showAlert = document.querySelector("[show-alert]")
if(showAlert){
  const time = showAlert.getAttribute("data-time")
  const closeAlert = showAlert.querySelector("[close-alert]")
  setTimeout(()=>{
    showAlert.classList.add("alert-hidden")
  },time)
  closeAlert.addEventListener("click",()=>{
    showAlert.classList.add("alert-hidden")
  })
}
// End Show Alert
