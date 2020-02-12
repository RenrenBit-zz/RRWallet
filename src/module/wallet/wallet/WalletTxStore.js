import Wallet from "./Wallet";
import { observable, computed, action } from "mobx";
import DFNetwork, { HD_WEB_API } from "../../common/network";
import CoinStore from "./CoinStore";
import { toFixedNumber, toFixedString } from "../../../util/NumberUtil";
import { BTCCoin, ETH, USDT, ETC, BCH, BSV } from "./Coin";
import {
  WALLET_TYPE_OMNI,
  NETWORK_ENV_TESTNET,
  COIN_TYPE_ETC,
  WALLET_TYPE_ETC,
  WALLET_TYPE_BTC,
  WALLET_TYPE_ETH,
  WALLET_TYPE_BCH,
  WALLET_TYPE_BSV,
  TX_PAGE_SIZE,
  COIN_TYPE_ETH,
  COIN_TYPE_BTC,
  COIN_TYPE_USDT,
} from "../../../config/const";
import _ from "lodash";
import { BigNumber } from "bignumber.js";

const TX_STATUS_SUCCESS = 3;
const TX_STATUS_FAILED = 4;
const TX_STATUS_PENDING = 1;
const TX_STATUS_CONFIRMING = 2;

const TX_TYPE_IN = 1;
const TX_TYPE_OUT = 2;

export { TX_STATUS_SUCCESS, TX_STATUS_FAILED, TX_STATUS_CONFIRMING, TX_STATUS_PENDING, TX_TYPE_IN, TX_TYPE_OUT };

const defaultETH = new ETH();
const defaultBTC = new BTCCoin();
const defaultETC = new ETC();
const defaultBCH = new BCH();
const defaultBSV = new BSV();
export class Transaction {
  @observable coinType = 0;

  coinID;

  get coin() {
    return CoinStore.match(this.coinID);
  }
  /**
   *
   * @type {string}
   * @memberof Transaction
   */
  @observable hash = undefined;
  /**
   *
   * @type {string}
   * @memberof Transaction
   */
  @observable from = "";
  /**
   *
   * @type {string}
   * @memberof Transaction
   */
  @observable to = "";
  /**
   *
   * @type {number}
   * @memberof Transaction
   */
  @observable amount = 0;
  /**
   *
   * @type {number}
   * @memberof Transaction
   */
  @observable fee = 0;
  @observable type = 0;
  @observable status = 0;
  @computed get feeCoin() {
    switch (this.coinType) {
      case WALLET_TYPE_BTC:
      case WALLET_TYPE_OMNI:
        return defaultBTC;
      case WALLET_TYPE_ETH:
        return defaultETH;
      case WALLET_TYPE_ETC:
        return defaultETC;
      case WALLET_TYPE_BCH:
        return defaultBCH;
      case WALLET_TYPE_BSV:
        return defaultBSV;
    }
  }
  /**
   *
   * @type {number}
   * @memberof Transaction
   */
  @observable confirmations = 0;
  /**
   *
   * @type {number}
   * @memberof Transaction
   */
  @observable blockHeight = 0;

  /**
   *
   * @type {number}
   * @memberof Transaction
   */
  timestamp;

  tokenName;

  /**
   *
   * @type {Array}
   * @memberof Transaction
   */
  @observable froms = [];

  /**
   *
   * @type {Array}
   * @memberof Transaction
   */
  @observable tos = [];

