import { observable, computed, reaction } from "mobx";
import CryptoJS from "crypto-js";
import BTCWallet from "../wallet/BTCWallet";
import ETHWallet from "../wallet/ETHWallet";
import { MnemonicWordsEnglishKeys, MnemonicWordsChineseKeys } from "../wallet/util/MnemonicWordMap";
import _ from "lodash";
import { toFixedNumber, toFixedString } from "../../../util/NumberUtil";
import Wallet from "../wallet/Wallet";
import crypto from "../../crypto/crypto";
import Account from "./Account";
import {
  ACCOUNT_TYPE_HD,
  ACCOUNT_TYPE_HD_IMPORT,
  ACCOUNT_DEFAULT_ID_HD,
  HDACCOUNT_FIND_WALELT_TYPE_ID,
  HDACCOUNT_FIND_WALELT_TYPE_ADDRESS,
  HDACCOUNT_FIND_WALELT_TYPE_COINID,
  COIN_TYPE_BTC,
  COIN_TYPE_USDT,
  COIN_TYPE_ETC,
  COIN_TYPE_ETH,
  MNEMONIC_TYPE_ZH,
  COIN_TYPE_BCH,
  COIN_TYPE_BSV,
} from "../../../config/const";
import AccountStorage from "./AccountStorage";
import AccountStore from "./AccountStore";
import Coin from "../wallet/Coin";
import network, { HD_WEB_API, HD_MULTISIG_API } from "../../common/network";
import { installID } from "../../../util/device";
import ETCWallet from "../wallet/ETCWallet";
import BigNumber from "bignumber.js";
import BCHWallet from "../wallet/BCHWallet";
import BSVWallet from "../wallet/BSVWallet";

class HDAccount extends Account {
  hdId;
  @computed get hasCreated() {
    return !!this.wallets.length;
  }
  @observable displayChange = true;
  @observable hasBackup = false;

  @computed get lastTransferCoinID() {
    if (!this.stashedTransferCoinID) {
      return this.BTCWallet.BTC.id;
    }
    return this.stashedTransferCoinID;
  }

  @computed get lastReceiveCoinID() {
    if (!this.stashedReceiveCoinID) {
      return this.BTCWallet.BTC.id;
    }
    return this.stashedReceiveCoinID;
  }
  @computed get lastWalletID() {
    if (!this.stashedWalletID) {
      return this.BTCWallet.id;
    }
    return this.stashedWalletID;
  }

  /**
   *
   *
   * @memberof HDAccount
   */
  @observable stashedTransferCoinID = undefined;
  @observable stashedReceiveCoinID = undefined;

  @observable stashedWalletID = undefined;
  /**
   *
   * @type { BTCWallet }
   * @memberof HDAccount
   */
  @observable BTCWallet;
  /**
   *
   * @type { BCHWallet }
   * @memberof HDAccount
   */
  @observable BCHWallet;
  /**
   *
   * @type { BSVWallet }
   * @memberof HDAccount
   */
  @observable BSVWallet;
  /**
   *
   * @type { ETHWallet }
   * @memberof HDAccount
   */
  @observable ETHWallet;

  /**
   *
   * @type { ETCWallet }
   * @memberof HDAccount
   */
  @observable ETCWallet;

  /**
   *
   * @type { Array.<Wallet> }
   * @memberof HDAccount
   */
  @observable wallets = [];

  @observable isExtendedPublicKeyUploaded = false;

  @computed get needRecovery() {
    return this.hasCreated && !this.isExtendedPublicKeyUploaded;
  }

  @computed get totalAsset() {
    return toFixedNumber(
      this.wallets.reduce((sum, wallet) => sum + wallet.assetPrice, 0),
      2
    );
  }
  @computed get floatingAsset() {
    return toFixedNumber(
      this.wallets.reduce((sum, wallet) => sum + wallet.floatingAssetPrice, 0),
      2
    );
  }

