import {
  BTC_ADDRESS_TYPE_PKH,
  BTC_ADDRESS_TYPE_SH,
  BTC_INPUT_TYPE_P2PKH,
  BTC_INPUT_TYPE_P2SH,
  BTC_SIGHASH_ALL,
  BTC_SIGHASH_FORKID,
  NETWORK_ENV_MAINNET,
} from "../../../../config/const";
import { Buffer } from "buffer";
import opcode from "../util/opcode";
import { BIP44Address } from "../Wallet";
import _ from "lodash";
import {
  serializeOutpoint,
  serializeInput,
  serializeOutput,
  getScriptCode,
  varInt,
  int2Hex,
  hash256,
  getScriptPubKey,
  hex2Int,
  extractVarInt,
  varInt2Int,
  reverseHex,
  pushScript,
} from "../util/serialize";
import BigNumber from "bignumber.js";
import i18n from "../../../i18n/i18n";
import { toFixedString } from "../../../../util/NumberUtil";

const base58 = require("../util/base58");

const BITCOIN_SATOSHI = 100000000;
const USDT_TAG_SATOSHI = 546;
const P2PKH_INPUT_SIZE = 150;
const P2PKH_OUTPUT_SIZE = 40;
const TXHASH_HEX_LENGTH = 64;
const VOUT_HEX_LENGTH = 8;
const LOCKTIME_HEX_LENGTH = 8;
const SEQUENCE_HEX_LENGTH = 8;
const SATOSHIS_HEX_LENGTH = 16;
const HASH160_HEX_LENGTH = 40;
const CHECKSUM_HEX_LENGTH = 8;
const BTC_VERSION_PREFIX_PK_MAINNET = "00";
const BTC_VERSION_PREFIX_PK_TESTNET = "6F";
const BTC_VERSION_PREFIX_SH_MAINNET = "05";
const BTC_VERSION_PREFIX_SH_TESTNET = "C4";

class BTCInput {
  /**
   *
   * @type {BIP44Address}
   * @memberof BTCInput
   */
  address;

  /**
   *
   * @type {String}
   * @memberof BTCInput
   */
  txid;

  /**
   *
   * @type {String}
   * @memberof BTCInput
   */
  vout;

  /**
   *
   * @type {String}
   * @memberof BTCInput
   */
  scriptPubKey;

  /**
   *
   * @type {String}
   * @memberof BTCInput
   */
  redeemScript;
  /**
   *
   * @type {String}
   * @memberof BTCInput
   */
  satoshis;

  /**
   *
   * @type {String}
   * @memberof BTCInput
   */
  confirmations;

  /**
   * 未签名的数据
   * @type {String}
   * @memberof BTCInput
   */
  rawSigHash;

  /**
   * 已签名的数据
   * @type {String}
   * @memberof BTCInput
   */
  sigHash;
  /**
   *
   * @type {number}
   * @memberof BTCInput
   */
  sequence = 0xffffffff;

  /**
   *
   * @type {BTC_INPUT_TYPE_P2PKH|BTC_INPUT_TYPE_P2SH}
   * @memberof BTCInput
   */
  type;

  /**
   *
   * @type {BTC_SIGHASH_ALL|BTC_SIGHASH_FORKID}
   * @memberof BTCInput
   */
  sigHashType = BTC_SIGHASH_ALL;

  /**
   *
   * @type {string}
   * @memberof BTCInput
   */
  unlockingScript;

  get size() {
    return P2PKH_INPUT_SIZE;
  }
  constructor({
    address,
    path,
    pubkey,
    txid,
    vout,
    amount,
    scriptPubKey,
    redeemScript,
    confirmations = 0,
    sequence = 0xffffffff,
  } = {}) {
    if (address && path && pubkey) {
      this.address = new BIP44Address({ address, path, pubkey });
    } else if (address instanceof BIP44Address) {
      this.address = address;
    } else {
      throw new Error("invaild", address, path, pubkey);
    }
    this.txid = txid + "";
    this.vout = vout + "";
    this.amount = amount + "";
    this.satoshis = new BigNumber(this.amount).multipliedBy(BITCOIN_SATOSHI).toFixed();
    this.confirmations = confirmations + "";
    this.scriptPubKey = scriptPubKey && scriptPubKey.length > 0 ? scriptPubKey : getScriptPubKey(this.address.address);
    this.sequence = sequence;
    if (this.scriptPubKey.startsWith(`${opcode.OP_DUP}${opcode.OP_HASH160}`)) {
      this.type = BTC_INPUT_TYPE_P2PKH;
      this.redeemScript = this.scriptPubKey;
    } else if (this.scriptPubKey.startsWith(`${opcode.OP_HASH160}`)) {
      this.type = BTC_INPUT_TYPE_P2SH;
      this.redeemScript = redeemScript;
    }
  }

