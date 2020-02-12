import Wallet, { ExtendedKey } from "./Wallet";
import { observable, computed } from "mobx";
import network, { HD_MULTISIG_API, HD_WEB_API } from "../../common/network";
import moment from "moment";
import WalletTxStore, { Transaction, TX_TYPE_OUT } from "./WalletTxStore";
import { BTCExtendedKey, BIP44Address } from "./BTCWallet";
import { BTCTransaction, BTCInput } from "./btc/BTCTransaction";
import { getScriptPubKey, decodeOmniPlayload } from "./util/serialize";
import BigNumber from "bignumber.js";
import { toFixedLocaleString, toFixedString } from "../../../util/NumberUtil";
import opcode from "./util/opcode";
import _ from "lodash";
import { COIN_TYPE_BTC, COIN_TYPE_USDT, COIN_ID_BTC, COIN_ID_USDT, TX_PAGE_SIZE } from "../../../config/const";
import Coin from "./Coin";

const BITCOIN_SATOSHI = 100000000;
class MultisigCoin extends Coin {
  @observable available = 0;
  @observable frozen = 0;
}

class MultiSigWallet extends Wallet {
  @computed get isCompleted() {
    return this.members.length === this.total;
  }

  /**
   * 是否被删除
   *
   * @memberof MultiSigWallet
   */
  hasDelete = false;

  /**
   *
   * @type {Array.<MultiSigMember>}
   * @memberof MultiSigWallet
   */
  @observable members = [];

  /**
   * 发起者
   *
   * @type {MultiSigMember}
   * @readonly
   * @memberof MultiSigWallet
   */
  @computed get founder() {
    return _.minBy(this.members.slice(), member => member.timestamp);
  }
  type;

  /**
   * 至少需要的私钥数量
   *
   * @type {number}
   * @memberof MultiSigWallet
   */
  required;

  /**
   * 全部私钥数量
   *
   * @type {number}
   * @memberof MultiSigWallet
   */
  total;

  /**
   *
   * @type {MultiSigMember}
   * @readonly
   * @memberof MultiSigWallet
   */

  txStore = new MultiSigWalletTxStore();
  get self() {}
  sendRawTransaction = async (to, amount, pwd) => {};
  approvalTransaction = async tx => {};
  rejectTransaction = async tx => {};
  cancelTransaction = async tx => {};
  updateWalletInfo = async () => {
    try {
      const walletInfo = (
        await network.post(
          "multisigner/getMultisigner",
          {
            groupKey: this.id,
          },
          HD_MULTISIG_API
        )
      ).data;

      this.members =
        (walletInfo.groupDetailDtoList &&
          walletInfo.groupDetailDtoList
            .map(
              member =>
                new MultiSigMember({
                  extendedPublicKey: new BTCExtendedKey({ key: member.publicKey, path: member.path }),
                  nick: member.userName,
                  timestamp: moment(member.gmtCreate).unix(),
                })
            )
            .sort((a, b) => a.timestamp - b.timestamp)) ||
        [];
    } catch (error) {
      if (error.message === "钱包不存在") {
        this.hasDelete = true;
      }
    }
  };
}

class MultiSigMember {
  nick;
  /**
   *
   * @type {ExtendedKey}
   * @memberof MultiSigMember
   */
  extendedPublicKey;
  timestamp;
  constructor({ id, nick, extendedPublicKey, timestamp }) {
    this.nick = nick;
    this.extendedPublicKey = new BTCExtendedKey(extendedPublicKey);
    this.timestamp = timestamp;
  }
}

const MULTISIG_PENDING_TX_STATUS_WAITING = 0;
const MULTISIG_PENDING_TX_STATUS_APPROVAL = 1;
const MULTISIG_PENDING_TX_STATUS_REJECT = 2;
const MULTISIG_PENDING_TX_STATUS_CANCEL = 3;
class MultiSigTransaction extends Transaction {
  id;

  /**
   *
   * @type {MultiSigWallet}
   * @memberof MultiSigTransaction
   */
  wallet;
  from;
  to;
  amount;
  fee;
  timestamp;
  rawData;
  creator;
  inputs;
  @observable cancel = false;
  /**
   *
   * @type {MULTISIG_PENDING_TX_STATUS_WAITING|MULTISIG_PENDING_TX_STATUS_APPROVAL|MULTISIG_PENDING_TX_STATUS_REJECT}
   * @readonly
   * @memberof MultiSigTransaction
   */
  @computed get authStatus() {
    const rejects = this.actors.filter(actor => actor.status === MULTISIG_PENDING_TX_STATUS_REJECT).length;
    const approvals = this.actors.filter(actor => actor.status === MULTISIG_PENDING_TX_STATUS_APPROVAL).length;

    if (approvals >= this.wallet.required) {
      return MULTISIG_PENDING_TX_STATUS_APPROVAL;
    }

    if (rejects > this.wallet.total - this.wallet.required) {
      return MULTISIG_PENDING_TX_STATUS_REJECT;
    }

    return this.cancel ? MULTISIG_PENDING_TX_STATUS_CANCEL : MULTISIG_PENDING_TX_STATUS_WAITING;
  }
  /**
   *
   * @type {MULTISIG_PENDING_TX_STATUS_WAITING|MULTISIG_PENDING_TX_STATUS_APPROVAL|MULTISIG_PENDING_TX_STATUS_REJECT}
   * @readonly
   * @memberof MultiSigTransaction
   */
  @computed get ownAuthStatus() {
    const own = this.actors.find(actor => actor.nick === this.wallet.self.nick);
    if (!own) {
      return MULTISIG_PENDING_TX_STATUS_WAITING;
    }

    return own.status;
  }

