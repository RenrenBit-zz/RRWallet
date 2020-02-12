const fs = require("fs");

if (process.argv.length != 4) {
  console.log("参数错误");
  process.exit();
}

const source = process.argv[2];
const target = process.argv[3];
const biz = source.split("/").slice(-2)[0];

const json = JSON.parse(fs.readFileSync(source).toString());
const text = fs.readFileSync(target).toString();

var result = text;
for (const key in json) {
  const vaule = json[key];
  result = result.replace(`>${vaule}<`, `>{i18n.t('${biz}-${key}')}<`);
}

fs.writeFileSync(`${target}.bak`, text);
fs.writeFileSync(`${target}`, result);
