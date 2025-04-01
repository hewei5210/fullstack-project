const fs = require("fs");
const Papa = require("papaparse");

const bingFilePath = "./data/bing.csv";
const idPrefix = "ccfe-";

let globalBingList = [];
let globalIDList = [];

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

async function loadBingList() {
  const filePath = bingFilePath;

  try {
    const collection = await readCSV(filePath);
    let bingList = [];

    collection.forEach((item, index) => {
      bingList.push({
        id: item.id,
        source: item.source,
        target: {
          "zh-CN": item["target(zh-CN)"],
          "zh-HK": item["target(zh-HK)"],
          "en-US": item["target(en-US)"],
        },
        status: "ready", // 集合项初始状态
      });
    });

    return (globalBingList = quickSort(bingList, compareById));
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
  return a.id.localeCompare(b.id);
}

// 根据入参 bingList 计算出空闲的 id 队列
function loadExtraIDList() {
  if (globalBingList.length === 0) return [];

  let previousID = 0;

  globalBingList.forEach((item, index) => {
    let idInt = parseInt(item.id.replace(idPrefix, ""));

    if (previousID + 1 === idInt) {
      previousID = idInt;
    } else if (previousID + 1 < idInt) {
      let distanceIDs = new Array(idInt - previousID - 1)
        .fill(previousID + 1)
        .map((v, i) => getNewID(v + i));

      globalIDList = globalIDList.concat(distanceIDs);

      previousID = idInt;
    } else if (index === globalBingList.length - 1) {
      return;
    } else {
      throw "获取空闲 id 集合异常：前置排序可能异常";
    }
  });

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

  let globalIDExtra = loadExtraIDList();

  console.log("=== Global extra id was ready! ===");

  console.log("applyNewID:", applyNewID());

  console.log(globalIDExtra);
}

exports.init = init;
exports.loadBingList = loadBingList;
exports.loadExtraIDList = loadExtraIDList;