  @observable actors = [];

  constructor({ id, wallet, rawData, creator, inputs, actors }) {
    super(arguments[0]);
    this.type = TX_TYPE_OUT;
    this.wallet = wallet;
    (this.rawData = rawData), (this.creator = creator);
    this.inputs = inputs && inputs.map(input => new BIP44Address(input));
    this.actors =
      actors &&
      actors.map(actor => ({
        nick: actor.userName,
        status:
          actor.multisignerUserTxStatus == 1 ? MULTISIG_PENDING_TX_STATUS_APPROVAL : MULTISIG_PENDING_TX_STATUS_REJECT,
        timestamp: moment(actor.gmtCreate).unix(),
      }));
    this.timestamp = Math.min(...this.actors.map(actor => actor.timestamp));
  }
  merge(tx) {
    super.merge(tx);
    this.actors = tx.actors;
  }
}

const SEQUENCE_BYTE_LENGTH = 4;
const SIG_BYTE_LENGTH = 72;
const PUBKEY_BYTE_LENGTH = 34;
const OUTPOINT_BYTE_LENGTH = 39;
const REST_BYTE_LENGTH = 6;
class BTCMultisigInput extends BTCInput {
  /**
   * required
   *
   * @readonly
   * @memberof BTCMultisigInput
   */
  get m() {
    return parseInt(this.redeemScript.substr(0, 2), 16) - 0x50;
  }

  /**
   * total
   *
   * @readonly
   * @memberof BTCMultisigInput
   */
  get n() {
    return parseInt(this.redeemScript.substr(this.redeemScript.length - 4, 2), 16) - 0x50;
  }

  get size() {
    return Math.ceil(
      OUTPOINT_BYTE_LENGTH +
        SIG_BYTE_LENGTH * this.m +
        PUBKEY_BYTE_LENGTH * this.n +
        SEQUENCE_BYTE_LENGTH +
        REST_BYTE_LENGTH
    );
  }
}
class BTCMultiSigTransaction extends MultiSigTransaction {
  tokenName = "BTC";
  coinType = COIN_TYPE_BTC;
  coinID = COIN_ID_BTC;

  constructor(obj = {}) {
    super(obj);
    const tx = BTCTransaction.deserialized(this.rawData, this.inputs, network.env);
    const scriptPubKey = getScriptPubKey(this.to);
    const destOutput = tx.outputs.find(output => output.scriptPubKey === scriptPubKey);
    this.amount = toFixedString(new BigNumber(destOutput.satoshis).div(BITCOIN_SATOSHI), 8);
  }
}

class USDTMultiSigTransaction extends MultiSigTransaction {
  tokenName = "USDT";
  coinType = COIN_TYPE_USDT;
  coinID = COIN_ID_USDT;

  constructor(obj = {}) {
    super(obj);
    const tx = BTCTransaction.deserialized(this.rawData, this.inputs, network.env);

    const destOutput = tx.outputs.find(output => output.scriptPubKey.startsWith(`${opcode.OP_RETURN}`));
    const { amount } = decodeOmniPlayload(destOutput.scriptPubKey);
    this.amount = toFixedString(new BigNumber(amount).div(BITCOIN_SATOSHI), 8);
  }
}

class MultiSigWalletTxStore extends WalletTxStore {
  fetchCoinTxs = async (coin, wallet, pageIndex = 1) => {
    const pageSize = TX_PAGE_SIZE;
    const txSet = this.coinTxSet(coin.id);

    const params = {
      ...wallet.txListParams,
      ...coin.txListParams,
      pageSize,
      pageIndex,
    };

    const data = (await network.get("/getTrade", params, HD_WEB_API)).data;
    if (!data) {
      return;
    }

    const outTxs = data.filter(tx => tx.orderType === TX_TYPE_OUT);
    const txHashes = outTxs.map(tx => tx.txHash);
    if (txHashes.length > 0) {
      try {
        const multiSigTxs = (
          await network.post(
            "tx/getTxByTxHash",
            {
              txHashList: txHashes,
            },
            HD_MULTISIG_API
          )
        ).data;

        multiSigTxs.txDtoList.forEach(tx => {
          const outTx = outTxs.find(origTx => origTx.txHash === tx.txHash);
          const actors = multiSigTxs.txDetailDtoList.filter(actor => actor.txId === tx.id) || [];
          const obj = Object.assign(_.cloneDeep(outTx), {
            rawData: tx.txContent,
            inputs: tx.input,
            creator: tx.createUserName,
            actors,
            wallet,
          });
          let multiSigTx;
          switch (tx.tokenType) {
            case COIN_TYPE_BTC:
              multiSigTx = new BTCMultiSigTransaction(obj);
              break;
            case COIN_TYPE_USDT:
              multiSigTx = new USDTMultiSigTransaction(obj);
              break;
          }

          for (let i = 0; i < data.length; i++) {
            const origTx = data[i];
            if (origTx.txHash === tx.txHash) {
              data.splice(i, 1, multiSigTx);
              break;
            }
          }
        });
      } catch (error) {}
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
}
export default MultiSigWallet;

export {
  MultisigCoin,
  MultiSigMember,
  MultiSigTransaction,
  BTCMultisigInput,
  BTCMultiSigTransaction,
  USDTMultiSigTransaction,
  MultiSigWalletTxStore,
  MULTISIG_PENDING_TX_STATUS_WAITING,
  MULTISIG_PENDING_TX_STATUS_APPROVAL,
  MULTISIG_PENDING_TX_STATUS_REJECT,
  MULTISIG_PENDING_TX_STATUS_CANCEL,
};
