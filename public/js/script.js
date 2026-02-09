// Show Alert
const showAlert = document.querySelector("[show-alert]")
if (showAlert) {
  const time = showAlert.getAttribute("data-time")
  const closeAlert = showAlert.querySelector("[close-alert]")
  setTimeout(() => {
    showAlert.classList.add("alert-hidden")
  }, time)
  closeAlert.addEventListener("click", () => {
    showAlert.classList.add("alert-hidden")
  })
}
// End Show Alert
// Pagination
const buttonsPagination = document.querySelectorAll("[button-pagination]")
if (buttonsPagination.length > 0) {
  buttonsPagination.forEach(button => {
    button.addEventListener("click", () => {
      let url = new URL(window.location.href)
      const page = button.getAttribute("button-pagination")
      url.searchParams.set("page", page)
      window.location.href = url.href
    })
  })
}
// End Pagination
