const bingServer = require("../scripts/bing.js");

function getGlobalBingList(res) {
  let bingList = bingServer.getList();

  res.status(200).json({
    status: 200,
    message: "success",
    data: bingList,
  });
}

async function addBing(res, reqData) {
  if (!reqData.body) {
    return res.status(400).json({
      status: "400",
      message: "参数不完整",
      data: null,
    });
  }

  try {
    let actionRes = await bingServer.add(reqData);

    res.status(200).json({
      status: 200,
      message: "success",
      data: actionRes,
    });
  } catch (e) {
    res.status(400).json({
      status: 400,
      message: `请求失败：${e}`,
      data: "",
    });
  }
}

module.exports = {
  getGlobalBingList,
  addBing,
};