  makeUnlockingScript = () => {
    if (!this.sigHash || this.sigHash.length <= 0) {
      throw new Error("sigHash is unavailable");
    }
    this.unlockingScript = `${pushScript(this.sigHash)}${pushScript(this.address.pubkey)}`;
    return this.unlockingScript;
  };

  toJSON() {
    return {
      address: this.address.address,
      path: this.address.path,
      pubkey: this.address.pubkey,
      txid: this.txid,
      vout: this.vout,
      scriptPubKey: this.scriptPubKey,
      amount: this.amount,
      satoshis: this.satoshis,
      height: this.height,
      confirmations: this.confirmations,
      rawSigHash: this.rawSigHash,
      sigHashType: this.sigHashType,
    };
  }
}

class BTCOutput {
  address;
  satoshis;
  scriptPubKey;
  get size() {
    return Math.ceil(Math.ceil(SATOSHIS_HEX_LENGTH / 2) + Math.ceil(this.scriptPubKey.length / 2) + 1);
  }
  constructor({ address, satoshis, scriptPubKey, network }) {
    this.address = address;
    this.satoshis = satoshis;
    this.scriptPubKey = scriptPubKey;
    if (this.scriptPubKey) {
      this.address = this.generateAddress(network);
    } else if (this.address) {
      this.scriptPubKey = getScriptPubKey(this.address);
    }
  }
  generateAddress = network => {
    let hash160;
    let version;
    if (this.scriptPubKey.startsWith(`${opcode.OP_DUP}${opcode.OP_HASH160}`)) {
      hash160 = this.scriptPubKey.substr(`${opcode.OP_DUP}${opcode.OP_HASH160}`.length + 2, HASH160_HEX_LENGTH);
      version = network == NETWORK_ENV_MAINNET ? BTC_VERSION_PREFIX_PK_MAINNET : BTC_VERSION_PREFIX_PK_TESTNET;
    } else if (this.scriptPubKey.startsWith(`${opcode.OP_HASH160}`)) {
      hash160 = this.scriptPubKey.substr(`${opcode.OP_HASH160}`.length + 2, HASH160_HEX_LENGTH);
      version = network == NETWORK_ENV_MAINNET ? BTC_VERSION_PREFIX_SH_MAINNET : BTC_VERSION_PREFIX_SH_TESTNET;
    } else {
      return "";
    }
    const checksum = hash256(`${version}${hash160}`).substr(0, CHECKSUM_HEX_LENGTH);
    const address = base58.encode(new Buffer(`${version}${hash160}${checksum}`, "hex")).toString("hex");
    return address;
  };
}
class BTCTransaction {
  version = 1;
  locktime = 0;

  /**
   *
   * @type {Array.<BTCInput>}
   * @memberof BTCTransaction
   */
  inputs = [];

  /**
   *
   * @type {Array.<BTCOutput>}
   * @memberof BTCTransaction
   */
  outputs = [];

  get hash() {
    return reverseHex(hash256(this.serialized(true)));
  }

  get fee() {
    const totalInput = this.inputs.reduce((res, input) => res.plus(input.satoshis), new BigNumber(0));
    const totalOutput = this.outputs.reduce((res, output) => res.plus(output.satoshis), new BigNumber(0));

    return toFixedString(BigNumber.max(totalInput.minus(totalOutput), 0));
  }

  constructor(obj = {}) {
    this.inputs = obj.inputs || [];
    this.outputs = obj.outputs || [];
  }

  static from(utxos, to, amount, change, feePerByte, showHand) {
    utxos = utxos.slice();

    amount = new BigNumber(amount + "").multipliedBy(BITCOIN_SATOSHI).toFixed(0);

    const inputs = [];

    const outputs = [];

    const destOutput = new BTCOutput({
      address: to,
      satoshis: amount + "",
    });

    outputs.push(destOutput);

    if (!showHand) {
      const changeOutput = new BTCOutput({
        address: change,
        satoshis: 0,
      });
      // outputs.push(changeOutput)

      const result = BTCUtxoSelector(utxos, amount, outputs, feePerByte);
      const totalInput = result.totalInput;
      inputs.length = 0;
      inputs.push(...(result.inputs || []));

      const fee = new BigNumber(feePerByte).multipliedBy(BTCCalculateSize(inputs, outputs));
      const changeOutputFee = new BigNumber(changeOutput.size).multipliedBy(feePerByte); //change output 消耗的手续费
      const changeAmount = totalInput
        .minus(amount)
        .minus(fee)
        .minus(changeOutputFee); //假设有找零的情况下, 若找零金额若大于 TAG 则加入找零
      if (changeAmount.isGreaterThanOrEqualTo(USDT_TAG_SATOSHI)) {
        changeOutput.satoshis = changeAmount.toFixed(0);
        outputs.push(changeOutput);
      }
    } else {
      utxos.forEach(utxo => inputs.push(utxo));
      const fee = new BigNumber(BTCCalculateSize(inputs, outputs)).multipliedBy(feePerByte);
      const totalInput = inputs.reduce((res, input) => res.plus(input.satoshis), new BigNumber(0));
      destOutput.satoshis = toFixedString(totalInput.minus(fee));
    }
    return new BTCTransaction({ inputs, outputs });
  }

