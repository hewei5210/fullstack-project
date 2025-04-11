const bingServer = require("../scripts/bing.js");

function getGlobalBingList(res, reqData) {
  console.log('reqData',reqData)
  let bingList = bingServer.getList(reqData);

  res.status(200).json({
    status: 200,
    message: "success",
    data: bingList,
  });
}

function applyId(res) {
  let data = bingServer.applyNewID();

  res.status(200).json({
    status: 200,
    message: "success",
    data: data,
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
async function delBing(res, reqData) {
  if (!reqData.body) {
    return res.status(400).json({
      status: "400",
      message: "参数不完整",
      data: null,
    });
  }

  try {
    let actionRes = await bingServer.del(reqData);

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

async function exportBing(res, reqData) {
  let langType = reqData.query.lang;

  try {
    let { filePath, fileName, done } = await bingServer.exportFile(langType);

    res.setHeader("Content-Type", "application/json");
    res.setHeader("Content-Disposition", `'attachment; filename="${fileName}"`);

    res.download(filePath, fileName, (err) => {
      if (err) {
        res.status(500).send("Error occurred while downloading the file.");
      } else {
        typeof done === "function" && done();
      }
    });
  } catch (e) {
    res.status(400).json({
      status: 400,
      message: `下载失败：${e}`,
      data: "",
    });
  }
}

module.exports = {
  getGlobalBingList,
  addBing,
  delBing,
  exportBing,
  applyId,
};
