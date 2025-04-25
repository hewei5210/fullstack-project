const bingServer = require("../scripts/bing.js");
const fs = require("fs");

function getGlobalBingList(res, reqData) {
  let bingList = bingServer.getList(reqData);

  res.status(200).json({
    status: 200,
    message: "success",
    data: bingList,
  });
}

function search(res, reqData){
  let searchList = bingServer.search(reqData,res)
  res.status(200).json({
    status: 200,
    message: "success",
    data: searchList,
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

async function updateBing(res, reqData) {
  if (!reqData.body) {
    return res.status(400).json({
      status: "400",
      message: "参数不完整",
      data: null,
    });
  }

  try {
    let actionRes = await bingServer.update(reqData);

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
  if (!reqData.query) {
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

async function downloadTemplate(res) {
  try {
    const { filePath, fileName } = await bingServer.downloadTemplate();
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader("Content-Disposition", `attachment; filename="${fileName}"`);

    const readStream = fs.createReadStream(filePath);
    readStream.pipe(res);
    readStream.on("end", () => {
      typeof done === "function" && done();
    });
  } catch (e) {
    res.status(500).json({
      status: 500,
      message: e.message,
    });
  }
}

async function batchUpload(res, reqData) {
  try {
    // 将文件对象传递给业务层
    const result = await bingServer.batchUpload(reqData.file);
    res.status(200).json(result);
  } catch (e) {
    res.status(500).json({ status: 500, message: e.message });
  }
}

module.exports = {
  getGlobalBingList,
  addBing,
  updateBing,
  delBing,
  exportBing,
  applyId,
  downloadTemplate,
  batchUpload,
  search
};
