const fs = require("fs");
const path = require("path");
const ExcelJS = require("exceljs");
const Papa = require("papaparse");

const bingFilePath = "./data/bing.csv";
const idPrefix = "ccfe-";
const globalID_limit = "3000"; // 一次的上传极限是3000

let globalBingList = []; // 当前已配置的词条集合
let globalIDList = []; // 可用的 id 集合
let writeStatus = "ready"; // ready write

function readCSV(filePath) {
  return new Promise((resolve, reject) => {
    // 读取文件内容
    fs.readFile(filePath, "utf8", (err, data) => {
      if (err) {
        return reject(err);
      }

      // Papa.parse 解析 CSV 数据为 JSON 数组
      const parsedData = Papa.parse(data, {
        header: true, // 将第一行作为表头
        skipEmptyLines: true, // 跳过空行
      });

      if (parsedData.errors.length > 0) {
        return reject(parsedData.errors);
      }

      resolve(parsedData.data); // 返回解析后的数据（数组形式）
    });
  });
}

/* 
根据读取的文件进行初始化。务必确保此方法仅在服务重启/启动之后被调用一次
1、从 CSV 文件读取多语言词条数据
2、构建内存数据结构供快速查询
3、生成可用 ID 池（用于新增词条时自动分配唯一 ID）
4、确保数据排序规则与 ID 连续性
*/
async function loadBingList() {
  const filePath = bingFilePath;

  try {
    const collection = await readCSV(filePath); // 读取csv文件内容
    let bingMap = {};
    let idList = [];
    console.log("++++++++++++++++++++初始的collection+++++++++++++", collection.slice(25, 26));
    collection.forEach((item) => {
      idList.push(item.id);
      bingMap[item.id] = {
        id: item.id,
        source: item.Source,
        target: {
          "zh-CN": item["target(zh-CN)"],
          "zh-HK": item["target(zh-HK)"],
          "en-US": item["target(en-US)"],
        },
        status: "ready", // 集合项初始状态
      };
    });

    // 生成可用 ID 池
    
    // console.log("idList", idList.slice(0, 10), idList.slice(2740,2747));
    globalBingList = idList
      .slice()
      .sort(compareById)
      .map(
        // 注意要复制数组
        (id) => bingMap[id]
      );
    console.log("globalBingList", globalBingList.slice(25,26));
    
    commit() // 将排序后的内容重新写入csv文件

    // 根据入参 bingList 计算出空闲的 id 队列
    loadExtraIDList(idList);

    return globalBingList;
  } catch (error) {
    console.error("读取或解析 CSV 文件时出错:", error);
  }
}

// 比较函数：按 id 字段排序（字符串比较）
function compareById(a, b) {
  const numA = parseInt(a.split("-")[1]);
  const numB = parseInt(b.split("-")[1]);
  return numA - numB; 
}

// 根据入参 bingList 计算出空闲的 id 队列
function loadExtraIDList(currentIDList) {
  console.log("我被执行了一次");
  if (currentIDList.length === 0) return [];

  let previousID = 0;

  for (let i = 0; i <= currentIDList.length - 1; i++) {
    if (globalIDList.length > globalID_limit) break;

    let item = currentIDList[i];
    let idInt = parseInt(item.replace(idPrefix, ""));

    if (previousID + 1 === idInt) {
      previousID = idInt;
    } else if (previousID + 1 < idInt) {
      let distanceIDs = new Array(idInt - previousID - 1)
        .fill(previousID + 1)
        .map((v, i) => getNewID(v + i));

      globalIDList = globalIDList.concat(distanceIDs);
      previousID = idInt;
    } else if (i === currentIDList.length - 1) {
      continue;
    } else {
      throw `获取空闲 id 集合异常：【id可能重复、可能存在空白行、前置排序异常】：Previous ${previousID}, Current ${idInt}, Next ${
        currentIDList[i + 1]
      }`;
    }
  }
  
  return globalIDList;
}

// 生成一个新的 id 控制对象
function getNewID(idNumber) {
  return {
    id: idPrefix + (idNumber + "").padStart(9, "0"),
    status: "ready", // 空闲 id 的状态初始状态
  };
}

// 申请一个新的 id 对象供新增词条使用
function applyNewID() {
  if (globalIDList.length === 0) return null;

  let newID = globalIDList.find((item) => item.status === "ready");
  console.log("newID", newID);
  if (newID) {
    newID.status = "applied";

    return newID.id;
  } else if (globalBingList.length > 0) {
    let previousIDInt = parseInt(
      globalBingList[globalBingList.length - 1].id.replace(idPrefix, "")
    );

    newID = getNewID(previousIDInt + 1);

    newID.status = "applied";

    globalIDList.push(newID);

    return newID.id;
  } else {
    newID = getNewID(1);

    newID.status = "applied";

    globalIDList.push(newID);

    return newID.id;
  }
}