  static estimateFee(utxos, to, amount, change, feePerByte, showHand) {
    try {
      return this.from(utxos, to, amount, change, feePerByte, showHand).fee;
    } catch (error) {
      if (utxos.length == 0) {
        return new BigNumber(250).multipliedBy(feePerByte);
      }
      const fakeUtxos = utxos.slice();
      const utxo = _.cloneDeep(fakeUtxos[0]);
      utxo.amount = "1000";
      fakeUtxos.push(new BTCInput(utxo));
      return this.from(fakeUtxos, to, amount, change, feePerByte, showHand).fee;
    }
  }
  hashInputs = () => {
    const hashes = this.inputs.map(input => this.legacyHash(input));
    this.inputs.forEach((input, i) => {
      input.rawSigHash = hashes[i];
    });
  };

  signInputs = async signer => {
    this.hashInputs();
    for (const input of this.inputs) {
      input.sigHash = await signer(input.rawSigHash, input.sigHashType, input.address.path);
    }
  };

  legacyHash = input => {
    const nVersion = int2Hex(this.version, 4);
    const txins = `${varInt(this.inputs.length)}${this.inputs
      .map(txin => serializeInput(txin, txin == input ? txin.redeemScript : ""))
      .join("")}`;
    const txouts = `${varInt(this.outputs.length)}${this.outputs.map(output => serializeOutput(output)).join("")}`;
    const nLocktime = int2Hex(this.locktime, 4);
    const nHashType = int2Hex(input.sigHashType, 4);
    const payload = `${nVersion}${txins}${txouts}${nLocktime}${nHashType}`;

    return hash256(payload);
  };

  segwitHash = input => {
    const nVersion = int2Hex(this.version, 4);
    const hashPrevouts = hash256(this.inputs.map(input => serializeOutpoint(input)).join(""));
    const hashSequence = hash256(this.inputs.map(input => int2Hex(input.sequence, 4)).join(""));
    const outpoint = serializeOutpoint(input);
    const scriptCode = getScriptCode(input);
    const amount = int2Hex(input.satoshis, 8);
    const nSequence = int2Hex(input.sequence, 4);
    const hashOutputs = hash256(this.outputs.map(output => serializeOutput(output)).join(""));
    const nLocktime = int2Hex(this.locktime, 4);
    const nHashType = int2Hex(input.sigHashType, 4);
    const payload = `${nVersion}${hashPrevouts}${hashSequence}${outpoint}${scriptCode}${amount}${nSequence}${hashOutputs}${nLocktime}${nHashType}`;

    return hash256(payload);
  };

  serialized = (sig = false) => {
    const nVersion = int2Hex(this.version, 4);
    const txins = `${varInt(this.inputs.length)}${this.inputs
      .map(txin => serializeInput(txin, (sig && txin.makeUnlockingScript()) || ""))
      .join("")}`;
    const txouts = `${varInt(this.outputs.length)}${this.outputs.map(output => serializeOutput(output)).join("")}`;
    const nLocktime = int2Hex(this.locktime, 4);
    return `${nVersion}${txins}${txouts}${nLocktime}`;
  };

  /**
    @callback InputGenerator
    @param {string} txid
    @param {BTCOutput} output
    @param {number} vout
    @returns {BTCInput}
  */