  get explorerURL() {
    switch (this.coinType) {
      case Wallet.WALLET_TYPE_BTC: {
        return DFNetwork.env === NETWORK_ENV_TESTNET
          ? `https://test-insight.bitpay.com/tx/${this.hash}`
          : `https://btc.com/${this.hash}`;
      }
      case Wallet.WALLET_TYPE_ETH: {
        return `https://${DFNetwork.env == DFNetwork.env_debug ? "ropsten." : ""}www.etherchain.org/tx/${this.hash}`;
      }
      case WALLET_TYPE_OMNI: {
        if (DFNetwork.env === NETWORK_ENV_TESTNET) {
          return `https://test-insight.bitpay.com/tx/${this.hash}`;
        }
        return `https://omniexplorer.info/tx/${this.hash}`;
      }
      case WALLET_TYPE_ETC: {
        return `https://gastracker.io/tx/${this.hash}`;
      }
      case WALLET_TYPE_BCH:
        return `https://mbch.btc.com/${this.hash}`;
      case WALLET_TYPE_BSV:
        return `https://bchsvexplorer.com/tx/${this.hash}`;
      default:
        return "";
    }
  }
  constructor(obj) {
    this.id = obj.id;
    this.hash = obj.txHash;
    if (obj.hasOwnProperty("txStatus")) {
      this.status = obj.txStatus;
    }
    this.from = obj.fromAddress || obj.from;
    this.to = obj.toAddress || obj.to;
    this.amount = toFixedString(obj.amount, 18);
    this.type = obj.orderType;
    this.fee = obj.costFee || obj.fee;
    this.tokenName = obj.tokenName && obj.tokenName.toUpperCase();
    this.note = obj.remark;
    this.timestamp = obj.txCreateTime;
    this.coinID = obj.tokenId;
    this.confirmations = obj.blockConfirmations;
    this.blockHeight = obj.blockHeight;
    this.coinType = obj.tokenType;
    this.froms = (obj.fromAddressList && obj.fromAddressList.map(from => ({ address: from.address }))) || [];
    this.tos = (obj.toAddressList && obj.toAddressList.map(to => ({ address: to.address }))) || [];
  }
  toJSON() {
    return {
      id: this.id,
      txHash: this.hash,
      txStatus: this.status,
      fromAddress: this.from,
      toAddress: this.to,
      amount: this.amount,
      orderType: this.type,
      costFee: this.fee,
      tokenName: this.tokenName,
      tokenType: this.coinType,
      remark: this.note,
      txCreateTime: this.timestamp,
      tokenId: this.coinID,
      blockConfirmations: this.confirmations,
      blockHeight: this.blockHeight,
    };
  }

  /**
   *
   *
   * @param {Transaction} tx
   * @memberof Transaction
   */
  merge(tx) {
    this.status = tx.status;
    this.blockHeight = tx.blockHeight;
    this.confirmations = tx.confirmations;
    this.to = tx.to;
    this.from = tx.from;
    this.fee = tx.fee;
    this.amount = tx.amount;
    this.tokenName = tx.tokenName;
    this.timestamp = tx.timestamp;
  }
}

const compare = (a, b) => b.timestamp - a.timestamp;

class ETHTransaction extends Transaction {
  constructor(obj) {
    super(obj);
  }
}

class ERC20Transaction extends Transaction {
  constructor(obj) {
    super(obj);
  }
}

class BTCTransaction extends Transaction {
  constructor(obj) {
    super(obj);
  }
}

class TXSet {
  lastRefreshTimeStamp = 0;
  pageNum = 0;
  @observable hasMore = true;
  /**
   *
   *@type {Array.<Transaction>}
   * @memberof TXSet
   */
  @observable allTxs = [];
  /**
   *
   *@type {Array.<Transaction>}
   * @memberof TXSet
   */
  @observable inTxs = [];
  /**
   *
   *@type {Array.<Transaction>}
   * @memberof TXSet
   */
  @observable outTxs = [];
  /**
   *
   *@type {Array.<Transaction>}
   * @memberof TXSet
   */
  @observable failedTxs = [];

  constructor() {}
  /**
   *
   *
   * @param {Transaction} tx
   * @memberof TXSet
   */
  @action insert(tx) {
    //TODO: 优化性能
    let localTx = this.allTxs.find(t => t.id == tx.id);
    if (localTx) {
      localTx.merge(tx);
    } else {
      this.allTxs.push(tx);
      this.allTxs = this.allTxs.slice().sort(compare);
      if (tx.type == 1) {
        this.inTxs.push(tx);
        this.inTxs = this.inTxs.slice().sort(compare);
      } else if (tx.type == 2) {
        this.outTxs.push(tx);
        this.outTxs = this.outTxs.slice().sort(compare);
      }
      if (tx.status == 4) {
        this.failedTxs.push(tx);
        this.failedTxs = this.failedTxs.slice().sort(compare);
      }
    }
  }
  get(txid) {
    return this.allTxs.filter(tx => tx.id == txid);
  }
}

const globalTxs = new TXSet();
class WalletTxStore {
  pageNum = 1;
  @observable hasMore = true;
  @observable coins = new Map();
  @observable txs = new TXSet();

  static fetchTx = async txId => {
    // let txs = globalTxs.get(txId)
    let txs = [];
    // if (txs.length) {
    //     return txs
    // }
    try {
      let result = await DFNetwork.get(
        "/getOrderInfo",
        {
          orderId: txId,
        },
        HD_WEB_API
      );
      txs = [new Transaction(result.data)];
      // globalTxs.insert(txs[0])
    } catch (error) {}
    return txs;
  };
  fetchTx = async (txId, wallet) => {
    const txs = await WalletTxStore.fetchTx(txId);
    this.insertTxs(txs, wallet);
    return this.txs.get(txId);
  };

