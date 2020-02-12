import {
  BTC_ADDRESS_TYPE_PKH,
  BTC_ADDRESS_TYPE_SH,
  BTC_INPUT_TYPE_P2PKH,
  BTC_INPUT_TYPE_P2SH,
} from "../../../../config/const";
import BigNumber from "bignumber.js";
import opcode from "./opcode";
import crypto from "../../../crypto/crypto";
import _ from "lodash";
import { BTCOutput, BTCInput } from "../btc/BTCTransaction";
const base58 = require("./base58");

/**
 *
 *
 * @param {BTCInput} input
 * @returns
 */
function serializeOutpoint(input) {
  const txid = reverseHex(input.txid);
  const vout = int2Hex(input.vout, 4);
  return `${txid}${vout}`;
}

/**
 *
 *
 * @param {BTCInput} input
 * @param {string} script
 */
function serializeInput(input, script = "") {
  const outpoint = serializeOutpoint(input);
  const sequence = int2Hex(input.sequence, 4);
  return `${outpoint}${varInt(script.length / 2)}${script}${sequence}`;
}

/**
 *
 *
 * @param {BTCOutput} output
 */
function serializeOutput(output) {
  const satoshis = int2Hex(output.satoshis, 8);
  const script =
    output.scriptPubKey && output.scriptPubKey.length > 0 ? output.scriptPubKey : getScriptPubKey(output.address);
  return `${satoshis}${varInt(script.length / 2)}${script}`;
}

function getScriptPubKey(addr) {
  if (_.isNil(addr)) {
    return "";
    // throw new Error('getScriptPubKey invaild param')
  }
  const addrType = addressType(addr);
  const hash160 = base58
    .decode(addr)
    .toString("hex")
    .substr(2, 40);
  switch (addrType) {
    case BTC_ADDRESS_TYPE_PKH:
      return `${opcode.OP_DUP}${opcode.OP_HASH160}${pushScript(hash160)}${opcode.OP_EQUALVERIFY}${opcode.OP_CHECKSIG}`;
    case BTC_ADDRESS_TYPE_SH:
      return `${opcode.OP_HASH160}${pushScript(hash160)}${opcode.OP_EQUAL}`;
  }
}

function omniPayload(propertyID, amount) {
  const omniPrefix = "6f6d6e69";
  propertyID = reverseHex(int2Hex(propertyID, 8));
  amount = reverseHex(int2Hex(amount, 8));
  return `${opcode.OP_RETURN}${pushScript(`${omniPrefix}${propertyID}${amount}`)}`;
}

function decodeOmniPlayload(playload) {
  if (playload.length != 44) {
    return {};
  }

  const amount = new BigNumber(playload.substr(28, 16), 16).toFixed();
  return {
    amount,
  };
}
/**
 *
 * @param {BTCInput} input
 */
function getScriptCode(input) {
  let scriptCode;
  switch (input.type) {
    case BTC_INPUT_TYPE_P2PKH:
      scriptCode = getScriptPubKey(input.address.address);
      break;
    case BTC_INPUT_TYPE_P2SH:
      scriptCode = `${opcode.OP_DUP}${opcode.OP_HASH160}${input.redeemScript.substr(2)}${opcode.OP_EQUALVERIFY}${
        opcode.OP_CHECKSIG
      }`;
      break;
    default:
  }
  return pushScript(scriptCode);
}
//https://en.bitcoin.it/wiki/Protocol_specification#Variable_length_integer
function varInt(int) {
  if (_.isNil(int)) {
    throw new Error("varInt invaild param");
  }
  const bn = new BigNumber(int);
  if (bn.isLessThan(0xfd)) {
    return int2Hex(bn);
  } else if (bn.isLessThan(0xffff)) {
    return `fd${int2Hex(bn, 2)}`;
  } else if (bn.isLessThan(0xffffffff)) {
    return `fe${int2Hex(bn, 4)}`;
  } else {
    return `ff${int2Hex(bn, 8)}`;
  }
}

function varInt2Int(varInt) {
  const firstBit = varInt.substr(0, 2).toLowerCase();
  const hasGrowth = firstBit === "fd" || firstBit === "fe" || firstBit === "ff";
  if (hasGrowth) {
    varInt = varInt.substring(2);
  }
  return parseInt(reverseHex(varInt), 16);
}

function extractVarInt(hex) {
  const firstBit = hex.substr(0, 2).toLowerCase();
  switch (firstBit) {
    case "fd":
      return `fd${hex.substr(0, 2 * 2)}`;
    case "fe":
      return `fe${hex.substr(0, 4 * 2)}`;
    case "ff":
      return `ff${hex.substr(0, 8 * 2)}`;
    default:
      return firstBit;
  }
}

function addressType(addr) {
  const char = addr.charAt(0);
  switch (char) {
    case "1":
    case "m":
    case "n":
      return BTC_ADDRESS_TYPE_PKH;
    case "3":
    case "2":
      return BTC_ADDRESS_TYPE_SH;
    default:
      throw new Error("unknow address type");
  }
}

function pushScript(hex) {
  return `${varInt(hex.length / 2)}${hex}`;
}

function OP_PUSH(i) {
  const bn = new BigNumber(i);
  if (bn.isLessThan(0x4c)) {
    return `${int2Hex(i)}`;
  } else if (bn.isLessThan(0xff)) {
    return `4c${int2Hex(i)}`;
  } else if (bn.isLessThan(0xffff)) {
    return `4d${int2Hex(i, 2)}`;
  } else {
    return `4e${int2Hex(i, 4)}`;
  }
}

function int2Hex(int, length) {
  if (_.isNil(int)) {
    throw new Error("int2Hex invaild param");
  }
  let hex = new BigNumber(int).toString(16);
  if (hex.length % 2 != 0) {
    hex = _.padStart(hex, hex.length + 1, "0");
  }
  if (!length) {
    length = parseInt((hex.length + (hex.length % 2)) / 2);
  }
  return reverseHex(_.padStart(hex, length * 2, "0"));
}

function hex2Int(hex) {
  hex = reverseHex(hex);
  return parseInt(hex, 16);
}

function reverseHex(hex) {
  if (_.isNil(hex)) {
    throw new Error("reverseHex invaild param");
  }
  if (hex.length % 2 != 0) {
    throw new Error("");
  }

  return hex
    .match(/[\da-f]{2}/gi)
    .map(hex => parseInt(hex, 16))
    .reverse()
    .map(uint8 => _.padStart(uint8.toString("16"), 2, "0"))
    .join("");
}

function hash256(hex) {
  return crypto.sha256(crypto.sha256(crypto.toWordsArray(hex))).toString();
}

function hash160(hex) {
  return crypto.hash160(crypto.toWordsArray(hex)).toString();
}

export {
  serializeOutpoint,
  serializeInput,
  serializeOutput,
  getScriptCode,
  omniPayload,
  decodeOmniPlayload,
  varInt,
  varInt2Int,
  extractVarInt,
  int2Hex,
  hex2Int,
  reverseHex,
  hash256,
  getScriptPubKey,
  hash160,
  pushScript,
  addressType,
};
