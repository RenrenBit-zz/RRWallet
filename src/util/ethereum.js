import { BigNumber } from "bignumber.js";
import { isNumber, isNil, isArray, padStart } from "lodash";
import crypto from "../module/crypto/crypto";
import ETHRPCProvider from "../module/wallet/wallet/ETHRPCProvider";
import network from "../module/common/network";
import { NETWORK_ENV_TESTNET } from "../config/const";
import _ from "lodash";
var unitMap = {
  noether: "0",
  wei: "1",
  kwei: "1000",
  Kwei: "1000",
  babbage: "1000",
  femtoether: "1000",
  mwei: "1000000",
  Mwei: "1000000",
  lovelace: "1000000",
  picoether: "1000000",
  gwei: "1000000000",
  Gwei: "1000000000",
  shannon: "1000000000",
  nanoether: "1000000000",
  nano: "1000000000",
  szabo: "1000000000000",
  microether: "1000000000000",
  micro: "1000000000000",
  finney: "1000000000000000",
  milliether: "1000000000000000",
  milli: "1000000000000000",
  ether: "1000000000000000000",
  kether: "1000000000000000000000",
  grand: "1000000000000000000000",
  mether: "1000000000000000000000000",
  gether: "1000000000000000000000000000",
  tether: "1000000000000000000000000000000",
};

/**
 * Takes a number of a unit and converts it to wei.
 *
 * Possible units are:
 *   SI Short   SI Full        Effigy       Other
 * - kwei       femtoether     babbage
 * - mwei       picoether      lovelace
 * - gwei       nanoether      shannon      nano
 * - --         microether     szabo        micro
 * - --         milliether     finney       milli
 * - ether      --             --
 * - kether                    --           grand
 * - mether
 * - gether
 * - tether
 *
 * @method toWei
 * @param {Number|String|BigNumber} number can be a number, number string or a HEX of a decimal
 * @param {String} unit the unit to convert from, default ether
 * @param {Number} fixed decimal places
 * @return {String|Object} When given a BigNumber object it returns one as well, otherwise a number
 */
var toWei = function(number, unit = "ether", fixed = 8) {
  var returnValue = toBigNumber(
    toBigNumber(number)
      .times(getValueOfUnit(unit))
      .toFixed(fixed, 0)
  );

  return isBigNumber(number) ? returnValue : returnValue.toString(10);
};

/**
 * Takes a number of a unit and converts it to ether.
 *
 * Possible units are:
 *   SI Short   SI Full        Effigy       Other
 * - kwei       femtoether     babbage
 * - mwei       picoether      lovelace
 * - gwei       nanoether      shannon      nano
 * - --         microether     szabo        micro
 * - --         milliether     finney       milli
 * - ether      --             --
 * - kether                    --           grand
 * - mether
 * - gether
 * - tether
 *
 * @method toEther
 * @param {Number|String|BigNumber} number can be a number, number string or a HEX of a decimal
 * @param {String} unit the unit to convert from, default ether
 * @param {Number} fixed decimal places
 * @return {String|Object} When given a BigNumber object it returns one as well, otherwise a number
 */
var toEther = function(number, unit = "ether", fixed = 8) {
  var returnValue = toBigNumber(
    toBigNumber(toWei(number, unit))
      .div(getValueOfUnit("ether"))
      .toFixed(fixed, 0)
  );

  return isBigNumber(number) ? returnValue : returnValue.toString(10);
};
/**
 * Returns true if object is BigNumber, otherwise false
 *
 * @method isBigNumber
 * @param {Object}
 * @return {Boolean}
 */
var isBigNumber = function(object) {
  return object instanceof BigNumber || (object && object.constructor && object.constructor.name === "BigNumber");
};

/**
 * Takes an input and transforms it into an bignumber
 *
 * @method toBigNumber
 * @param {Number|String|BigNumber} a number, string, HEX string or BigNumber
 * @return {BigNumber} BigNumber
 */
var toBigNumber = function(number) {
  /*jshint maxcomplexity:5 */
  number = number || 0;
  if (isBigNumber(number)) return number;

  if (isString(number) && (number.indexOf("0x") === 0 || number.indexOf("-0x") === 0)) {
    return new BigNumber(number.replace("0x", ""), 16);
  }

  return new BigNumber(number.toString(10), 10);
};

/**
 * Returns true if object is string, otherwise false
 *
 * @method isString
 * @param {Object}
 * @return {Boolean}
 */
var isString = function(object) {
  return typeof object === "string" || (object && object.constructor && object.constructor.name === "String");
};

/**
 * Returns value of unit in Wei
 *
 * @method getValueOfUnit
 * @param {String} unit the unit to convert to, default ether
 * @returns {BigNumber} value of the unit (in Wei)
 * @throws error if the unit is not correct:w
 */
