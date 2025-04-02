const bingServes  = require("./bing.js");

const interfaceMap = {
  getBingList: bingServes.getGlobalBingList,
  addBing: bingServes.addBing,
};

module.exports = function serve(req, res) {
  let params = req.params; // 路径参数
  let query = req.query; // 路径查询参数
  let body = req.body; // 请求体参数

  let serveName = req.path.replace(/^(\/api\/|\/)/g, "");
  let serve = interfaceMap[serveName];

  if (serve) {
    serve(res, {
      params,
      query,
      body,
    });
  } else {
    res.status(404).json({
      status: 404,
      message: "请求失败，接口不存在",
    });
  }
};