  /**
   *
   * @type { Array.<Coin>}
   * @readonly
   * @memberof HDAccount
   */
  @computed get coins() {
    return this.allCoins.filter(coin => coin.display);
  }
  @computed get allCoins() {
    const ERC20s = this.ETHWallet && this.ETHWallet.coins.slice();
    ERC20s.shift();

    return _.compact([
      this.BTCWallet.BTC,
      this.BTCWallet.USDT,
      this.ETHWallet.ETH,
      this.ETCWallet.ETC,
      this.BCHWallet && this.BCHWallet.BCH,
      this.BSVWallet && this.BSVWallet.BSV,
      ...ERC20s,
    ]);
  }
  @computed get addresss() {
    if (!this.ETCWallet || !this.BTCWallet) {
      return "";
    }
    // const comboBTCAddress = this.BTCWallet.addresses.reduce((result, address) => `${result}\"2,${address.address}\",`, "")
    const comboBCHAddress =
      (this.BCHWallet &&
        this.BCHWallet.addresses.reduce((result, address) => `${result},\"5,${address.address}\"`, "")) ||
      "";
    const comboBSVAddress =
      (this.BSVWallet &&
        this.BSVWallet.addresses.reduce((result, address) => `${result},\"6,${address.address}\"`, "")) ||
      "";
    return `[\"1,${this.ETHWallet.address}\",\"3,${this.BTCWallet.address}\",\"4,${this.ETHWallet.address}\"${comboBCHAddress}${comboBSVAddress}]`;
  }
  static create = async (name, pwd, mnemonicType) => {
    const mnemonicWords = generateRandomMnemonic(mnemonicType);
    await HDAccount.recovery(mnemonicWords, name, pwd);
    return mnemonicWords;
  };
  static import = async (mnemonic, name, pwd) => {
    return await HDAccount.recovery(mnemonic, name, pwd, ACCOUNT_TYPE_HD_IMPORT, true);
  };
  static recovery = async (mnemonic, name, pwd, type = ACCOUNT_TYPE_HD, fetch = false) => {
    const mnemonicStr = _.isArray(mnemonic) ? mnemonic.join(" ") : mnemonic;
    const account = new HDAccount();
    // const wallets = await Promise.all([BTCWallet.import(mnemonicStr, pwd, name, fetch), ETHWallet.import(mnemonicStr, pwd, name, fetch)])
    account.BTCWallet = await BTCWallet.import(mnemonicStr, pwd, name, fetch);
    account.BCHWallet = await BCHWallet.fromBTCWallet(account.BTCWallet, pwd);
    account.BSVWallet = await BSVWallet.fromBTCWallet(account.BTCWallet, pwd);

    account.ETHWallet = await ETHWallet.import(mnemonicStr, pwd, name, fetch);
    account.ETCWallet = new ETCWallet({
      id: account.ETHWallet.id,
      address: account.ETHWallet.address,
    });

    await network.post(
      "/multisigner/setImei",
      { imei: installID, publicKey: account.BTCWallet.extendedPublicKey.key },
      HD_MULTISIG_API
    );

    const hdId = generateWalletID(mnemonicStr);

    const params = {
      address: account.addresss,
      hdId: hdId,
      imeiNum: installID,
      v3Address: account.BTCWallet.extendedPublicKey.key,
      create: fetch ? 0 : 1,
    };

    await network.get("/joinWallet", params, HD_WEB_API);
    account.hdId = hdId;
    const wallets = [account.BTCWallet, account.ETHWallet, account.ETCWallet, account.BCHWallet, account.BSVWallet];
    wallets.forEach(wallet => (wallet.hdId = hdId));
    account.type = ACCOUNT_TYPE_HD;
    account.wallets = wallets;
    account.isExtendedPublicKeyUploaded = true;
    // if (type == ACCOUNT_TYPE_HD) {
    account.id = ACCOUNT_DEFAULT_ID_HD;
    // } else {
    // account.id = crypto.sha256(wallets.reduce((res, wallet) => res + wallet.id, '')).toString()
    // }

    if (fetch) {
      await account.update();
    }

    account.name = name;
    if (type === ACCOUNT_TYPE_HD_IMPORT) {
      account.hasBackup = true;
    }
    AccountStore.currentAccount = account;
    AccountStore.showDefaultIndex = false;
    AccountStorage.insert(account);
    AccountStore.defaultMultiSigAccount.wallets = [];
    AccountStore.defaultMultiSigAccount.pendingTxs = [];
    return account;
  };
  constructor(obj = {}) {
    super(obj);
    if (_.isPlainObject(obj.BTCWallet)) {
      this.BTCWallet = new BTCWallet(obj.BTCWallet);
    }
    if (_.isPlainObject(obj.ETHWallet)) {
      this.ETHWallet = new ETHWallet(obj.ETHWallet);
    }
    if (_.isPlainObject(obj.ETCWallet)) {
      this.ETCWallet = new ETCWallet(obj.ETCWallet);
    } else if (this.ETHWallet) {
      this.ETCWallet = new ETCWallet({
        id: this.ETHWallet.id,
        address: this.ETHWallet.address,
      });
    }
    if (_.isPlainObject(obj.BCHWallet)) {
      this.BCHWallet = new BCHWallet(obj.BCHWallet);
    }

    if (_.isPlainObject(obj.BSVWallet)) {
      this.BSVWallet = new BSVWallet(obj.BSVWallet);
    }
    if (obj.hasOwnProperty("hasBackup")) {
      this.hasBackup = obj.hasBackup;
    }
    this.hdId = obj.hdId;
    this.wallets = _.compact([this.BTCWallet, this.ETHWallet, this.ETCWallet, this.BCHWallet, this.BSVWallet]);

    this.stashedTransferCoinID = obj.stashedTransferCoinID;
    this.stashedReceiveCoinID = obj.stashedReceiveCoinID;
    this.stashedWalletID = obj.stashedWalletID;
    this.isExtendedPublicKeyUploaded = obj.isExtendedPublicKeyUploaded;
    reaction(
      () => this.hasBackup,
      hasBackup => {
        AccountStorage.update();
      }
    );
    reaction(
      () => this.stashedTransferCoinID,
      coinID => {
        AccountStorage.update();
      }
    );
    reaction(
      () => this.stashedReceiveCoinID,
      coinID => {
        AccountStorage.update();
      }
    );
  }
  update = async () => {
    try {
      if (!this.hasCreated) {
        return;
      }
      const [balanceResult] = await Promise.all([
        network.get("/balance", { address: this.addresss }, HD_WEB_API),
        this.BTCWallet.fetchUtxos(),
        this.BCHWallet.fetchUtxos(),
        this.BSVWallet.fetchUtxos(),
      ]);
      const coins = balanceResult.data;
      const BTC = coins.filter(coin => coin.tokenType == COIN_TYPE_BTC);
      const USDT = coins.find(coin => coin.tokenType == COIN_TYPE_USDT);
      const BCH = coins.filter(coin => coin.tokenType == COIN_TYPE_BCH);
      const BSV = coins.filter(coin => coin.tokenType == COIN_TYPE_BSV);
      const ETH = coins.find(coin => coin.tokenType == COIN_TYPE_ETH && !coin.address);
      const ETC = coins.find(coin => coin.tokenType == COIN_TYPE_ETC);
      const ERC20s = coins.filter(coin => coin.tokenType == COIN_TYPE_ETH && coin.address);

      if (BTC) {
        // const balance = toFixedString(BTC.reduce((result, el) => result.plus(el.balance), new BigNumber(0)), 8)
        // this.BTCWallet.BTC.balance = balance
      }
      if (USDT) {
        this.BTCWallet.USDT.balance = USDT.balance;
      }
      if (BCH) {
        const balance = toFixedString(
          BCH.reduce((result, el) => result.plus(el.balance), new BigNumber(0)),
          8
        );
        this.BCHWallet.BCH.balance = balance;
      }
      if (BSV) {
        const balance = toFixedString(
          BSV.reduce((result, el) => result.plus(el.balance), new BigNumber(0)),
          8
        );
        this.BSVWallet.BSV.balance = balance;
      }
      if (ETH) {
        this.ETHWallet.ETH.balance = ETH.balance;
      }
      if (ETC) {
        this.ETCWallet.ETC.balance = ETC.balance;
      }
      if (ERC20s) {
        this.ETHWallet.updateERC20s(ERC20s);
      }

      AccountStorage.update();
    } catch (error) {}
  };
  drop = async pwd => {
    if (!this.wallets.length) {
      throw new Error("请先创建钱包");
    }

    const result = await Promise.all(this.wallets.map(wallet => wallet.isVaildPassword(pwd)));
    const success = result.reduce((res, el) => res || el, false);

    if (success) {
      this.wallets.map(wallet => wallet.drop(pwd));
      await AccountStorage.drop(this);
      AccountStore.currentAccount = AccountStore.defaultHDAccount;
    }

    return success;
  };
  exportMnemonic = async pwd => {
    if (!this.wallets.length) {
      throw new Error("请先创建钱包");
    }
    return await this.wallets[0].exportMnemonic(pwd);
  };