  /**
   *
   * @param {InputGenerator} generator
   * @memberof BTCTransaction
   */
  outputs2utxos = async generator => {
    const txid = this.hash;
    const utxos = [];
    for (let i = 0; i < this.outputs.length; i++) {
      const output = this.outputs[i];

      if (new BigNumber(output.satoshis).isLessThanOrEqualTo(0)) {
        continue;
      }

      const utxo = await generator(txid, output, i);
      if (utxo) {
        utxos.push(utxo);
      }
    }

    return utxos;
  };
  static deserialized = (hex = "", inputs, network = NETWORK_ENV_MAINNET) => {
    const tx = new BTCTransaction();

    tx.version = hex2Int(hex.substr(0, 8));
    hex = hex.substr(8);

    const txInsCountVarInt = extractVarInt(hex);
    const txInsCount = varInt2Int(txInsCountVarInt);
    hex = hex.substr(txInsCountVarInt.length);

    for (let i = 0; i < txInsCount; i++) {
      const txid = reverseHex(hex.substr(0, TXHASH_HEX_LENGTH));
      const vout = hex2Int(hex.substr(TXHASH_HEX_LENGTH, VOUT_HEX_LENGTH));
      hex = hex.substr(TXHASH_HEX_LENGTH + VOUT_HEX_LENGTH);

      const scriptBytesLengthVarInt = extractVarInt(hex);
      const scriptBytesLength = varInt2Int(scriptBytesLengthVarInt);
      hex = hex.substr(scriptBytesLengthVarInt.length);

      const redeemScript = hex.substr(0, scriptBytesLength * 2);
      hex = hex.substr(redeemScript.length);

      const sequence = hex2Int(hex.substr(0, SEQUENCE_HEX_LENGTH));
      hex = hex.substr(SEQUENCE_HEX_LENGTH);

      const input = inputs[i];
      const address = new BIP44Address(input);

      tx.inputs.push(new BTCInput({ address, txid, vout, redeemScript, sequence }));
    }

    const txOutsCountVarInt = extractVarInt(hex);
    const txOutsCount = varInt2Int(txOutsCountVarInt);
    hex = hex.substr(txOutsCountVarInt.length);

    for (let i = 0; i < txOutsCount; i++) {
      const satoshis = hex2Int(hex.substr(0, SATOSHIS_HEX_LENGTH));
      hex = hex.substr(SATOSHIS_HEX_LENGTH);

      const scriptPubKeyBytesLengthVarInt = extractVarInt(hex);
      const scriptPubKeyBytesLength = varInt2Int(scriptPubKeyBytesLengthVarInt);
      hex = hex.substr(scriptPubKeyBytesLengthVarInt.length);

      const scriptPubKey = hex.substr(0, scriptPubKeyBytesLength * 2);
      hex = hex.substr(scriptPubKey.length);

      tx.outputs.push(new BTCOutput({ satoshis, scriptPubKey, network }));
    }

    tx.locktime = hex2Int(hex.substr(0, LOCKTIME_HEX_LENGTH));

    return tx;
  };
}

function BTCUtxoSelector(utxos, amount, outputs, feePerByte, inputs = []) {
  inputs = inputs.slice();

  if (utxos.length === 0 && inputs.length === 0) {
    throw new Error(i18n.t("wallet-send-balance-notenough"));
  }

  let totalInput = inputs.reduce((res, input) => res.plus(input.satoshis), new BigNumber(0));
  let fee = new BigNumber(BTCCalculateSize(inputs, outputs)).multipliedBy(feePerByte);

  if (utxos.length === 0 && totalInput.minus(fee).isLessThan(amount)) {
    throw new Error(i18n.t("wallet-send-balance-notenough"));
  }

  for (let i = 0; i < utxos.length; i++) {
    const utxo = utxos[i];
    inputs.push(utxo);
    totalInput = totalInput.plus(utxo.satoshis);
    if (totalInput.isGreaterThan(amount)) {
      fee = new BigNumber(BTCCalculateSize(inputs, outputs)).multipliedBy(feePerByte);
      if (totalInput.minus(fee).isGreaterThanOrEqualTo(amount)) {
        break;
      }
    }
    if (i == utxos.length - 1) {
      throw new Error(i18n.t("wallet-send-balance-notenough"));
    }
  }
  return { inputs, totalInput };
}

function BTCTransactionBuilder({ utxos, to, amount, change, feePerByte, showHand }) {}
function USDTTransactionBuilder(utxos, feePerByte) {}

/**
 *
 *
 * @param {Array<BTCInput>} inputs
 * @param {Array<BTCOutput>} outputs
 */
function BTCCalculateSize(inputs, outputs) {
  const inputsSize = inputs.reduce((res, input) => res + input.size, 0);
  const outputsSize = outputs.reduce((res, output) => res + output.size, 0);
  if (isNaN(inputsSize) || isNaN(outputsSize)) {
    throw new Error(i18n.t("wallet-tx-size-error"));
  }
  return Math.ceil(10 + inputsSize + outputsSize);
}

export {
  BITCOIN_SATOSHI,
  USDT_TAG_SATOSHI,
  BTCTransaction,
  BTCInput,
  BTCOutput,
  BTCUtxoSelector,
  BTCCalculateSize,
  USDTTransactionBuilder,
  BTCTransactionBuilder,
};
