const { update } = require("../scripts/bing.js");
const bingServes = require("./bing.js");

// key 就是对外暴露的接口服务名，若此处不配置，则接口访问 404 返回
const interfaceMap = {
  getBingList: bingServes.getGlobalBingList,
  search: bingServes.search,
  addBing: bingServes.addBing,
  delBing: bingServes.delBing,
  exportBing: bingServes.exportBing,
  applyId: bingServes.applyId,
  updateBing: bingServes.updateBing,
  downloadTemplate: bingServes.downloadTemplate,
  translationItem: bingServes.batchUpload,
};

module.exports = function serve(req, res) {
  let params = req.params; // 路径参数
  let query = req.query; // 路径查询参数
  let body = req.body; // 请求体参数
  let file = req.file;

  let serveName = req.path.replace(/^(\/api\/|\/)/g, "");
  let serve = interfaceMap[serveName];
  
  if (serve) {
    serve(res, {
      params,
      query,
      body,
      file,
    });
  } else {
    res.status(404).json({
      status: 404,
      message: "请求失败，接口不存在",
    });
  }
};