  /**
   *
   * @returns {Wallet}
   * @memberof HDAccount
   */
  findWallet = (id, type = HDACCOUNT_FIND_WALELT_TYPE_ID | HDACCOUNT_FIND_WALELT_TYPE_ADDRESS) => {
    if (!_.isString(id) && !_.isNumber(id)) {
      return null;
    }

    let wallet;
    id = (id + "").toUpperCase();
    if (type & HDACCOUNT_FIND_WALELT_TYPE_ID) {
      wallet = this.wallets.find(
        wallet => (wallet.id && wallet.id.toUpperCase() === id) || wallet.address.toUpperCase() === id
      );
      if (wallet) {
        return wallet;
      }
    }

    if (type & HDACCOUNT_FIND_WALELT_TYPE_ADDRESS) {
      wallet = this.wallets.find(wallet => wallet.address === id);
      if (wallet) {
        return wallet;
      }
    }

    if (type & HDACCOUNT_FIND_WALELT_TYPE_COINID) {
      wallet = this.wallets.find(wallet => !!wallet.coins.find(coin => coin.id + "" === id));
      if (wallet) {
        return wallet;
      }
    }

    return wallet;
  };

  /**
   *
   * @returns {Coin}
   * @memberof HDAccount
   */
  findCoin = coinID => {
    if (_.isNil(coinID)) {
      return null;
    }
    coinID = coinID + "";
    return this.coins.find(coin => coin.id + "" === coinID);
  };

