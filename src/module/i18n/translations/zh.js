const common = require("./common/zh.json");
const mine = require("./mine/zh.json");
const qunfabao = require("./qunfabao/zh.json");
const wallet = require("./wallet/zh.json");

const _ = require("lodash");

const bizs = {
  common,
  mine,
  qunfabao,
  wallet,
};

const zh = Object.assign(
  {},
  ..._.reduce(
    bizs,
    (r, value, key) => {
      const biz = _.reduce(
        value,
        (subResult, subValue, subKey) => {
          subResult[`${key}-${subKey}`] = subValue;
          return subResult;
        },
        {}
      );
      r.push(biz);
      return r;
    },
    []
  )
);

module.exports = zh;
