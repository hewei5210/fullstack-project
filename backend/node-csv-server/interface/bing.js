const bingServer = require("../scripts/bing.js");
const fs = require("fs");
// multer 是 ​​Node.js 中用于处理文件上传的中间件​​，专为 Express 框架设计。
const multer = require("multer");
// 修改multer配置（新增存储引擎和错误处理）
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    fs.mkdirSync("uploads/", { recursive: true });
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    const originalname = Buffer.from(file.originalname, "latin1").toString(
      "utf8"
    );
    cb(null, `${Date.now()}-${originalname}`);
  },
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB限制
    files: 1,
  },
  fileFilter: (req, file, cb) => {
    const allowedMimes = [
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "application/vnd.ms-excel",
    ];
    allowedMimes.includes(file.mimetype)
      ? cb(null, true)
      : cb(new Error("仅支持.xlsx/.xls格式"));
  },
});
function getGlobalBingList(res, reqData) {
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

async function batchUpload(res, req) {
  try {
    // 新增multer中间件处理
    const uploadMiddleware = new Promise((resolve, reject) => {
      upload.single("file")(req, res, (err) => {
        // 'file'对应前端上传字段名
        if (err) reject(err);
        resolve();
      });
    });

    // 执行中间件链
    await uploadMiddleware(req, res);

    // 验证文件是否存在
    if (!req.file) {
      throw new Error("未收到上传文件");
    }

    // 将文件对象传递给业务层
    const result = await bingServer.batchUpload(req.file);
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
};
