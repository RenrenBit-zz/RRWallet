const xlsx = require("xlsx");
const fs = require("fs");

const TRANSLATIONS_PATH = "../translations";
const EXCEL_PATH = "../excel/renrenbit.xlsx";

const bizs = fs
  .readdirSync(TRANSLATIONS_PATH)
  .filter(name => fs.statSync(`${TRANSLATIONS_PATH}/${name}`).isDirectory());

const origWb = xlsx.readFile(EXCEL_PATH);
const workbook = xlsx.utils.book_new();

bizs.forEach(biz => {
  const origSheet = origWb.Sheets[biz];
  // const { en } = format(xlsx.utils.sheet_to_json(origSheet))
  const en = require(`${TRANSLATIONS_PATH}/${biz}/en.json`);
  const zh = require(`${TRANSLATIONS_PATH}/${biz}/zh.json`);
  const json = combine(zh, en);
  const worksheet = xlsx.utils.json_to_sheet(json, {
    header: ["name", "zh", "en"],
  });
  xlsx.utils.book_append_sheet(workbook, worksheet, biz);
});

xlsx.writeFile(workbook, EXCEL_PATH);

function combine(zh, en) {
  const format = [];
  for (const key in zh) {
    const column = {
      name: key,
      zh: zh[key],
    };
    if (en[key]) {
      column["en"] = en[key];
    }
    format.push(column);
  }
  return format;
}

function format(columns) {
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