  toJSON() {
    return {
      id: this.id,
      hdId: this.hdId,
      name: this.name,
      type: this.type,
      BTCWallet: this.BTCWallet,
      ETHWallet: this.ETHWallet,
      ETCWallet: this.ETCWallet,
      BCHWallet: this.BCHWallet,
      BSVWallet: this.BSVWallet,
      hasBackup: this.hasBackup,
      displayChange: this.displayChange,
      stashedWalletID: this.stashedWalletID,
      stashedReceiveCoinID: this.stashedReceiveCoinID,
      stashedTransferCoinID: this.stashedTransferCoinID,
      isExtendedPublicKeyUploaded: this.isExtendedPublicKeyUploaded,
    };
  }
}

const enKeys = MnemonicWordsEnglishKeys;
const zhKeys = MnemonicWordsChineseKeys;
const byteLength = 16;
const generateRandomMnemonic = type => {
  const keys = type == MNEMONIC_TYPE_ZH ? zhKeys : enKeys;
  const randomBytes = CryptoJS.lib.WordArray.random(byteLength);
  const checksumLength = (byteLength * 8) / 32;
  const checksumHash = CryptoJS.SHA256(randomBytes).toString();
  const checksumByte = (0xff << (8 - checksumLength)) & 0xff & (0xff & parseInt(checksumHash.substr(0, 2), 16));
  const bytes = _.chunk(
    `${hex2bin(randomBytes.toString())}${_.padStart(checksumByte.toString(2), 8, "0")}`.split(""),
    11
  ).map(el => parseInt(el.join(""), 2));
  const words = [];
  for (const index of bytes) {
    words.push(keys[index]);
  }
  return _.take(words, 12);
};
const hex2bin = hex => hex.split("").reduce((bin, el) => bin + _.padStart(parseInt(el, 16).toString(2), 4, "0"), "");
const generateWalletID = mnemonic => {
  const hash = crypto.sha256(mnemonic).toString();
  const salt = crypto.sha256("B6vbvoKrKemCMqfH9NYm").toString();
  return crypto.sha3(hash + salt).toString();
};
export default HDAccount;