  /**
   * 相同的未确认交易
   * @return {Transaction}
   * @memberof WalletTxStore
   */
  similarTx = (to, coinID, amount) => {
    to = to.toLowerCase();
    return this.unconfirmedTxs(coinID).find(
      tx => tx.to && tx.to.toLowerCase() === to && tx.coinID == coinID && tx.amount == amount
    );
  };

  /**
   * 未确认的交易
   * @return {Array<Transaction>}
   * @memberof WalletTxStore
   */
  unconfirmedTxs = coinID => {
    return this.coinTxSet(coinID).allTxs.filter(
      tx => !tx.blockHeight && !tx.confirmations && tx.status != TX_STATUS_FAILED && tx.status != TX_STATUS_SUCCESS
    );
  };

  /**
   * 未确认的数量
   * @return {BigNumber}
   * @memberof WalletTxStore
   */
  unconfirmedAmount = coinID => {
    const amount = this.unconfirmedTxs(coinID).reduce((res, tx) => {
      if (tx.type == 1) {
        return res.plus(tx.amount + "");
      } else if (tx.type == 2) {
        return res.minus(tx.amount + "");
      }
      return res;
    }, new BigNumber(0));
    console.log("unconfirmedAmount", amount.toFixed());
    return amount;
  };

  /**
   * @return {TXSet}
   *
   * @memberof WalletTxStore
   */
  coinTxSet = coinID => {
    coinID = coinID + "";
    let coinTxSet = this.coins.get(coinID);
    if (!coinTxSet) {
      coinTxSet = new TXSet();
      this.coins.set(coinID, coinTxSet);
    }
    return coinTxSet;
  };
  fetchCoinTxs = async (coin, wallet, pageIndex = 1, useXpub = false) => {
    const pageSize = TX_PAGE_SIZE;
    const txSet = this.coinTxSet(coin.id);

    const params = {
      ...wallet.txListParams,
      ...coin.txListParams,
      pageSize,
      pageIndex,
    };

    let url = "/getTrade";
    if (useXpub) {
      url = "/getTradeV3";
      params["v3Address"] = wallet.extendedPublicKey.key;
      delete params.address;
    }

    const data = (await DFNetwork.get(url, params, HD_WEB_API)).data;
    if (!data) {
      return;
    }

    this.insertTxs(data, wallet);

    if (data.length < TX_PAGE_SIZE) {
      txSet.hasMore = false;
    }

    if (pageIndex == 1) {
      txSet.lastRefreshTimeStamp = new Date().getTime();
      if (data.length >= TX_PAGE_SIZE) {
        txSet.hasMore = true;
      }
    }

    txSet.pageNum = pageIndex;
  };
  loadMoreCoinTxs = async (coin, wallet) => {
    const txSet = this.coinTxSet(coin.id);
    await this.fetchCoinTxs(coin, wallet, txSet.pageNum + 1);
  };
  insertTxs(txs, wallet) {
    _.isArray(txs) &&
      txs.forEach(obj => {
        obj.tokenName = obj.tokenName.toUpperCase();
        let tx = _.isPlainObject(obj) ? new Transaction(obj) : obj;
        correctTx(tx, wallet);
        this.txs.insert(tx);
        this.coinTxSet(tx.coinID + "").insert(tx);
      });
  }
}
//订正数据: 去掉找零地址 和 调整交易方向
function correctTx(tx, wallet) {
  if (!tx || !wallet) {
    return;
  }

  switch (tx.coinType) {
    case COIN_TYPE_ETH: {
      if (!wallet.address || !tx.to) {
        return;
      }
      tx.type = tx.to.toUpperCase() === wallet.address.toUpperCase() ? TX_TYPE_IN : TX_TYPE_OUT;
      return;
    }
    case COIN_TYPE_BTC:
    case COIN_TYPE_USDT: {
      if (!wallet.addressesMap) {
        return;
      }
      for (let index = 0, length = tx.froms.length; index < length; index++) {
        const from = tx.froms[index];
        const own = !!wallet.addressesMap[from.address];
        if (own) {
          //只订正本地有的地址
          tx.type = TX_TYPE_OUT;
          break;
        }
        // if (index === length - 1) {
        //     tx.type = TX_TYPE_IN
        // }
      }
      tx.tos = tx.tos.slice().filter(to => {
        const own = !!wallet.addressesMap[to.address];
        if (tx.type === TX_TYPE_OUT && own) {
          //过滤掉不在左边但是是自己的地址
          return false;
        }

        const change = !!tx.froms.find(from => from.address === to.address);

        return !change;
      });
      break;
    }
    default:
      return;
  }
}

export { correctTx };

export default WalletTxStore;
