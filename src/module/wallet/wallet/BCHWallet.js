import { NativeModules } from "react-native";
import { DeviceEventEmitter, Platform } from "react-native";
import DFNetwork, { NOTIFY_API, WALLET_API, HD_BTC_API, HD_WEB_API } from "../../common/network";
import { installID } from "../../../util/device";
import Wallet, { ExtendedKey, BIP44Address } from "./Wallet";
import { BigNumber } from "bignumber.js";
import { toFixedNumber, toFixedString } from "../../../util/NumberUtil";
import {
  WALLET_SOURCE_MW,
  WALLET_SOURCE_PK,
  SCHEMA_BTC,
  NETWORK_ENV_TESTNET,
  RPC_URL_CHANGE,
  WALLET_TYPE_BTC,
  BTC_ADDRESS_TYPE_PKH,
  BTC_ADDRESS_TYPE_SH,
  WALLET_TYPE_BCH,
  NETWORK_ENV_MAINNET,
  COIN_TYPE_BCH,
} from "../../../config/const";
import { BCH } from "./Coin";
import network from "../../common/network";
import _ from "lodash";
import i18n from "../../i18n/i18n";

import { observable, action } from "mobx";
import { BCHOutput, BCHInput, BCHTransaction } from "./bch/BCHTransaction";
import { BTCTransaction } from "./btc/BTCTransaction";

const RRRNBitcoin = NativeModules.RRRNBitcoin;
const BITCOIN_SATOSHI = 100000000;
const P2PKH_INPUT_SIZE = 150;
const P2PKH_OUTPUT_SIZE = 40;

export default class BCHWallet extends Wallet {
  BCH = new BCH();

  /**
   *
   * @type {ExtendedKey}
   * @memberof BTCWallet
   */
  extendedPublicKey;

  /**
   *
   * @type {Array<BIP44Address>}
   * @memberof BTCWallet
   */
  @observable addresses = [];

  /**
   *
   * @type {Object<string, BIP44Address>}
   * @memberof BTCWallet
   */
  addressesMap = {};

  /**
   *
   * @type {Array<BCHInput>}
   * @memberof BTCWallet
   */
  utxos = [];

  /**
   *
   * @type {BIP44Address}
   * @memberof BTCWallet
   */
  @observable.ref currentAddress = null;
  get defaultCoin() {
    return this.BCH;
  }
  static fromBTCWallet = async (BTCWallet, pwd) => {
    const wallet = new BCHWallet(BTCWallet);

    wallet.extendedPublicKey = await wallet.exportExtendedPublicKey(pwd);
    wallet.currentAddress = (await wallet.fetchAddresses([wallet.path])).pop();
    wallet.address = wallet.currentAddress.address;
    wallet.addresses = [wallet.currentAddress];
    wallet.addressesMap = wallet.addresses.reduce((map, address) => {
      map[address.address] = address;
      return map;
    }, {});
    return wallet;
  };
  constructor(obj = {}) {
    super(obj);
    this.path = "m/44'/145'/0'/0/0";
    this.type = WALLET_TYPE_BCH;
    this.coins = [this.BCH];
    this.extendedPublicKey = obj.extendedPublicKey && new ExtendedKey(obj.extendedPublicKey);
    this.addresses = (obj.addresses &&
      obj.addresses.length > 0 &&
      obj.addresses.map(address => new BIP44Address(address))) || [
      new BIP44Address({
        address: this.address,
        path: this.path,
      }),
    ];
    this.addressesMap = this.addresses.reduce((map, address) => {
      map[address.address] = address;
      return map;
    }, {});
    this.currentAddress =
      (obj.currentAddress && new BIP44Address(obj.currentAddress)) ||
      new BIP44Address({
        address: this.address,
        path: this.path,
      });
    obj.coins &&
      obj.coins.forEach(coin => {
        const el = this.coins.find(el => el.id === coin.id);
        if (el) {
          el.balance = coin.balance;
          if (el.hasOwnProperty("display")) {
            el.display = coin.display;
          }
        }
      });
  }
  calculateMaximumAmount = async feePerByte => {
    const txSize = new BigNumber(this.utxos.length).multipliedBy(P2PKH_INPUT_SIZE).plus(P2PKH_OUTPUT_SIZE);
    const fee = txSize.multipliedBy(feePerByte).div(BITCOIN_SATOSHI);
    const maximum = new BigNumber(this.BCH.balance + "").minus(fee);
    return toFixedString(maximum, 8);
  };
  estimateFee = ({ amount, feePerByte, showHand }) => {
    if (amount === "") {
      amount = "0";
    }
    if (isNaN(parseFloat(amount))) {
      amount = "-1";
    }
    try {
      const tx = BTCTransaction.from(
        this.utxos,
        this.address,
        amount,
        this.currentAddress.address,
        feePerByte,
        showHand
      );
      return (tx && toFixedString(new BigNumber(tx.fee).div(BITCOIN_SATOSHI))) || "-1";
    } catch (error) {
      return "-1";
    }
  };
  sendRawTransaction = async (to, amount, feePerByte, pwd, note) => {
    if (this.utxos.length == 0 && new BigNumber(this.BCH.balance).isGreaterThan(0)) {
      await this.fetchUtxos();
    }

    if (this.utxos.length == 0) {
      throw new Error(i18n.t("wallet-send-utxos-empty"));
    }

    const amountSatoshi = new BigNumber(amount + "").multipliedBy(BITCOIN_SATOSHI).toFixed(0);
    let outputs = [
      new BCHOutput({
        address: to,
        satoshis: amountSatoshi + "",
      }),
    ];

    let inputs = [];
    const maximum = await this.calculateMaximumAmount(feePerByte);
    const showHand = new BigNumber(maximum).isEqualTo(amount + "");
    if (!showHand) {
      let totalInput = new BigNumber(0);
      let fee;
      for (let i = 0; i < this.utxos.length; i++) {
        const utxo = this.utxos[i];
        inputs.push(utxo);
        totalInput = totalInput.plus(utxo.satoshis);
        if (totalInput.isGreaterThan(amountSatoshi)) {
          const inputSize = new BigNumber(inputs.length).multipliedBy(P2PKH_INPUT_SIZE);
          const outputSize = new BigNumber(outputs.length + 1).multipliedBy(P2PKH_OUTPUT_SIZE);
          fee = inputSize.plus(outputSize).multipliedBy(feePerByte);
          if (totalInput.minus(fee).isGreaterThanOrEqualTo(amountSatoshi)) {
            break;
          }
        }
        if (i == this.utxos.length - 1) {
          throw new Error(i18n.t("wallet-send-balance-notenough"));
        }
      }
      const change = totalInput.minus(amountSatoshi).minus(fee);
      if (change.isGreaterThan(150)) {
        outputs.push({
          address: this.address,
          satoshis: change.toFixed(0),
        });
      }
    } else {
      this.utxos.forEach(utxo => inputs.push(utxo));
    }

    if (this.utxos.length == 0 || inputs.length == 0) {
      throw new Error(i18n.t("wallet-send-utxos-empty"));
    }

    const tx = new BCHTransaction({ inputs, outputs });
    tx.hashInputs();
    const cloneInputs = JSON.parse(JSON.stringify(inputs));
    const cloneOutputs = _.cloneDeep(outputs);
    const { txid, rawData } = await RRRNBitcoin.sendRawTransaction(
      this.id,
      cloneInputs,
      cloneOutputs,
      NETWORK_ENV_MAINNET,
      pwd
    );
    const result = await this.broadcastRawTransaction(rawData, to, amount, cloneInputs, cloneOutputs, note);

    this.utxos = _.xor(this.utxos, inputs);

    return result;
  };
  broadcastRawTransaction = async (rawData, to, amount, inputs, outputs, note = "") => {
    inputs = inputs.map(input => {
      return {
        address: input.address.address,
        orderCount: input.amount,
      };
    });
    outputs = outputs.map(output => {
      const amount = new BigNumber(output.satoshis).div(BITCOIN_SATOSHI);
      return {
        address: output.address,
        orderCount: toFixedString(amount, 8),
      };
    });

    return DFNetwork.post(
      "/addTrade",
      {
        postData: rawData,
        fromAddress: this.address,
        toAddress: to,
        tokenAddress: "bchabc",
        tokenType: 5,
        orderCount: amount,
        walletAddress: this.id,
        txCreateTime: new Date().getTime(),
        fromAddressList: inputs,
        toAddressList: outputs,
        remark: note,
      },
      HD_BTC_API
    );
  };
  fetchAddresses = async (paths, type = BTC_ADDRESS_TYPE_PKH, extendedKey = this.extendedPublicKey) => {
    const splitPaths = paths.map(path => path.split(extendedKey.path).join(""));
    const addresses = await RRRNBitcoin.fetchAddresses(this.id, splitPaths, extendedKey.key, type, NETWORK_ENV_MAINNET);
    const bip44Addresses = addresses.map((address, i) => new BIP44Address({ address: address, path: paths[i] }));
    return bip44Addresses;
  };

