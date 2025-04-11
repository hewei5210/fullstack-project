const fs = require("fs");
const path = require("path");
const Papa = require("papaparse");

const bingFilePath = "./data/bing.csv";
const idPrefix = "ccfe-";
const globalID_limit = "3000";

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

// 根据读取的文件进行初始化。务必确保此方法仅在服务重启/启动之后被调用一次
async function loadBingList() {
  const filePath = bingFilePath;

  try {
    const collection = await readCSV(filePath);
    let bingMap = {};
    let idList = [];

    collection.forEach((item) => {
      idList.push(item.id);
      bingMap[item.id] = {
        id: item.id,
        source: item.source,
        target: {
          "zh-CN": item["target(zh-CN)"],
          "zh-HK": item["target(zh-HK)"],
          "en-US": item["target(en-US)"],
        },
        status: "ready", // 集合项初始状态
      };
    });

    loadExtraIDList(idList);

    // return (globalBingList = quickSort(idList, compareById).map(
    //   (id) => bingMap[id]
    // ));

    return (globalBingList = idList
      .slice()
      .sort(compareById)
      .map(
        // 注意要复制数组
        (id) => bingMap[id]
      ));
  } catch (error) {
    console.error("读取或解析 CSV 文件时出错:", error);
  }
}

// 针对集合的快排（相同id不稳定）
function quickSort(arr, compareFn) {
  if (arr.length <= 1) return arr;

  const pivot = arr[0];
  const left = [];
  const right = [];

  for (let i = 1; i < arr.length; i++) {
    if (compareFn(arr[i], pivot) < 0) {
      left.push(arr[i]);
    } else {
      right.push(arr[i]);
    }
  }

  return [...quickSort(left, compareFn), pivot, ...quickSort(right, compareFn)];
}

// 比较函数：按 id 字段排序（字符串比较）
function compareById(a, b) {
  return a.localeCompare(b);
}

// 根据入参 bingList 计算出空闲的 id 队列
function loadExtraIDList(currentIDList) {
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
    source: b.source,
    "target(zh-CN)": b.target["zh-CN"],
    "target(zh-HK)": b.target["zh-HK"],
    "target(en-US)": b.target["en-US"],
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
      "zh-CN": bing["zh-CN"],
      "zh-HK": bing["zh-HK"],
      "en-US": bing["en-US"],
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

module.exports = {
  init,
  add,
  update,
  del,
  getList,
  importFile,
  exportFile,
  applyNewID,
};
