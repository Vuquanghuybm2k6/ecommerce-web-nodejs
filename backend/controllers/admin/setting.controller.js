const SettingGeneral = require("../../models/settings-general.model")

// [GET]: /admin/settings/general
module.exports.general = async (req, res) => {
  const settingGeneral = await SettingGeneral.findOne({})
  res.json({
    code: 200,
    message: "Thành công",
    data: {
      settingGeneral: settingGeneral
    }
  })
}

// [PATCH]: /admin/settings/general
module.exports.generalPatch = async (req, res) => {
  const settingGeneral = await SettingGeneral.findOne({})
  if(settingGeneral){
    await SettingGeneral.updateOne({_id: settingGeneral.id}, req.body)
  }
  else{
    const record = new SettingGeneral(req.body)
    await record.save()
  }
  res.json({
    code: 200,
    message: "Cập nhật thành công!"
  })
}