  /**
   *
   * @type {BTC_ADDRESS_TYPE_PKH|BTC_ADDRESS_TYPE_SH}
   * @memberof BTCWallet
   */
  @action generatorAddress = async type => {
    const index =
      this.addresses.reduce((result, address) => Math.max(result, parseInt(address.path.split("/").pop())), 0) + 1;
    const path = `${this.extendedPublicKey.path}/0/${index}`;
    const address = (await this.fetchAddresses([path], type, this.extendedPublicKey, NETWORK_ENV_MAINNET)).pop();
    this.addresses.unshift(address);
    return this.addresses[0];
  };
  exportExtendedPublicKey = async (pwd, path = "m/44'/145'/0'") => {
    const key = await RRRNBitcoin.exportExtendedPublicKey(this.id, path, NETWORK_ENV_MAINNET, pwd);
    if (!key || !key.length > 0) {
      throw new Error(i18n.t("common-password-incorrect"));
    }
    return new ExtendedKey({ key, path });
  };
  fetchUtxos = async () => {
    try {
      let utxos = (
        await network.get(
          "/getUtxos",
          {
            walletAddresses: Object.keys(this.addressesMap),
            tokenType: COIN_TYPE_BCH,
          },
          HD_BTC_API
        )
      ).data;

      this.utxos = _.compact(
        utxos.map(utxo => {
          utxo.address = this.addressesMap[utxo.address];
          utxo.confirmations = parseInt(utxo.confirmations);
          if (isNaN(utxo.confirmations) || !utxo.address) {
            return undefined;
          }
          return new BCHInput(utxo);
        })
      ).sort((a, b) => (new BigNumber(a.satoshis).minus(b.satoshis).isGreaterThanOrEqualTo(0) ? -1 : 1));
    } catch (error) {}
  };
  isVaildPassword = async pwd => {
    if (!pwd || pwd.length == 0) {
      throw new Error("密码不能为空");
    }
    return await RRRNBitcoin.isVaildPassword(this.id, pwd);
  };
  checkMaliciousAddress = async address => {
    try {
      const result = await network.get(
        "check/addressCheck.do",
        {
          address: address,
          imeiNum: installID,
          coin: "BTC",
        },
        NOTIFY_API
      );
      return result.data;
    } catch (error) {
      return true;
    }
  };
  decodePaymentScheme(scheme) {
    scheme;
  }
}
