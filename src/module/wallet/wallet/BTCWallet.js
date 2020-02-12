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
  COIN_TYPE_BTC,
  COIN_TYPE_USDT,
  BTC_INPUT_TYPE_P2SH,
  BTC_INPUT_TYPE_P2PKH,
} from "../../../config/const";
import { BTCCoin, USDT } from "./Coin";
import network from "../../common/network";
import _ from "lodash";
import i18n from "../../i18n/i18n";
import { observable, action, reaction } from "mobx";
import { BTCInput, BTCOutput, BTCTransaction } from "./btc/BTCTransaction";
import AccountStorage from "../account/AccountStorage";
import { USDTTransaction } from "./btc/USDTTransaction";
import {
  BTCSegwitP2SHInput,
  BTCSegwitP2SHP2WPKHAddress,
  BTCSegwitP2SHTransaction,
  BTCSegwitP2SHUSDTTransaction,
} from "./btc/BTCSegwit";
import { addressType } from "./util/serialize";

const RRRNBitcoin = NativeModules.RRRNBitcoin;
const BITCOIN_SATOSHI = 100000000;
const USDT_TAG_SATOSHI = 546;
const P2PKH_INPUT_SIZE = 150;
const P2PKH_OUTPUT_SIZE = 40;
const OMNI_OUTPUT_SIZE = 30;

export default class BTCWallet extends Wallet {
  BTC = new BTCCoin();
  USDT = new USDT();

  /**
   *
   * @type {BTCExtendedKey}
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
   * @type {Array<BTCInput>}
   * @memberof BTCWallet
   */
  @observable utxos = [];

