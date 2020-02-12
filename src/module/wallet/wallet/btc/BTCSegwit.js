import { BTCInput, BTCTransaction, BTCCalculateSize, BTCUtxoSelector, BTCOutput } from "./BTCTransaction";
import crypto from "../../../crypto/crypto";
import { pushScript, serializeInput, serializeOutput, int2Hex, varInt, hash256 } from "../util/serialize";
import { BTC_INPUT_TYPE_P2PKH, BTC_INPUT_TYPE_P2SH, NETWORK_ENV_MAINNET } from "../../../../config/const";
import { Buffer } from "buffer";
import { USDTTransaction, OmniOutput } from "./USDTTransaction";
import BigNumber from "bignumber.js";
import { toFixedString } from "../../../../util/NumberUtil";
import _ from "lodash";

const CHECKSUM_HEX_LENGTH = 8;
const BTC_VERSION_PREFIX_SH_MAINNET = "05";
const BTC_VERSION_PREFIX_SH_TESTNET = "C4";
const BITCOIN_SATOSHI = 100000000;
const USDT_TAG_SATOSHI = 546;
const P2PKH_INPUT_SIZE = 150;

const base58 = require("../util/base58");

class BTCSegwitP2SHInput extends BTCInput {
  constructor(obj = {}) {
    super(obj);
    this.redeemScript = BTCSegwitP2SHRedeemScript(this.address.pubkey);
  }
  makeUnlockingScript = () => {
    if (!this.redeemScript) {
      throw new Error("redeemScript is unavailable");
    }

    this.unlockingScript = `${pushScript(this.redeemScript)}`;
    return this.unlockingScript;
  };
  witness = () => {
    return `02${pushScript(this.sigHash)}${pushScript(this.address.pubkey)}`;
  };
}

class BTCSegwitP2SHTransaction extends BTCTransaction {
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

    const hasSegwitInput = !!inputs.find(input => input instanceof BTCSegwitP2SHInput);
    if (hasSegwitInput) {
      return new BTCSegwitP2SHTransaction({
        inputs,
        outputs,
      });
    }
    return new BTCTransaction({
      inputs,
      outputs,
    });
  }
  hashInputs = () => {
    const hashes = this.inputs.map(input =>
      input instanceof BTCSegwitP2SHInput ? this.segwitHash(input) : this.legacyHash(input)
    );
    this.inputs.forEach((input, i) => {
      input.rawSigHash = hashes[i];
    });
  };
  serialized = (sig = false) => {
    const nVersion = int2Hex(this.version, 4);
    const marker = "00";
    const flag = "01";
    const txins = `${varInt(this.inputs.length)}${this.inputs
      .map(txin => serializeInput(txin, (sig && txin.makeUnlockingScript()) || ""))
      .join("")}`;
    const txouts = `${varInt(this.outputs.length)}${this.outputs.map(output => serializeOutput(output)).join("")}`;
    const witness = serializeWitness(this.inputs);
    const nLocktime = int2Hex(this.locktime, 4);
    return `${nVersion}${marker}${flag}${txins}${txouts}${witness}${nLocktime}`;
  };
}

class BTCSegwitP2SHUSDTTransaction extends BTCSegwitP2SHTransaction {
  static from(utxos, from, to, amount, change, feePerByte, USDT) {
    utxos = utxos.slice();
    amount = new BigNumber(amount + "").multipliedBy(BITCOIN_SATOSHI).toFixed(0);

    const source = utxos.find(
      utxo => utxo.address.address === from && new BigNumber(utxo.satoshis).isGreaterThanOrEqualTo(USDT_TAG_SATOSHI)
    );
    utxos = _.xor(utxos, [source]);

    const changeOutput = new BTCOutput({
      address: change,
      satoshis: 0,
    });

    const outputs = [
      changeOutput,
      new OmniOutput({
        propertyId: USDT.propertyId,
        satoshis: amount,
      }),
      new BTCOutput({
        address: to,
        satoshis: USDT_TAG_SATOSHI,
      }),
    ];

    let btcAmount = USDT_TAG_SATOSHI;

    if (new BigNumber(USDT.balance).multipliedBy(BITCOIN_SATOSHI).isGreaterThan(amount) && from !== change) {
      outputs.splice(
        0,
        0,
        new BTCOutput({
          address: from,
          satoshis: USDT_TAG_SATOSHI,
        })
      );
      btcAmount += USDT_TAG_SATOSHI;
    }

    const { inputs, totalInput } = BTCUtxoSelector(utxos, btcAmount, outputs, feePerByte, [source]);
    const fee = new BigNumber(feePerByte).multipliedBy(BTCCalculateSize(inputs, outputs));
    const changeAmount = totalInput.minus(USDT_TAG_SATOSHI).minus(fee);
    if (changeAmount.isGreaterThanOrEqualTo(USDT_TAG_SATOSHI)) {
      changeOutput.satoshis = changeAmount.toFixed(0);
    } else {
      _.remove(outputs, changeOutput);
    }

    const hasSegwitInput = !!inputs.find(input => input instanceof BTCSegwitP2SHInput);
    if (hasSegwitInput) {
      return new BTCSegwitP2SHUSDTTransaction({
        inputs,
        outputs,
      });
    }
    return USDTTransaction({
      inputs,
      outputs,
    });
  }
}
/**
 *
 *
 * @param {Array.<BTCInput>} inputs
 */
function serializeWitness(inputs) {
  const witness = inputs
    .map(input => {
      if (input.type === BTC_INPUT_TYPE_P2PKH) {
        return "00";
      }
      switch (input.type) {
        case BTC_INPUT_TYPE_P2PKH:
          return "00";
        case BTC_INPUT_TYPE_P2SH:
          return input.witness();
      }
    })
    .join("");
  return witness;
}

function BTCSegwitP2SHRedeemScript(pub) {
  const keyHash = crypto.hash160(pub, { asByte: true }).toString();
  const redeemScript = `00${pushScript(keyHash)}`;
  return redeemScript;
}

function BTCSegwitP2SHP2WPKHAddress(pub, network) {
  const redeem = BTCSegwitP2SHRedeemScript(pub);
  const hash160 = crypto.hash160(redeem, { asByte: true }).toString();
  const version = network == NETWORK_ENV_MAINNET ? BTC_VERSION_PREFIX_SH_MAINNET : BTC_VERSION_PREFIX_SH_TESTNET;
  const checksum = hash256(`${version}${hash160}`).substr(0, CHECKSUM_HEX_LENGTH);
  const address = base58.encode(new Buffer(`${version}${hash160}${checksum}`, "hex")).toString("hex");
  return address;
}
export {
  BTCSegwitP2SHInput,
  BTCSegwitP2SHTransaction,
  BTCSegwitP2SHUSDTTransaction,
  BTCSegwitP2SHRedeemScript,
  BTCSegwitP2SHP2WPKHAddress,
};
