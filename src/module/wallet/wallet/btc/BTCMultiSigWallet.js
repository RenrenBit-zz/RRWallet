import MultiSigWallet, {
  MultiSigMember,
  MultiSigTransaction,
  MULTISIG_PENDING_TX_STATUS_APPROVAL,
  MULTISIG_PENDING_TX_STATUS_REJECT,
  BTCMultiSigTransaction,
  USDTMultiSigTransaction,
  MultisigCoin,
} from "../MultiSigWallet";
import {
  BTCTransaction,
  BTCOutput,
  OmniOutput,
  BTCUtxoSelector,
  BTCInput,
  BTCTransactionBuilder,
} from "./BTCTransaction";
import { NativeModules } from "react-native";
import network, { HD_MULTISIG_API } from "../../../common/network";
import AccountStore from "../../account/AccountStore";
import { ExtendedKey, BIP44Address } from "../Wallet";
import moment from "moment";
import { USDT, BTCCoin } from "../Coin";
import { observable, action, computed, reaction } from "mobx";
import _ from "lodash";
import { BigNumber } from "bignumber.js";
import { toFixedString } from "../../../../util/NumberUtil";
import i18n from "../../../i18n/i18n";
import AccountStorage from "../../account/AccountStorage";
import { varInt } from "../util/serialize";
import { BTCExtendedKey } from "../BTCWallet";
import opcode from "../util/opcode";
import {
  COIN_TYPE_USDT,
  COIN_TYPE_BTC,
  COIN_ID_BTC,
  NETWORK_ENV_TESTNET,
  COIN_ID_USDT,
} from "../../../../config/const";
import { installID } from "../../../../util/device";
import { USDTTransaction } from "./USDTTransaction";

const ERR_CODE_USED_UTXO = 100300;

const RRRNBitcoin = NativeModules.RRRNBitcoin;
const BITCOIN_SATOSHI = 100000000;
const USDT_TAG_SATOSHI = 546;
const P2PKH_INPUT_SIZE = 150;
const P2PKH_OUTPUT_SIZE = 40;
const P2PSH_OUTPUT_SIZE = 32;
const OMNI_PROPERTY_ID_USDT = "1f";
const OMNI_PROPERTY_ID_OMNI_TEST = "2";

class BTCMultiSigCoin extends BTCCoin {
  @observable available = 0;
  @observable frozen = 0;
}

class USDTMultiSigCoin extends USDT {
  @observable available = 0;
  @observable frozen = 0;
}
class BTCMultiSigWallet extends MultiSigWallet {
  BTC = new BTCMultiSigCoin();
  USDT = new USDTMultiSigCoin();
  /**
   *
   * @type {BIP44Address}
   * @memberof BTCMultiSigWallet
   */
  @observable.ref currentAddress = null;
  /**
   *
   * @type {Array<BIP44Address>}
   * @memberof BTCMultiSigWallet
   */
  @observable addresses = [];

  /**
   *
   * @type {Object<string, BIP44Address>}
   * @memberof BTCMultiSigWallet
   */
  addressesMap = {};

  /**
   *
   * @type {Array<BTCInput>}
   * @memberof BTCMultiSigWallet
   */
  @observable utxos = [];

  /**
   *
   * @type {MultiSigMember}
   * @readonly
   * @memberof BTCMultiSigWallet
   */
  @computed get self() {
    return this.members.find(member => member.extendedPublicKey.key == this.HDWallet.extendedPublicKey.key);
  }

  get defaultCoin() {
    return this.BTC;
  }

  get HDWallet() {
    return AccountStore.defaultHDAccount.BTCWallet;
  }