var getValueOfUnit = function(unit) {
  unit = unit ? unit.toLowerCase() : "ether";
  var unitValue = unitMap[unit];
  if (unitValue === undefined) {
    throw new Error(
      "This unit doesn't exists, please use the one of the following units" + JSON.stringify(unitMap, null, 2)
    );
  }
  return new BigNumber(unitValue, 10);
};

const formatInput = input => {
  if (isNil(input)) {
    throw new Error("invaild input");
  } else if (isString(input)) {
    return input.startsWith("0x") ? input.substring(2) : input;
  } else if (isNumber(input)) {
    return input.toString(16);
  }
};
class ethereum {
  encodeContractABI = (methodID = "", args = []) => {
    methodID = formatInput(methodID);
    if (methodID.length % 2 != 0) {
      throw new Error('invaild methodID. It must comply with "methodID % 2 = 0"');
    }

    let offset = args.length;
    const encodeings = [];
    args.forEach((arg, i) => {
      if (isString(arg)) {
        encodeings[i] = formatInput(arg);
      } else if (isArray(arg)) {
        encodeings[i] = formatInput(offset * 32);
        encodeings[offset] = formatInput(arg.length);
        offset++;
        arg.forEach((item, i) => {
          encodeings[offset + i] = formatInput(item);
        });
        offset += arg.length;
      }
    });

    const result = encodeings.reduce((str, el) => str + padStart(el, 32 * 2, "0"), `0x${methodID}`);
    return result;
  };
  toDecimalsWei = (decimals, amount, unit) => {
    amount = new BigNumber(amount);
    const scale = new BigNumber(10).pow(18 - decimals);
    return toWei(amount.div(scale), unit);
  };
  syncNonce = async (address, expect, retryCount) => {
    return new Promise(async (resolve, reject) => {
      let latest;
      for (let i = 0; i < retryCount; i++) {
        try {
          let sleepTime = 8000;
          await sleep(sleepTime);

          latest = await ETHRPCProvider.ethGetTransactionCount(address, "pending");

          if (expect <= latest) {
            resolve(latest);
            break;
          }
        } catch (error) {}
      }
      if (expect > latest) {
        reject(new Error("与链上nonce同步失败, 请稍后再试"));
      }
    });
  };
  syncTxReceipt = async txHash => {
    if (!_.isString(txHash) || txHash.length <= 0) {
      throw new Error("交易Hash为空");
    }
    const retryCount = 20;
    for (let i = 0; i < retryCount; i++) {
      const result = await ETHRPCProvider.ethGetTransactionReceipt(txHash);
      if (!_.isPlainObject(result)) {
        await sleep(10 * 1000);
        continue;
      }
      return result;
    }
    throw new Error("获取交易收据失败, 本次交易结果不确定, 请稍后从区块链浏览器上确认结果");
  };
  allowance = async (contract, owner, spender) => {
    const allowance = await ETHRPCProvider.ethCall(
      {
        to: contract,
        data: this.encodeContractABI(this.allowanceMethodID, [owner, spender]),
      },
      "pending"
    );
    return allowance;
  };
  get approveMethodID() {
    return `0x${crypto
      .sha3("approve(address,uint256)")
      .toString()
      .slice(0, 8)}`;
  }
  get transferMethodID() {
    return `0x${crypto
      .sha3("transfer(address,uint256)")
      .toString()
      .slice(0, 8)}`;
  }
  get ERC20BatchTransferMethodID() {
    return `0x${crypto
      .sha3("batchTransfer(address,address[],uint256[])")
      .toString()
      .slice(0, 8)}`;
  }
  get ETHBatchTransferMethodID() {
    return `0x${crypto
      .sha3("batchTransfer(address[],uint256[])")
      .toString()
      .slice(0, 8)}`;
  }
  get allowanceMethodID() {
    return `0x${crypto
      .sha3("allowance(address,address)")
      .toString()
      .slice(0, 8)}`;
  }
  get ERC20BatchTransferContract() {
    return network.env === NETWORK_ENV_TESTNET
      ? "0x0fAc33da48ba5Df49b413CeDA4dA01f2280565e3"
      : "0x13C0A09f78CA908d75284547314aece964901148";
  }
  get ETHBatchTransferContract() {
    return network.env === NETWORK_ENV_TESTNET
      ? "0xD2e37478654572ab55674E1c9237c569DEdE7e70"
      : "0xf57ac5cd942EBBD35B7B1DB87c7Da76097e01a68";
  }
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

ethereum.prototype.toWei = toWei;
ethereum.prototype.toEther = toEther;
export default new ethereum();
export { unitMap };