  /**
   *
   * @type {BIP44Address}
   * @memberof BTCWallet
   */
  @observable.ref currentAddress = null;
  get defaultCoin() {
    return this.BTC;
  }
  get txListParams() {
    return {
      address: this.addresses.map(address => address.address),
    };
  }
  constructor(obj = {}) {
    super(obj);
    this.path = this.path || network.env === NETWORK_ENV_TESTNET ? "m/44'/1'/0'/0/0" : "m/44'/0'/0'/0/0";
    this.type = Wallet.WALLET_TYPE_BTC;
    this.coins = [this.BTC, this.USDT];
    this.extendedPublicKey = obj.extendedPublicKey && new BTCExtendedKey(obj.extendedPublicKey);
    this.addresses = (obj.addresses &&
      obj.addresses.length > 0 &&
      _.compact(
        obj.addresses.map(address => {
          return address.address && new BIP44Address(address);
        })
      )) || [new BIP44Address({ address: this.address, path: this.path })];
    this.addressesMap = this.addresses.reduce((map, address) => {
      map[address.address] = address;
      return map;
    }, {});
    this.currentAddress =
      (obj.currentAddress && obj.currentAddress.address && new BIP44Address(obj.currentAddress)) ||
      new BIP44Address({ address: this.address, path: this.path });
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
    this.utxos =
      (obj.utxos &&
        obj.utxos.length > 0 &&
        _.compact(
          obj.utxos.map(utxo => {
            const type = addressType(utxo.address);
            switch (type) {
              case BTC_INPUT_TYPE_P2PKH:
                return new BTCInput(utxo);
              case BTC_INPUT_TYPE_P2SH:
                return new BTCSegwitP2SHInput(utxo);
            }
            return undefined;
          })
        )) ||
      [];
    this.startObserve();
  }
  static create(name, pwd) {
    return new Promise(async (resolve, reject) => {
      try {
        let obj = await RRRNBitcoin.createRandomAccount(name, pwd, "");
        let mnemonic = obj.mnemonic;
        let act = new BTCWallet({ ...obj, source: WALLET_SOURCE_MW });
        act.name = name;
        await _createWallet(act);
        act.save();
        resolve({ act, mnemonic });
      } catch (error) {
        reject(error);
      }
    });
  }
  static import(mnemonic, pwd, name = "", fetch) {
    return new Promise(async (resolve, reject) => {
      try {
        let obj = await RRRNBitcoin.importAccount(mnemonic, pwd, name);
        let act = new BTCWallet({ ...obj, source: WALLET_SOURCE_MW });
        act.extendedPublicKey = await act.exportExtendedPublicKey(pwd);
        await act.generatorAddress(BTC_INPUT_TYPE_P2SH);
        act.source = WALLET_SOURCE_MW;
        act.name = name;
        resolve(act);
      } catch (error) {
        reject(error);
      }
    });
  }
  static importPK(pk, pwd, name, note) {
    return new Promise(async (resolve, reject) => {
      try {
        let obj = await RRRNBitcoin.importPrivatekey(pk, pwd, name);
        let act = new BTCWallet({ ...obj, source: WALLET_SOURCE_PK });
        act.name = name;
        act.isBackup = true;
        try {
          await _createWallet(act);
        } catch (error) {
          if (error.errMsg === "钱包已存在，请不要重复创建") {
            //empty
          } else {
            reject(error);
          }
        }

        act.save();
        DeviceEventEmitter.emit("accountOnChange");
        resolve(act);
      } catch (error) {
        reject(error);
      }
    });
  }
  static backupMnemonic(mnemonic) {
    return new Promise(async (resolve, reject) => {
      let obj = await RRRNBitcoin.backupMnemonic(mnemonic);
      let act = new BTCWallet(obj);
      DeviceEventEmitter.emit("accountOnChange");
      resolve(act);
    });
  }
  startObserve = () => {
    super.startObserve();
    reaction(
      () =>
        toFixedString(
          this.utxos.reduce((res, utxo) => res.plus(utxo.satoshis), new BigNumber(0)).div(BITCOIN_SATOSHI),
          8
        ),
      balance => {
        this.BTC.balance = balance;
      }
    );
  };
  drop = text => {
    _deleteWallet(this);
  };
  sendUSDTTransaction = async (to, amount, feePerByte, pwd, note) => {
    if (this.utxos.length == 0 && this.BTC.balance != 0) {
      await this.fetchUtxos();
    }

    if (this.utxos.length == 0) {
      throw new Error(i18n.t("wallet-send-utxos-empty"));
    }

    const tx = BTCSegwitP2SHUSDTTransaction.from(
      this.utxos,
      this.address,
      to,
      amount,
      this.currentAddress.address,
      feePerByte,
      this.USDT
    );

    await tx.signInputs(
      async (rawSigHash, sigHashType, path) => await RRRNBitcoin.signHash(this.id, rawSigHash, sigHashType, path, pwd)
    );
    const utxos = await tx.outputs2utxos((txid, output, vout) => {
      const address = this.addressesMap[output.address];
      if (!address) {
        return undefined;
      }
      const amount = toFixedString(new BigNumber(output.satoshis).div(BITCOIN_SATOSHI));
      const type = addressType(address.address);
      switch (type) {
        case BTC_INPUT_TYPE_P2PKH:
          return new BTCInput({ address, vout, txid, amount });
        case BTC_INPUT_TYPE_P2SH:
          return new BTCSegwitP2SHInput({ address, vout, txid, amount });
      }
    });
    const result = await this.broadcastRawTransaction(COIN_TYPE_USDT, tx, to, amount, note);
    this.utxos = _.xorWith(
      this.utxos.slice(),
      tx.inputs,
      (utxo, input) => utxo.txid === input.txid && utxo.vout === input.vout
    );
    this.utxos.push(...utxos);
  };
  calculateMaximumAmount = async feePerByte => {
    if (this.utxos.length == 0 && this.BTC.balance != 0) {
      await this.fetchUtxos();
    }

    const tx = BTCSegwitP2SHTransaction.from(this.utxos, this.address, 0, this.address, feePerByte, true);
    const fee = toFixedString(new BigNumber(tx.fee).div(BITCOIN_SATOSHI));
    const maximum = BigNumber.max(new BigNumber(this.BTC.balance + "").minus(fee), 0);

    return toFixedString(maximum);
  };
  estimateFee = ({ amount, feePerByte, showHand, coin }) => {
    if (amount === "") {
      amount = "0";
    }
    if (isNaN(parseFloat(amount))) {
      return "-1";
    }
    try {
      const fee =
        coin instanceof USDT
          ? USDTTransaction.estimateFee(
              this.utxos,
              this.address,
              this.address,
              amount,
              this.currentAddress.address,
              feePerByte,
              coin
            )
          : BTCTransaction.estimateFee(
              this.utxos,
              this.address,
              amount,
              this.currentAddress.address,
              feePerByte,
              showHand
            );
      return toFixedString(new BigNumber(fee).div(BITCOIN_SATOSHI)) || "-1";
    } catch (error) {
      return "-1";
    }
  };
  sendRawTransaction = async (to, amount, feePerByte, pwd, note) => {
    if (this.utxos.length == 0 && this.BTC.balance != 0) {
      await this.fetchUtxos();
    }

    if (this.utxos.length == 0) {
      throw new Error(i18n.t("wallet-send-utxos-empty"));
    }

    const maximum = await this.calculateMaximumAmount(feePerByte);
    const showHand = new BigNumber(maximum).isEqualTo(amount + "");
    const tx = BTCSegwitP2SHTransaction.from(this.utxos, to, amount, this.currentAddress.address, feePerByte, showHand);

    await tx.signInputs(
      async (rawSigHash, sigHashType, path) => await RRRNBitcoin.signHash(this.id, rawSigHash, sigHashType, path, pwd)
    );
    const utxos = await tx.outputs2utxos((txid, output, vout) => {
      const address = this.addressesMap[output.address];
      if (!address) {
        return undefined;
      }
      const amount = toFixedString(new BigNumber(output.satoshis).div(BITCOIN_SATOSHI));
      const type = addressType(address.address);
      switch (type) {
        case BTC_INPUT_TYPE_P2PKH:
          return new BTCInput({ address, vout, txid, amount });
        case BTC_INPUT_TYPE_P2SH:
          return new BTCSegwitP2SHInput({ address, vout, txid, amount });
      }
    });

    const result = await this.broadcastRawTransaction(COIN_TYPE_BTC, tx, to, amount, note);
    this.utxos = _.xorWith(
      this.utxos.slice(),
      tx.inputs,
      (utxo, input) => utxo.txid === input.txid && utxo.vout === input.vout
    );
    this.utxos.push(...utxos);
    return result;
  };
  async isVaildPassword(pwd) {
    if (!pwd || pwd.length == 0) {
      throw new Error("密码不能为空");
    }

    return await RRRNBitcoin.isVaildPassword(this.id, pwd);
  }
  async exportPrivateKey(pwd) {
    if (!pwd || pwd.length == 0) {
      throw new Error("密码不能为空");
    }
    let result = await RRRNBitcoin.exportPrivateKey(this.id, pwd);
    if (Platform.OS === "android") {
      result = result.privateKey;
    }
    return result;
  }
  async exportMnemonic(pwd) {
    if (!pwd || pwd.length == 0) {
      throw new Error("密码不能为空");
    }
    let result = await RRRNBitcoin.exportMnemonic(this.id, pwd);
    if (Platform.OS === "android") {
      result = result.mnemonic;
    }
    return result;
  }
  exportExtendedPublicKey = async (
    pwd,
    path = DFNetwork.env === NETWORK_ENV_TESTNET ? "m/44'/1'/0'" : "m/44'/0'/0'"
  ) => {
    const key = await RRRNBitcoin.exportExtendedPublicKey(this.id, path, network.env, pwd);
    if (!key || !key.length > 0) {
      throw new Error(i18n.t("common-password-incorrect"));
    }
    return new BTCExtendedKey({ key, path });
  };
  fetchAddresses = async (paths, type = BTC_ADDRESS_TYPE_PKH, extendedKey = this.extendedPublicKey) => {
    if (paths.length == 0) {
      return [];
    }
    const relativePaths = paths.map(path => path.split(extendedKey.path).join(""));
    const addresses = await RRRNBitcoin.fetchAddresses(this.id, relativePaths, extendedKey.key, type, network.env);
    const bip44Addresses = addresses.map((address, i) => new BIP44Address({ address: address, path: paths[i] }));

    return bip44Addresses;
  };
  @action syncAddress = async () => {
    return;
    // try {
    //     const result = await network.get(`https://${network.env ===  NETWORK_ENV_TESTNET? 'testnet.': ''}blockchain.info/unspent`, {
    //         active: this.extendedPublicKey.key
    //     })
    //     const utxos = result['unspent_outputs']
    //     const map = this.addresses.reduce((result, address) => {
    //         //m/44'/0'/0'/0/0"
    //         result[`m${address.path.substr(11)}`] = address.path
    //         return result
    //     }, {})
    //     const paths = utxos.reduce((result, utxo) => {
    //         const xPath = utxo.xpub.path.toLowerCase()
    //         if (!!map[xPath]) {
    //             return result
    //         }
    //         const path = `${this.extendedPublicKey.path}${utxo.xpub.path.substr(1)}`
    //         result.push(path)
    //         map[xPath] = path
    //         return result
    //     }, [])

    //     const addresses = (await this.fetchAddresses(paths, BTC_ADDRESS_TYPE_PKH, this.extendedPublicKey, network.env))
    //     await this.insertAddresses(addresses)
    // } catch (error) {

    // }
  };
  @action insertAddresses = async addresses => {
    this.addresses.unshift(...addresses);
    this.addressesMap = this.addresses.reduce((map, address) => {
      map[address.address] = address;
      return map;
    }, {});

    await AccountStorage.update();
  };
  /**
   *
   * @type {BTC_ADDRESS_TYPE_PKH|BTC_ADDRESS_TYPE_SH}
   * @memberof BTCWallet
   */
  @action generatorAddress = async type => {
    const addresses = this.addresses.filter(address => {
      const addType = addressType(address.address);
      return addType === type;
    });
    const index =
      addresses.length > 0
        ? addresses.reduce((result, address) => Math.max(result, parseInt(address.path.split("/").pop())), 0) + 1
        : 0;
    const path = `${this.extendedPublicKey.path}/0/${index}`;
    let address;
    switch (type) {
      case BTC_ADDRESS_TYPE_PKH: {
        address = (await this.fetchAddresses([path], type, this.extendedPublicKey, network.env)).pop();
        break;
      }
      case BTC_ADDRESS_TYPE_SH: {
        const relativePath = path.split(this.extendedPublicKey.path).slice(-1);
        const [pubkey] = await this.extendedPublicKey.generatePublicKey(relativePath);
        address = new BIP44Address({
          address: BTCSegwitP2SHP2WPKHAddress(pubkey, network.env),
          path,
          pubkey,
        });
        break;
      }
    }

    await this.insertAddresses([address]);
    return this.addresses[0];
  };

