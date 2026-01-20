module.exports.createPost = (req,res,next) =>{
  if(!req.body.title){
    req.flash("error", "Vui lòng nhập lại tiêu đề")
    res.redirect(req.get("Referer"))
    return
  }
  next()
}
module.exports.editPatch = (req,res,next) =>{
  if(!req.body.title){
    req.flash("error", "Vui lòng nhập lại tiêu đề")
    res.redirect(req.get("Referer"))
    return
  }
  next()
}