  get txListParams() {
    return {
      address: this.addresses.map(address => address.address),
    };
  }
  static create = async ({ walletName, nick, total, required, extendedPublicKey }) => {
    extendedPublicKey = new BTCExtendedKey(extendedPublicKey);
    total = parseInt(total);
    required = parseInt(required);

    await network.post("/multisigner/setImei", { imei: installID, publicKey: extendedPublicKey.key }, HD_MULTISIG_API);

    const { data } = await network.post(
      "/multisigner/createGroup",
      {
        addressChainType: 0,
        groupName: walletName,
        joinUserNum: total,
        minSignerUserNum: required,
        path: extendedPublicKey.path,
        publicKey: extendedPublicKey.key,
        userName: nick,
      },
      HD_MULTISIG_API
    );

    const timestamp = parseInt(Date.now() / 1000);

    const wallet = new BTCMultiSigWallet({
      id: data,
      name: walletName,
      required: required,
      total: total,
      members: [new MultiSigMember({ nick, extendedPublicKey, timestamp })],
    });

    AccountStore.defaultMultiSigAccount.wallets.splice(0, 0, wallet);
  };
  static join = async ({ walletID, nick, extendedPublicKey }) => {
    const walletInfo = (
      await network.post(
        "multisigner/getMultisigner",
        {
          groupKey: walletID,
        },
        HD_MULTISIG_API
      )
    ).data;

    const members =
      (walletInfo.groupDetailDtoList &&
        walletInfo.groupDetailDtoList.map(
          member =>
            new MultiSigMember({
              extendedPublicKey: new BTCExtendedKey({ key: member.publicKey, path: member.path }),
              nick: member.userName,
              timestamp: moment(member.gmtCreate).unix() * 1000,
            })
        )) ||
      [];

    const repeatedJoining = !!members.find(member => member.publicKey === extendedPublicKey.key);

    if (repeatedJoining) {
      return;
    }

    await network.post("/multisigner/setImei", { imei: installID, publicKey: extendedPublicKey.key }, HD_MULTISIG_API);

    await network.post(
      "/multisigner/join",
      {
        groupKey: walletID,
        path: extendedPublicKey.path,
        publicKey: extendedPublicKey.key,
        userName: nick,
      },
      HD_MULTISIG_API
    );

    const timestamp = Date.now();

    members.push(new MultiSigMember({ nick, extendedPublicKey, timestamp }));

    const wallet = new BTCMultiSigWallet({
      id: walletID,
      name: walletInfo.groupDto.groupName,
      required: parseInt(walletInfo.groupDto.minSignerUserNum),
      total: parseInt(walletInfo.groupDto.joinUserNum),
      members: members,
    });

    AccountStore.defaultMultiSigAccount.wallets.splice(0, 0, wallet);
  };
  static recover = async ({ walletID }) => {
    const walletInfo = (
      await network.post(
        "multisigner/getMultisigner",
        {
          groupKey: walletID,
        },
        HD_MULTISIG_API
      )
    ).data;

    const members =
      (walletInfo.groupDetailDtoList &&
        walletInfo.groupDetailDtoList.map(
          member =>
            new MultiSigMember({
              extendedPublicKey: new BTCExtendedKey({ key: member.publicKey, path: member.path }),
              nick: member.userName,
              timestamp: moment(member.gmtCreate).unix() * 1000,
            })
        )) ||
      [];

    const wallet = new BTCMultiSigWallet({
      id: walletID,
      name: walletInfo.groupDto.groupName,
      required: parseInt(walletInfo.groupDto.minSignerUserNum),
      total: parseInt(walletInfo.groupDto.joinUserNum),
      members: members,
    });

    await network.post(
      "/multisigner/setImei",
      { imei: installID, publicKey: wallet.HDWallet.extendedPublicKey.key },
      HD_MULTISIG_API
    );

    AccountStore.defaultMultiSigAccount.wallets.splice(0, 0, wallet);
    try {
      await AccountStore.defaultMultiSigAccount.update();
    } catch (error) {}
  };
  constructor(obj) {
    const { type, required, total, members } = obj;
    super(obj);
    this.type = 0;
    this.required = required;
    this.total = total;
    this.members = (members && members.map(member => new MultiSigMember(member))) || [];
    this.coins = [this.BTC, this.USDT];
    this.addresses = (obj.addresses && obj.addresses.map(address => new BIP44Address(address))) || [];
    this.addressesMap = this.addresses.reduce((map, address) => {
      map[address.address] = address;
      return map;
    }, {});

    this.currentAddress =
      (obj.currentAddress &&
        obj.currentAddress.address &&
        obj.currentAddress.path &&
        new BIP44Address(obj.currentAddress)) ||
      new BIP44Address({ address: this.address, path: this.path });

    obj.coins &&
      obj.coins.forEach(coin => {
        switch (coin.id) {
          case this.BTC.id:
            this.BTC.balance = coin.balance;
            break;
          case this.USDT.id:
            this.USDT.balance = coin.balance;
            break;
        }
      });
    this.startObserve();
  }

