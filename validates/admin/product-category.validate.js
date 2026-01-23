module.exports.create = (req,res,next) =>{
  if(!req.body.title){
    req.flash("error", "Vui lòng nhập lại tiêu đề")
    res.redirect(req.get("Referer"))
    return
  }
  next()
}