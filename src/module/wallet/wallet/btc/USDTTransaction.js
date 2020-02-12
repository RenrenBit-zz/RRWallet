import {
  BTCTransaction,
  BTCInput,
  BITCOIN_SATOSHI,
  USDT_TAG_SATOSHI,
  BTCUtxoSelector,
  BTCOutput,
  BTCCalculateSize,
} from "./BTCTransaction";
import { USDT } from "../Coin";
import { omniPayload } from "../util/serialize";
import BigNumber from "bignumber.js";
import _ from "lodash";

class OmniOutput extends BTCOutput {
  constructor({ propertyId, satoshis }) {
    super({ propertyId, satoshis });
    this.scriptPubKey = omniPayload(parseInt(propertyId + "", 16), satoshis);
    this.satoshis = 0;
  }
}

class USDTTransaction extends BTCTransaction {
  /**
   *
   *
   * @static
   * @param {Array<BTCInput>} utxos
   * @param {string} to
   * @param {string} amount
   * @param {string} change
   * @param {string} feePerByte
   * @param {USDT} USDT
   * @memberof USDTTransaction
   */
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
      //如果USDT还有剩余, 确保USDT地址上还有可用UTXO
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

    return new USDTTransaction({ inputs, outputs });
  }
  static estimateFee(utxos, from, to, amount, change, feePerByte, USDT) {
    try {
      return this.from(utxos, from, to, amount, change, feePerByte, USDT).fee;
    } catch (error) {
      if (utxos.length == 0) {
        return new BigNumber(250).multipliedBy(feePerByte);
      }
      const fakeUtxos = utxos.slice();
      const utxo = _.cloneDeep(fakeUtxos[0]);
      utxo.amount = "1000";
      fakeUtxos.push(new BTCInput(utxo));
      return this.from(fakeUtxos, from, to, amount, change, feePerByte, USDT).fee;
    }
  }
}

export { USDTTransaction, OmniOutput };