  startObserve = () => {
    super.startObserve();
    // return
    reaction(
      () =>
        toFixedString(
          this.utxos.reduce((res, utxo) => res.plus(utxo.satoshis), new BigNumber(0)).div(BITCOIN_SATOSHI),
          8
        ),
      balance => {
        this.BTC.available = balance;
      }
    );
  };

  calculateMaximumAmount = async feePerByte => {
    if (this.utxos.length == 0 && this.BTC.available != 0) {
      await this.fetchUtxos();
    }

    const tx = BTCTransaction.from(this.utxos, this.address, 0, this.address, feePerByte, true);
    const fee = toFixedString(new BigNumber(tx.fee).div(BITCOIN_SATOSHI));
    const maximum = BigNumber.max(new BigNumber(this.BTC.available + "").minus(fee), 0);

    return toFixedString(maximum);
  };
  estimateFee = ({ amount, feePerByte, showHand, coin }) => {
    if (amount === "") {
      amount = "0";
    }
    if (isNaN(parseFloat(amount))) {
      amount = "-1";
    }
    try {
      const tx =
        coin instanceof USDT
          ? USDTTransaction.from(
              this.utxos,
              this.address,
              this.address,
              amount,
              this.currentAddress.address,
              feePerByte,
              coin
            )
          : BTCTransaction.from(this.utxos, this.address, amount, this.currentAddress.address, feePerByte, showHand);
      return (tx && toFixedString(new BigNumber(tx.fee).div(BITCOIN_SATOSHI))) || "1";
    } catch (error) {
      return "-1";
    }
  };
  sendRawTransaction = async (to, amount, feePerByte, pwd, note, retry = true) => {
    if (this.utxos.length == 0 && this.BTC.available != 0) {
      await AccountStore.defaultMultiSigAccount.update();
    }

    if (this.utxos.length == 0) {
      throw new Error(i18n.t("wallet-send-utxos-empty"));
    }

    const maximum = await this.calculateMaximumAmount(feePerByte);
    const showHand = new BigNumber(maximum).isEqualTo(amount + "");
    const tx = BTCTransaction.from(this.utxos, to, amount, this.address, feePerByte, showHand);

    await tx.signInputs(
      async (rawSigHash, sigHashType, path) =>
        await RRRNBitcoin.signHash(
          this.HDWallet.id,
          rawSigHash,
          sigHashType,
          `${this.HDWallet.extendedPublicKey.path}/${path}`,
          pwd
        )
    );

    const sigHashes = tx.inputs.map(input => input.sigHash);
    const txContent = tx.serialized();
    const input = tx.inputs.map(input => ({
      address: input.address.address,
      path: input.address.path,
      orderCount: toFixedString(input.amount, 8),
    }));
    const output = tx.outputs.map(output => ({
      address: output.address,
      path: "",
      orderCount: toFixedString(new BigNumber(output.satoshis).div(BITCOIN_SATOSHI), 8),
    }));

    try {
      const id = (
        await network.post(
          "tx/createTx",
          {
            tokenType: COIN_TYPE_BTC,
            groupKey: this.id,
            publicKey: this.HDWallet.extendedPublicKey.key,
            signData: sigHashes,
            toAddress: to,
            orderCount: amount,
            remark: note,
            fee: tx.fee,
            txContent,
            input,
            output,
          },
          HD_MULTISIG_API
        )
      ).data;

      const multisigTx = new BTCMultiSigTransaction({
        id,
        wallet: this,
        creator: this.self.nick,
        from: input[0].address,
        to: to,
        rawData: txContent,
        inputs: input,
        remark: note,
        fee: tx.fee,
        actors: [
          {
            userName: this.self.nick,
            multisignerUserTxStatus: MULTISIG_PENDING_TX_STATUS_APPROVAL,
            gmtCreate: new Date().getTime(),
          },
        ],
      });

      this.utxos = _.xorWith(
        this.utxos.slice(),
        tx.inputs,
        (utxo, input) => utxo.txid === input.txid && utxo.vout === input.vout
      );

      AccountStore.defaultMultiSigAccount.pendingTxs.splice(0, 0, multisigTx);

      try {
        await AccountStore.defaultMultiSigAccount.update();
      } catch (error) {}
    } catch (error) {
      if (error.code === ERR_CODE_USED_UTXO && retry == true) {
        this.utxos = [];
        await this.sendRawTransaction(to, amount, feePerByte, pwd, note, false);
        return;
      }
      throw error;
    }
  };

