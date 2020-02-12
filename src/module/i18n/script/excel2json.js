const xlsx = require("xlsx");
const fs = require("fs");
const mkdirp = require("mkdirp");

const TRANSLATIONS_PATH = "../translations";
const EXCEL_PATH = "../excel/renrenbit.xlsx";

const workbook = xlsx.readFile(EXCEL_PATH);

for (const biz in workbook.Sheets) {
  const worksheet = workbook.Sheets[biz];
  const columns = xlsx.utils.sheet_to_json(worksheet);
  const { zh, en } = formatJSON(columns);
  const bizPath = `${TRANSLATIONS_PATH}/${biz}`;
  mkdirp.sync(bizPath);
  // fs.writeFileSync(`${bizPath}/zh.json`, JSON.stringify(zh, null, 2))
  fs.writeFileSync(`${bizPath}/en.json`, JSON.stringify(en, null, 2));
}

function formatJSON(columns) {
  const zh = {};
  const en = {};
  columns.forEach(column => {
    if (column.zh) {
      zh[column.name] = column.zh;
    }
    if (column.en) {
      en[column.name] = column.en;
    }
  });
  return { zh, en };
}