  /**
   *
   * @param {BIP44Address|String} address
   * @memberof BTCWallet
   */
  @action setCurrentAddress = address => {
    if (address instanceof BIP44Address && address.address) {
      this.currentAddress = address;
      AccountStorage.update();
    }
  };
  fetchUtxos = async () => {
    try {
      // await this.syncAddress()
    } catch (error) {}

    try {
      const utxos = (
        await network.get(
          "/getBtcUtxosByPub",
          {
            walletAddresses: this.extendedPublicKey.key,
          },
          HD_BTC_API
        )
      ).data;
      for (const utxo of utxos) {
        const address = utxo.address;
        utxo.address = this.addressesMap[utxo.address];
        if (!utxo.address || !utxo.address.pubkey) {
          //获得本地没有的地址时
          try {
            const relativePath = utxo.path
              .split(this.extendedPublicKey.path)
              .slice(-1)
              .pop();
            if (!relativePath || relativePath.length == 0) {
              throw new Error("vaild path");
            }
            const [pubkey] = await this.extendedPublicKey.generatePublicKey([relativePath]);
            if (!utxo.address) {
              utxo.address = new BIP44Address({ address, path: utxo.path, pubkey });
              this.insertAddresses([utxo.address]);
            }
            utxo.address.pubkey = pubkey;
          } catch (error) {}
        }
      }
      this.utxos = _.compact(
        utxos.map(utxo => {
          utxo.confirmations = parseInt(utxo.confirmations);
          if (isNaN(utxo.confirmations) || !utxo.address) {
            return undefined;
          }

          const type = addressType(utxo.address.address);
          switch (type) {
            case BTC_INPUT_TYPE_P2PKH:
              return new BTCInput(utxo);
            case BTC_INPUT_TYPE_P2SH:
              return new BTCSegwitP2SHInput(utxo);
          }
        })
      ).sort((a, b) => (new BigNumber(a.satoshis).minus(b.satoshis).isGreaterThanOrEqualTo(0) ? -1 : 1));
    } catch (error) {}
  };
  // https://github.com/bitcoin/bips/blob/master/bip-0021.mediawiki
  // bitcoin:<address>[?amount=<amount>][?label=<label>][?message=<message>]
  paymentScheme(amount, coin) {
    return `bitcoin:${this.address}?coin=${coin.name}${amount >= 0 ? `&amount=${amount}` : ""}`;
    // return 'bitcoin:' + this.address + '?amount=' + amount + '&coin=' + coin.name
  }
  decodePaymentScheme(scheme) {
    const type = WALLET_TYPE_BTC;
    if (scheme.indexOf(SCHEMA_BTC) != 0) {
      return {};
    }

    let split = scheme.split("?");
    let address = split[0].substring(8);
    let query =
      split.length > 1
        ? split[1].split("&").reduce((query, item) => {
            let itemSplit = item.split("=");
            if (itemSplit.length == 2) {
              query[itemSplit[0]] = itemSplit[1];
            }
            return query;
          }, {})
        : {};

    let amount = query["amount"];
    let coinName = query["coin"];
    let coin = this.findCoin(coinName) || this.BTC;
    return { address, amount, coin, type };
  }
  checkMaliciousAddress = async address => {
    try {
      const result = await DFNetwork.get(
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
  toJSON = () => {
    return {
      isBackup: this.isBackup,
      id: this.id,
      hdId: this.hdId,
      type: this.type,
      source: this.source,
      address: this.address,
      path: this.path,
      pwdnote: this.pwdnote,
      coins: this.coins,
      extendedPublicKey: this.extendedPublicKey,
      addresses: this.addresses,
      currentAddress: this.currentAddress,
      utxos: this.utxos,
    };
  };
  broadcastRawTransaction = async (type, tx, to, amount, note = "") => {
    const rawData = tx.serialized(true);
    const inputs = tx.inputs.map(input => {
      return {
        address: input.address.address,
        orderCount: input.amount,
      };
    });
    const outputs = tx.outputs.map(output => {
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
        tokenAddress: "btc",
        tokenType: type,
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
}

function _createWallet(act, fetch) {
  return DFNetwork.get(fetch ? "/wallet/createWallet.do" : "/wallet/createWalletOnly.do", {
    name: act.name,
    walletAddress: act.id,
    imeiNum: installID,
    tokenType: 2,
  });
}

function _deleteWallet(act) {
  DFNetwork.get("/wallet/deleteWallet.do", {
    walletAddress: act.id,
    imeiNum: installID,
    tokenType: 2,
  });
}

class BTCExtendedKey extends ExtendedKey {
  stashedPubkeys = {};
  generatePublicKey = async paths => {
    const result = paths.map(path => {
      return {
        path,
        pubkey: this.stashedPubkeys[path],
      };
    });

    const needPaths = result.filter(obj => !obj.pubkey).map(obj => obj.path);

    let pubkeys = [];
    if (needPaths.length > 0) {
      pubkeys = await RRRNBitcoin.publicKeys(this.key, needPaths);
    }

    return result.map(obj => {
      if (obj.pubkey) {
        return obj.pubkey;
      }

      const pubkey = pubkeys.shift();
      this.stashedPubkeys[obj.path] = pubkey;
      return pubkey;
    });
  };
  toJSON() {
    return {
      key: this.key,
      path: this.path,
    };
  }
}
export { BIP44Address, BTCExtendedKey };