  /**
   *
   * @type {MultiSigTransaction} tx
   * @memberof BTCMultiSigWallet
   */
  approvalTransaction = async (tx, rawData, inputs, pwd) => {
    const rawTx = BTCTransaction.deserialized(rawData, inputs, network.env);
    for (const input of rawTx.inputs) {
      const publicKeys = [];
      for (const member of this.members) {
        const [publicKey] = await member.extendedPublicKey.generatePublicKey([input.address.path]);
        publicKeys.push(publicKey);
      }
      input.redeemScript = multiSigRedeemScript(this.required, this.total, publicKeys);
    }
    await rawTx.signInputs(
      async (rawSigHash, sigHashType, path) =>
        await RRRNBitcoin.signHash(
          this.HDWallet.id,
          rawSigHash,
          sigHashType,
          `${this.HDWallet.extendedPublicKey.path}/${path}`,
          pwd
        )
    );

    const sigHashes = rawTx.inputs.map(input => input.sigHash);
    try {
      const { txHash } =
        (
          await network.post(
            "tx/sign",
            {
              multisignerUserTxStatus: 1,
              publicKey: this.HDWallet.extendedPublicKey.key,
              signData: sigHashes,
              txId: tx.id,
            },
            HD_MULTISIG_API
          )
        ).data || {};
      tx.actors.push({
        nick: this.self.nick,
        status: MULTISIG_PENDING_TX_STATUS_APPROVAL,
        timestamp: parseInt(Date.now() / 1000),
      });
      if (txHash) {
        tx.hash = txHash;
      }
    } catch (error) {}
  };
  rejectTransaction = async tx => {
    await network.post(
      "tx/sign",
      {
        multisignerUserTxStatus: 0,
        publicKey: this.HDWallet.extendedPublicKey.key,
        txId: tx.id,
      },
      HD_MULTISIG_API
    );
    tx.actors.push({
      nick: this.self.nick,
      status: MULTISIG_PENDING_TX_STATUS_REJECT,
      timestamp: parseInt(Date.now() / 1000),
    });
  };
  cancelTransaction = async tx => {
    await network.post(
      "tx/cancelTx",
      {
        groupKey: this.id,
        publicKey: this.HDWallet.extendedPublicKey.key,
        txId: tx.id,
      },
      HD_MULTISIG_API
    );
  };
  sendUSDTTransaction = async (to, amount, feePerByte, pwd, note, retry = true) => {
    if (this.utxos.length == 0 && this.BTC.available != 0) {
      await AccountStore.defaultMultiSigAccount.update();
    }

    const tx = USDTTransaction.from(
      this.utxos,
      this.address,
      to,
      amount,
      this.currentAddress.address,
      feePerByte,
      this.USDT
    );

    await tx.signInputs(
      async (rawSigHash, sigHashType, path) =>
        await RRRNBitcoin.signHash(
          this.HDWallet.id,
          rawSigHash,
          sigHashType,
          `${this.HDWallet.extendedPublicKey.path}/${path}`,
          pwd
        )
    );
    const sigHashes = tx.inputs.map(input => input.sigHash);
    const txContent = tx.serialized();
    const input = tx.inputs.map(input => ({
      address: input.address.address,
      path: input.address.path,
      orderCount: toFixedString(input.amount, 8),
    }));
    const output = tx.outputs.map(output => ({ address: output.address || "", path: "" }));

    try {
      const id = (
        await network.post(
          "tx/createTx",
          {
            tokenType: COIN_TYPE_USDT,
            groupKey: this.id,
            publicKey: this.HDWallet.extendedPublicKey.key,
            signData: sigHashes,
            toAddress: to,
            orderCount: amount,
            remark: note,
            fee: tx.fee,
            txContent,
            input,
            output,
          },
          HD_MULTISIG_API
        )
      ).data;

      const multisigTx = new USDTMultiSigTransaction({
        id,
        wallet: this,
        creator: this.self.nick,
        from: input[0].address,
        to: to,
        rawData: txContent,
        inputs: input,
        remark: note,
        fee: tx.fee,
        actors: [
          {
            userName: this.self.nick,
            multisignerUserTxStatus: MULTISIG_PENDING_TX_STATUS_APPROVAL,
            gmtCreate: new Date().getTime(),
          },
        ],
      });

      this.utxos = _.xorWith(
        this.utxos.slice(),
        tx.inputs,
        (utxo, input) => utxo.txid === input.txid && utxo.vout === input.vout
      );

      AccountStore.defaultMultiSigAccount.pendingTxs.splice(0, 0, multisigTx);

      try {
        await AccountStore.defaultMultiSigAccount.update();
      } catch (error) {}
    } catch (error) {
      if (error.code === ERR_CODE_USED_UTXO && retry == true) {
        this.utxos = [];
        await this.sendUSDTTransaction(to, amount, feePerByte, pwd, note, false);
        return;
      }
      throw error;
    }
  };
  isVaildPassword = pwd => AccountStore.defaultHDAccount.BTCWallet.isVaildPassword(pwd);
  /**
   *
   * @type {BTC_ADDRESS_TYPE_PKH|BTC_ADDRESS_TYPE_SH}
   * @memberof BTCWallet
   */
  @action generatorAddress = async type => {
    const data = (
      await network.post(
        "multisigner/createAddress",
        {
          groupKey: this.id,
        },
        HD_MULTISIG_API
      )
    ).data.addressDto;
    const address = new BIP44Address(data);
    await this.insertAddresses([address]);
    return this.addresses[0];
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
   * @param {BIP44Address|String} address
   * @memberof BTCWallet
   */
  @action setCurrentAddress = address => {
    if (address instanceof BIP44Address && address.address) {
      this.currentAddress = address;
      AccountStorage.update();
    }
  };
  @action syncAddress = (list = []) => {
    this.addresses = (list && list.map(address => new BIP44Address(address))) || [];
    this.addressesMap = this.addresses.reduce((map, address) => {
      map[address.address] = address;
      return map;
    }, {});
    if (_.isNil(this.address) && this.addresses.length > 0) {
      this.address = this.addresses[0].address;
      this.path = this.addresses[0].path;
      this.setCurrentAddress(this.addresses[0]);
    }
  };
  checkMaliciousAddress = address => this.HDWallet.checkMaliciousAddress(address);
}

function multiSigRedeemScript(m, n, publicKeys) {
  m = 0x50 + m;
  n = 0x50 + n;
  publicKeys = publicKeys.sort((a, b) => (a > b ? 1 : -1));
  return `${m.toString(16)}${publicKeys.map(pk => `${varInt(pk.length / 2)}${pk}`).join("")}${n.toString(16)}${
    opcode.OP_CHECKMULTISIG
  }`;
}

export default BTCMultiSigWallet;

export { BTCMultiSigCoin, USDTMultiSigCoin, multiSigRedeemScript };
async function _requestTransaction() {}

async function _boardTransaction() {}
