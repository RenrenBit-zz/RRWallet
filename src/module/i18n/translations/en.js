const common = require("./common/en.json");
const mine = require("./mine/en.json");
const qunfabao = require("./qunfabao/en.json");
const wallet = require("./wallet/en.json");

const _ = require("lodash");

const bizs = {
  common,
  mine,
  qunfabao,
  wallet,
};

const en = Object.assign(
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

module.exports = en;