async function init() {
  await loadBingList();

  console.log("=== Global bing list was ready! ===");
}

// 提交不同类型修改，使用数据副本进行处理，若成功写文件再同步到内存。
// 注意 globalBingList 只能在此方法中（或初始化时）修改，其余地方当禁止访问。
// 此处操作会保证 globalBingList 和本地 csv 文件的同步性。
// function commit(type, bingData) {
//   if (writeStatus === "write") return;

//   writeStatus = "write";

//   let data, replaceIndex;

//   if (type === "add") {
//     data = globalBingList.concat(bingData);
//   } else if (type === "update") {
//     replaceIndex = globalBingList.findIndex((bing) => bing.id === bingData.id);

//     if (replaceIndex === -1) {
//       throw "编辑失败：未找到编辑项";
//     }

//     let copy = globalBingList.slice();

//     copy.splice(replaceIndex, 1, Object.assign({}, bingData));

//     data = copy;
//   } else if (type === "del") {
//     replaceIndex = globalBingList.findIndex((bing) => bing.id === bingData.id);

//     if (replaceIndex === -1) {
//       throw "删除失败：未找到删除项";
//     }

//     let copy = globalBingList.slice();

//     copy.splice(replaceIndex, 1);

//     data = copy;
//   }

//   // 写入前再处理下，映射为 csv 文件内字段
//   data = data.map((bing) => ({
//     id: bing.id,
//     source: bing.source || "",
//     "target(zh-CN)": bing.target["zh-CN"] || "",
//     "target(zh-HK)": bing.target["zh-HK"] || "",
//     "target(en-US)": bing.target["en-US"] || "",
//   }));

//   // 将 json 数据转换为 csv 字符串，以字段名为列名称
//   const csvString = Papa.unparse(data);

//   fs.writeFile(bingFilePath, csvString, (err) => {
//     if (err) {
//       console.error("写入文件时出错:", err);

//       writeStatus = "ready";
//     } else {
//       console.log(`CSV 文件已成功写入`);

//       if (type === "add") {
//         globalBingList.push(bingData);
//       } else if (type === "update") {
//         globalBingList.splice(replaceIndex, 1, bingData);
//       } else if (type === "del") {
//         globalBingList.splice(replaceIndex, 1);
//       }

//       writeStatus = "ready";
//     }
//   });
// }
function commit(type, bingData) {
  if (writeStatus === "write") return;

  writeStatus = "write";

  // 创建数据副本（保持不可变性）
  let dataCopy = [...globalBingList];

  // 操作副本数据
  if (type === "add") {
    dataCopy.push(bingData); // ✅ 直接操作副本
  } else if (type === "update") {
    const index = dataCopy.findIndex((b) => b.id === bingData.id);
    if (index > -1) dataCopy[index] = bingData;
  } else if (type === "del") {
    dataCopy = dataCopy.filter((b) => b.id !== bingData.id);
  }

  // 生成 CSV 数据
  const csvData = dataCopy.map((b) => ({
    id: b.id,
    Source: b.source,
    "target(zh-CN)": b.target["zh-CN"],
    "target(en-US)": b.target["en-US"],
    "target(zh-HK)": b.target["zh-HK"],
  }));

  // 写入文件
  fs.writeFile(bingFilePath, Papa.unparse(csvData), (err) => {
    if (err) {
      console.error("写入失败:", err);
      writeStatus = "ready";
      return;
    }

    // ✅ 原子性更新内存数据
    globalBingList = dataCopy;
    writeStatus = "ready";
    console.log("数据写入成功并同步内存");
  });
}
async function add(bing) {
  bing = Object.assign({}, bing.body);
  if (!bing.id || typeof bing.id !== "string" || !bing.id.startsWith("ccfe-"))
    return Promise.reject(`新增：缺少合法 id:${bing.id}`);

  let appliedID = globalIDList.find((item) => item.id === bing.id);

  if (!appliedID) return Promise.reject("新增：提交的 id 不合法，请重新生成");

  if (appliedID.status !== "applied")
    return Promise.reject("新增：提交的 id 不合法，未提交申请");

  return commit("add", {
    id: bing.id,
    source: bing.source || "",
    target: {
      "zh-CN": bing.target["zh-CN"],
      "zh-HK": bing.target["zh-HK"],
      "en-US": bing.target["en-US"],
    },
  });
}

