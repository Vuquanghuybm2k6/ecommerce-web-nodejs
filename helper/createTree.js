const createTree = (arr, parentId = "") =>{
    const tree = []
    arr.forEach((item)=>{
      if(item.parent_id === parentId){
        const newItem = item
        const children = createTree(arr, item.id)
        if(children.length > 0){
          newItem.children = children
        }
        tree.push(newItem)
      }
    })
    return tree
}

module.exports.tree = (arr, parentId = "") =>{ // hàm này ta dung để xuất khẩu nên ta không thể dùng đệ quy trong hàm này được mà phải tách nhỏ thành hàm khác
    const tree = createTree(arr, parentId = "")
    return tree
}