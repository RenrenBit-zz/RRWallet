import { BigNumber } from "bignumber.js";

const floatReg = /^([1-9]\d*\.\d*)$|^(0\.\d*[1-9]\d*)$|^(0?\.0+)$|^0$/;
const positiveNumberReg = /^[1-9]\d*$/;

function toFixedBigNumber(num, digit = 8) {
  digit = Math.min(digit, 18);

  if (!num) {
    return new BigNumber(0);
  }

  try {
    num = new BigNumber(num + "").toFixed();
  } catch (error) {
    console.error("转换BigNumber报错");
    return new BigNumber(0);
  }

  let split = num.split(".");

  if (split.length > 2) {
    return new BigNumber(0);
  }

  if (split.length == 2 && split[1].length > digit) {
    split[1] = split[1].substr(0, digit);
    num = split.join(".");
  }

  try {
    return new BigNumber(new BigNumber(num).toFixed(digit));
  } catch (error) {
    console.error("转换BigNumber报错");
    return new BigNumber(0);
  }
}

/**
 *有效数字
 *
 * @param {*} num
 * @param {*} digit
 * @returns
 */
function toSignificanceNumber(num, digit) {
  const bg = toFixedBigNumber(num, 18);
  if (bg.isGreaterThan(1)) {
    return toFixedNumber(bg.toFixed(digit, BigNumber.ROUND_DOWN), 18);
  }
  return toFixedNumber(bg.toPrecision(digit, BigNumber.ROUND_DOWN), 18);
}

function toPriceString(num, fixed = 2, digit = 8, pad = false) {
  const bigNumber = new BigNumber(num + "");
  if (bigNumber.isGreaterThanOrEqualTo(1) || bigNumber.isEqualTo(0)) {
    return toFixedLocaleString(num, fixed, pad);
  }
  return toSignificanceNumber(num, digit);
}
function toFixedNumber(num, digit = 8) {
  return toFixedBigNumber(num, digit).toNumber();
}

/**
 * 非科学计数法
 *
 * @param {*} num
 * @param {number} [digit=8]
 * @returns
 */
function toFixedString(num, digit = 8, pad = false) {
  const bigNumber = toFixedBigNumber(num, digit);
  if (pad) {
    return bigNumber.toFixed(digit);
  } else {
    return bigNumber.toFixed();
  }
}

function toFixedLocaleString(num, digit = 8, pad = false) {
  const str = toFixedString(num, digit, pad).split("");
  const hasNegativeSymbol = str[0] === "-";

  if (hasNegativeSymbol) {
    str.splice(0, 1);
  }

  const pointIndex = str.indexOf(".");
  const seq = pointIndex == -1 ? str.length % 3 : pointIndex % 3;

  for (let i = 0, offset = 0; i < str.length; i++) {
    const chr = str[i];
    if (chr === ".") {
      break;
    }
    if (chr === ",") {
      continue;
    }
    if (i && (i - offset) % 3 === seq) {
      offset++;
      str.splice(i, 0, ",");
      i++;
    }
  }

  if (hasNegativeSymbol) {
    str.unshift("-");
  }

  return str.join("");
}

// 获取小数点后位数
function getDecimalLength(num) {
  num = "" + num;
  if (!num || positiveNumberReg.test(num)) {
    return 0;
  }
  if (!floatReg.test(num)) {
    return 0;
  }
  const [, decimal] = num.split(".");
  return decimal ? decimal.length : 0;
}

function getAcronymNumber(num, digit = 2, position = 10000, word = "万") {
  if (num < position) return toFixedLocaleString(num, digit);
  let _num = new BigNumber(num).dividedBy(position).toNumber();
  return toFixedLocaleString(_num, digit) + word;
}

export {
  toFixedNumber,
  toFixedString,
  toFixedLocaleString,
  toSignificanceNumber,
  toPriceString,
  getDecimalLength,
  getAcronymNumber,
};
