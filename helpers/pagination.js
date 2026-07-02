module.exports = (query, totalProduct, pagination) =>{
  // Lấy ra tổng số trang
  pagination.totalPage = Math.ceil(totalProduct/pagination.limitItem)
  // Lấy ra trang hiện tại
  if(query.page){
    pagination.currentPage = parseInt(query.page)
  }
  // Lấy ra số trang bị skip
  pagination.skip = (pagination.currentPage-1)*pagination.limitItem
  return pagination
}