async function update(bing) {
  bing = Object.assign({}, bing.body);
  if (!bing.id || typeof bing.id !== "string" || !bing.id.startsWith("ccfe-"))
    return Promise.reject(`更新：缺少合法 id:${bing.id}`);

  return commit("update", {
    id: bing.id,
    source: bing.source || "",
    target: {
      "zh-CN": bing.target["zh-CN"],
      "zh-HK": bing.target["zh-HK"],
      "en-US": bing.target["en-US"],
    },
  });
}

async function del(bing) {
  bing = Object.assign({}, bing.body);
  if (!bing.id || typeof bing.id !== "string" || !bing.id.startsWith("ccfe-"))
    return Promise.reject(`删除：缺少合法 id:${bing.id}`);

  return commit("del", {
    id: bing.id,
  });
}

function getList(bing) {
  // 增加分页功能
  const total = globalBingList.length;
  const start = (bing.query.page - 1) * bing.query.pageSize;
  const end = Number(start) + Number(bing.query.pageSize);
  const data = globalBingList.slice(start, end);
  return { data, total };
}

async function importFile() {}

async function exportFile(langType) {
  let jsonData = {};

  langType = langType || "empty";

  if (langType === "zh-CN" || langType === "zh-HK" || langType === "en-US") {
    globalBingList.forEach((bing) => {
      jsonData[bing.id] = bing.target[langType];
    });
  }

  const fileName = `${langType}.json`;
  const filePath = path.join(__dirname, "../exports", fileName);
  const jsonContent = JSON.stringify(jsonData, null, 2);

  if (!fs.existsSync(path.dirname(filePath))) {
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
  }

  fs.writeFileSync(filePath, jsonContent);

  return Promise.resolve({
    filePath,
    fileName,
    done: () => fs.unlinkSync(filePath),
  });
}

async function downloadTemplate() {
  try {
    const templatePath = path.resolve(
      __dirname,
      "../data/translate_template.xlsx"
    );
    if (!fs.existsSync(templatePath)) {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet("翻译模板");
      worksheet.columns = [
        { header: "翻译项", key: "zh-CN", width: 30 },
        { header: "翻译项-英文", key: "en-US", width: 30 },
        { header: "翻译项-繁体", key: "zh-HK", width: 30 },
      ];
      await workbook.xlsx.writeFile(templatePath);
    }
    return {
      filePath: templatePath,
      fileName: "translation_template.xlsx",
    };
  } catch (e) {
    throw new Error(`模板生成失败: ${e.message}`);
  }
}

async function batchUpload(file) {
  try {
    // 校验文件头签名（XLSX 文件头为 PK\x03\x04）
    const xlsxSignature = file.buffer.slice(0, 4).toString("hex");
    if (xlsxSignature !== "504b0304") {
      throw new Error("文件格式损坏，非标准 XLSX 文件");
    }

    // 校验 MIME 类型
    if (
      file.mimetype !==
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    ) {
      throw new Error("仅支持 .xlsx 文件");
    }

    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(file.buffer); // 替代 readFile(file.buffer)

    const worksheet = workbook.getWorksheet(1);
    const results = {
      data: [],
      total: 0,
      success: 0,
      errors: [],
    };
    let i = 0;
    // 逐行处理Excel数据
    worksheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
      i++;
      console.log("执行次数", i);
      if (rowNumber === 1) return; // 跳过表头

      results.total++;

      try {
        const record = {
          id: applyNewID(),
          source: row.getCell(1).value,
          target: {
            "zh-CN": row.getCell(1).value,
            "en-US": row.getCell(2).value || "",
            "zh-HK": row.getCell(3).value || "",
          },
        };

        // 数据校验
        if (!record.id || !record.source || !record.target["zh-CN"]) {
          throw new Error("必填字段缺失");
        }

        // 检查ID唯一性
        // if (globalBingList.some((item) => item.id === record.id)) {
        //   throw new Error("ID已存在");
        // }

        // 提交数据
        commit("add", record);
        results.data.push(record);
        results.success++;
      } catch (error) {
        results.errors.push({
          row: rowNumber,
          message: error.message,
        });
      }
    });

    return {
      code: 200,
      data: results,
      message: `成功导入 ${results.success} 条，失败 ${results.errors.length} 条`,
    };
  } catch (error) {
    throw new Error(`文件处理失败: ${error.message}`);
  }
}

module.exports = {
  init,
  add,
  update,
  del,
  getList,
  importFile,
  exportFile,
  applyNewID,
  downloadTemplate,
  batchUpload,
};
