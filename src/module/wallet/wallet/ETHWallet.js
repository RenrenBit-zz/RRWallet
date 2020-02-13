import { NativeModules, Platform } from "react-native";
import { DeviceEventEmitter } from "react-native";
import DFNetwork, { NOTIFY_API, WALLET_API, HD_ETH_API, HD_WEB_API } from "../../common/network";
import Device, { installID } from "../../../util/device";
import ethereum, { unitMap } from "../../../util/ethereum";
import { BigNumber } from "bignumber.js";
import Wallet from "./Wallet";
import Iban from "../../../util/iban";
import { toFixedNumber, toFixedLocaleString, toFixedString } from "../../../util/NumberUtil";
import {
  WALLET_SOURCE_PK,
  WALLET_SOURCE_MW,
  WALLET_SOURCE_KS,
  SCHEMA_ETH,
  RPC_URL_CHANGE,
  COIN_ID_BTC,
  COIN_ID_ETH,
  COIN_ID_ETC,
  NETWORK_ENV_MAINNET,
  ETHEREUM_CHAINID_MAINNET,
  ETHEREUM_CHAINID_TESTNET,
  ETHEREUM_CHAINID_ETC_MAINNET,
} from "../../../config/const";
import { ETH, ERC20Coin, ETC } from "./Coin";
import { isString, isNumber, isArray, isNil } from "lodash";
import ETHRPCProvider from "./ETHRPCProvider";
import _ from "lodash";

const ETH_BLOCK_GASLIMIT = 5000000;
const ETH_ERC20_TX_MIN_GASLIMIT = 50000;
const RRRNEthereum = NativeModules.RRRNEthereum;

class ETHWallet extends Wallet {
  lastNonce = -1;
  ETH = new ETH();
  get defaultCoin() {
    return this.coins[0];
  }
  constructor(obj = {}) {
    super(obj);
    this.type = Wallet.WALLET_TYPE_ETH;
    this.coins = _.compact(
      (obj.coins &&
        obj.coins.map(coin => {
          if (coin && coin.name && coin.name.toUpperCase() == "ETH" && !coin.contract) {
            this.ETH.balance = coin.balance;
            if (coin.hasOwnProperty("display")) {
              this.ETH.display = coin.display;
            }
            return this.ETH;
          }
          if (coin) {
            return new ERC20Coin(coin);
          }
          return null;
        })) || [this.ETH]
    );
    this.startObserve();
  }
  static create(name, pwd) {
    return new Promise(async (resolve, reject) => {
      let obj = await RRRNEthereum.createRandomAccount(name, pwd, "");
      let mnemonic = obj.mnemonic;
      let act = new ETHWallet({ ...obj, source: WALLET_SOURCE_MW });
      act.name = name;
      await _createWallet(act);
      act.save();
      resolve({ act, mnemonic });
      //DeviceEventEmitter.emit('accountOnChange')
    });
  }
  static import(mnemonic, pwd, name = "", fetch = false) {
    return new Promise(async (resolve, reject) => {
      try {
        let obj = await RRRNEthereum.importAccount(mnemonic, pwd, name);
        let act = new ETHWallet({ ...obj, source: WALLET_SOURCE_MW });
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
        let obj = await RRRNEthereum.importPrivatekey(pk, pwd, name);
        let act = new ETHWallet({ ...obj, source: WALLET_SOURCE_PK });
        act.name = name;
        act.pwdnote = note;
        act.isBackup = true;
        await _createWallet(act);
        act.save();
        DeviceEventEmitter.emit("accountOnChange");
        resolve(act);
      } catch (error) {
        reject(error);
      }
    });
  }
  static importKS(ks, pwd, name, note) {
    return new Promise(async (resolve, reject) => {
      try {
        let obj = await RRRNEthereum.importKeystore(ks, pwd, name);
        let act = new ETHWallet({ ...obj, source: WALLET_SOURCE_KS });
        act.name = name;
        act.pwdnote = note;
        act.isBackup = true;
        await _createWallet(act);
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
      let obj = await RRRNEthereum.backupMnemonic(mnemonic);
      let act = new ETHWallet(obj);
      DeviceEventEmitter.emit("accountOnChange");
      resolve(act);
    });
  }
  drop = text => {
    _deleteWallet(this);
  };
  async isVaildPassword(pwd) {
    if (!pwd || pwd.length == 0) {
      throw new Error("密码不能为空");
    }
    return await RRRNEthereum.isVaildPassword(this.id, pwd);
  }
  sendTransaction(
    to,
    amount,
    gasPrice,
    gasLimit,
    note,
    pwd,
    broadcast = true,
    nonce = -1,
    chainID = ethereumChainID()
  ) {
    to = to.toLowerCase();
    return new Promise(async (resolve, reject) => {
      try {
        if (nonce == -1) {
          nonce = await ETHRPCProvider.ethGetTransactionCount(this.address, "pending");
          nonce = Math.max(nonce, this.lastNonce + 1);
        }
        const result = await this.sendContractTransaction(
          to,
          ethereum.toWei(amount),
          null,
          gasPrice,
          gasLimit,
          pwd,
          false,
          nonce
        );
        // const result = await RRRNEthereum.sendTranscation(this.id, this.address, to, gasLimit, ethereum.toWei(gasPrice, 'gwei'), ethereum.toWei(amount), nonce, pwd)
        const broadcastResult = await _broadcastTx(this.address, to, amount, result.fee, note, result.rawData);
        if (_.isPlainObject(broadcastResult)) {
          const txHash = broadcastResult.data;
          if (txHash) {
            if (_.isString(result.nonce)) {
              result.nonce = parseInt(result.nonce);
            }
            if (result.hasOwnProperty("nonce") && _.isNumber(result.nonce)) {
              this.lastNonce = parseInt(result.nonce);
            }
            resolve(txHash);
          } else {
            reject(broadcastResult);
          }
        } else {
          reject(new Error("节点服务异常"));
        }
      } catch (error) {
        error.name = "ETHTransaction";
        reject(error);
      }
    });
  }
  sendERC20Transaction(
    to,
    contract,
    amount,
    gasPrice,
    gasLimit,
    note,
    pwd,
    broadcast = true,
    nonce = -1,
    batchStatus = 0
  ) {
    to = to.toLowerCase();
    contract = contract.toLowerCase();
    return new Promise(async (resolve, reject) => {
      if (nonce == -1) {
        nonce = await ETHRPCProvider.ethGetTransactionCount(this.address, "pending");
        nonce = Math.max(nonce, this.lastNonce + 1);
      }

      let correctAmount = new BigNumber(amount);
      let token = this.findERC20Token(contract);
      if (token && token.decimals) {
        let unit = new BigNumber(10).pow(18 - token.decimals);
        correctAmount = correctAmount.div(unit);
      }
      const hexAmount = ethereum.toWei(correctAmount).toString(16);
      const transferABI = ethereum.encodeContractABI(ethereum.transferMethodID, [to, hexAmount]);
      try {
        const result = await this.sendContractTransaction(
          contract,
          "0",
          transferABI,
          gasPrice,
          gasLimit,
          pwd,
          false,
          nonce
        );

        const broadcastResult = await _broadcastERC20Tx(
          contract,
          this.address,
          to,
          amount,
          result.fee,
          note,
          result.rawData
        );

        if (_.isPlainObject(broadcastResult)) {
          const txHash = broadcastResult.data;
          if (txHash) {
            if (_.isString(result.nonce)) {
              result.nonce = parseInt(result.nonce);
            }
            if (result.hasOwnProperty("nonce") && _.isNumber(result.nonce)) {
              this.lastNonce = result.nonce;
            }
            resolve(txHash);
          } else {
            reject(broadcastResult);
          }
        } else {
          reject(new Error("节点服务异常"));
        }
      } catch (error) {
        error.name = "ETHTransaction";
        reject(error);
      }
    });
  }
  async sendContractTransaction(
    contract,
    amount,
    data,
    gasPrice,
    gasLimit,
    pwd,
    broadcast = true,
    nonce = -1,
    chainID = ethereumChainID()
  ) {
    contract = contract.toLowerCase();
    gasPrice = toFixedString(gasPrice);
    gasLimit = toFixedString(gasLimit);
    const fee = toFixedString(ethereum.toEther(new BigNumber(gasLimit).multipliedBy(gasPrice), "gwei"));
    data = data || "";
    if (nonce == -1) {
      nonce = await ETHRPCProvider.ethGetTransactionCount(this.address, "pending");
      nonce = Math.max(nonce, this.lastNonce + 1);
    }
    const result = await RRRNEthereum.sendContractTransaction(
      this.id,
      this.address,
      contract,
      amount + "",
      data,
      gasLimit,
      ethereum.toWei(gasPrice, "gwei"),
      Platform.select({ ios: nonce, android: nonce + "" }),
      chainID,
      broadcast,
      pwd
    );
    if (broadcast) {
      if (_.isString(result.nonce)) {
        result.nonce = parseInt(result.nonce);
      }
      if (result.hasOwnProperty("nonce") && _.isNumber(result.nonce)) {
        this.lastNonce = result.nonce;
      }
    }
    result.fee = fee;
    return result;
  }
  async sendBatchTransaction(coin, targets, gasPrice, perGasLimit, pwd, callback) {
    targets = JSON.parse(JSON.stringify(targets));

    const token = coin;
    if (!token || !isNumber(token.decimals)) {
      throw new Error("token不存在");
    }

    if (!isArray(targets) || targets.length === 0) {
      throw new Error("targets参数格式不正确");
    }

    gasPrice = new BigNumber(gasPrice + "");
    perGasLimit = new BigNumber(perGasLimit + "");

    if (perGasLimit.isLessThan(ETH_ERC20_TX_MIN_GASLIMIT)) {
      throw new Error(
        `单笔转账的gasLimit需大于${ETH_ERC20_TX_MIN_GASLIMIT}, 为保证交易正常, 请尽可能多的设置gasLimit, 未使用的gas将会在交易结束后退回`
      );
    }

    const tos = [];
    const amounts = [];

    let totalAmount = new BigNumber(0);

    for (const { address, amount } of targets) {
      if (isNil(address) || isNil(amount)) {
        throw new Error("targets含有非法输入");
      }

      if (!isString(address) || !isString(amount)) {
        throw new Error("非法输入,地址和数量必须为字符串");
      }

      let isStartsWith0x = _.startsWith(address, "0x"); //address.indexOf('0x') == 0;
      if ((isStartsWith0x && address.length != 42) || (!isStartsWith0x && address.length != 40)) {
        throw new Error(`含有非法地址${address}`);
      }

      tos.push(address);
      const amountBigNumber = new BigNumber(amount);
      amounts.push(new BigNumber(amountBigNumber));
      totalAmount = totalAmount.plus(amountBigNumber);
    }

    const balanceBigNumber = new BigNumber(token.balance + "");
    if (totalAmount.isGreaterThan(balanceBigNumber)) {
      throw new Error(
        `${token.name}余额不足, 转账数量:${toFixedLocaleString(totalAmount)}}, 余额:${toFixedLocaleString(
          balanceBigNumber
        )}`
      );
    }

    //两次approve 一次测试转账, 所以需要预留3笔gas数量
    const totalGasBignumber = ethereum.toEther(perGasLimit.multipliedBy(tos.length + 3).multipliedBy(gasPrice), "gwei");
    if (totalGasBignumber.isGreaterThan(this.ETH.balance + "")) {
      throw new Error(
        `ETH余额不足, 矿工费:${toFixedLocaleString(totalGasBignumber)}}, 余额:${toFixedLocaleString(this.ETH.balance)}`
      );
    }

    if (token instanceof ETH) {
      if (totalGasBignumber.plus(totalAmount).isGreaterThan(token.balance + "")) {
        throw new Error(
          `ETH余额不足, 矿工费:${toFixedLocaleString(totalGasBignumber)}}, 转账数量:${toFixedLocaleString(
            totalAmount
          )} 余额:${toFixedLocaleString(balanceBigNumber)}`
        );
      }
    }

    Device.keepScreenOn(true);
    try {
      if (coin instanceof ETH) {
        await this.sendETHBatchTransactionContract(token, tos, amounts, gasPrice, perGasLimit, pwd, callback);
      } else if (await this.shouldUseBatchTransactionContract(token.contract)) {
        let skinTestSuccess = false;
        try {
          //尝试调用单笔批量合约, 如果合约执行失败则降级到looping, 其他异常则中断发币
          await this.sendERC20BatchTransactionContract(
            token,
            _.take(tos, 1),
            _.take(amounts, 1),
            gasPrice,
            perGasLimit,
            pwd,
            callback
          );
          skinTestSuccess = true;
        } catch (error) {
          if (error.message === "批量发币合约执行失败") {
            await this.sendERC20BatchTransactionLooping(token, tos, amounts, gasPrice, perGasLimit, pwd, callback);
          } else {
            throw error;
          }
        }

        if (!skinTestSuccess) {
          return;
        }

        tos.splice(0, 1);
        amounts.splice(0, 1);
        await this.sendERC20BatchTransactionContract(token, tos, amounts, gasPrice, perGasLimit, pwd, result => {
          _.isFunction(callback) &&
            callback({
              ...result,
              from: result.from + 1,
            });
        });
      } else {
        await this.sendERC20BatchTransactionLooping(token, tos, amounts, gasPrice, perGasLimit, pwd, callback);
      }
    } catch (error) {
      throw error;
    }
    Device.keepScreenOn(false);
  }
  async shouldUseBatchTransactionContract(contract) {
    const allowance = await ethereum.allowance(contract, this.address, ethereum.ERC20BatchTransferContract);
    return !new BigNumber(allowance).isNaN();
  }
  async sendETHBatchTransactionContract(coin, tos, amounts, gasPrice, perGasLimit, pwd, callback) {
    const totalGasBigNumber = perGasLimit.multipliedBy(tos.length);

    const hexAmounts = [];
    const totalAmount = amounts.reduce((res, amount) => {
      const bg = new BigNumber(ethereum.toDecimalsWei(coin.decimals, amount));
      if (!bg.isInteger()) {
        throw new Error(
          `非法输入 ${amount}, ${coin.name}的decimals等于${coin.decimals}, 所以小数位数不能大于${coin.decimals}`
        );
      }

      hexAmounts.push(bg.toString(16));
      return res.plus(bg);
    }, new BigNumber(0));

    let nonce = -1;

    const fragmentCount = totalGasBigNumber.div(ETH_BLOCK_GASLIMIT).integerValue(BigNumber.ROUND_CEIL);
    const fragmentSize = Math.ceil(tos.length / fragmentCount.toFixed());

    for (let seq = 0; seq < fragmentCount; seq++) {
      const tosFragment = tos.splice(0, fragmentSize);
      const amountsFragment = hexAmounts.splice(0, fragmentSize);
      const gasLimitFragment = new BigNumber(perGasLimit).multipliedBy(amountsFragment.length).toFixed();

      const batchTransferData = ethereum.encodeContractABI(ethereum.ETHBatchTransferMethodID, [
        tosFragment,
        amountsFragment,
      ]);
      const result = await this.sendContractTransaction(
        ethereum.ETHBatchTransferContract,
        totalAmount.toFixed(),
        batchTransferData,
        gasPrice,
        gasLimitFragment,
        pwd,
        true,
        nonce
      );

      try {
        const totalAmountFragment = ethereum
          .toEther(
            amountsFragment.reduce((res, hexAmount) => res.plus(hexAmount), new BigNumber(0)),
            "wei"
          )
          .toFixed();
        _insertOrder(this, result.txHash, ethereum.ETHBatchTransferContract, totalAmountFragment, "", 1);
      } catch (error) {
        console.warn(error);
      }

      nonce = await ethereum.syncNonce(this.address, result.nonce + 1, 20);

      const { status } = await ethereum.syncTxReceipt(result.txHash);
      if (new BigNumber(status, 16).toNumber() === 0) {
        throw new Error("批量发币合约执行失败");
      }
      _.isFunction(callback) &&
        callback({
          txHash: result.txHash,
          nonce: result.nonce,
          from: seq * fragmentSize,
          length: tosFragment.length,
        });
    }
  }
  async sendERC20BatchTransactionContract(coin, tos, amounts, gasPrice, perGasLimit, pwd, callback) {
    const contract = coin.contract;

    const totalGasBigNumber = perGasLimit.multipliedBy(tos.length);

    const hexAmounts = [];
    const totalAmount = amounts.reduce((res, amount) => {
      const bg = new BigNumber(ethereum.toDecimalsWei(coin.decimals, amount));
      if (!bg.isInteger()) {
        throw new Error(
          `非法输入 ${amount}, ${coin.name}的decimals等于${coin.decimals}, 所以小数位数不能大于${coin.decimals}`
        );
      }
      hexAmounts.push(bg.toString(16));
      return res.plus(bg);
    }, new BigNumber(0));

    const approveData = ethereum.encodeContractABI(ethereum.approveMethodID, [
      ethereum.ERC20BatchTransferContract,
      totalAmount.toString(16),
    ]);
    const approveResult = await this.sendContractTransaction(contract, "0", approveData, gasPrice, perGasLimit, pwd);

    let nonce = await ethereum.syncNonce(this.address, approveResult.nonce + 1, 20);

    const approveStatus = (await ethereum.syncTxReceipt(approveResult.txHash)).status;
    if (new BigNumber(approveStatus, 16).toNumber() === 0) {
      throw new Error("批量发币合约执行失败");
    }

    const allowance = await ethereum.allowance(contract, this.address, ethereum.ERC20BatchTransferContract);
    if (new BigNumber(allowance, 16).isLessThan(totalAmount)) {
      throw new Error("allowance数量少于发币数");
    }

    const fragmentCount = totalGasBigNumber.div(ETH_BLOCK_GASLIMIT).integerValue(BigNumber.ROUND_CEIL);
    const fragmentSize = Math.ceil(tos.length / fragmentCount.toFixed());

    for (let seq = 0; seq < fragmentCount; seq++) {
      const tosFragment = tos.splice(0, fragmentSize);
      const amountsFragment = hexAmounts.splice(0, fragmentSize);
      const gasLimitFragment = new BigNumber(perGasLimit).multipliedBy(amountsFragment.length).toFixed();

      const batchTransferData = ethereum.encodeContractABI(ethereum.ERC20BatchTransferMethodID, [
        contract,
        tosFragment,
        amountsFragment,
      ]);
      const result = await this.sendContractTransaction(
        ethereum.ERC20BatchTransferContract,
        "0",
        batchTransferData,
        gasPrice,
        gasLimitFragment,
        pwd,
        true,
        nonce
      );

      try {
        const scale = new BigNumber(10).pow(18 - coin.decimals);
        const totalAmountFragment = ethereum
          .toEther(
            amountsFragment.reduce((res, hexAmount) => res.plus(hexAmount, 16), new BigNumber(0)),
            "wei"
          )
          .multipliedBy(scale)
          .toFixed();
        _insertErc20Order(
          this,
          result.txHash,
          ethereum.ERC20BatchTransferContract,
          contract,
          totalAmountFragment,
          "",
          1
        );
      } catch (error) {
        console.warn(error);
      }

      nonce = await ethereum.syncNonce(this.address, result.nonce + 1, 20);

      const { status } = await ethereum.syncTxReceipt(result.txHash);
      if (new BigNumber(status, 16).toNumber() === 0) {
        throw new Error("批量发币合约执行失败");
      }
      _.isFunction(callback) &&
        callback({
          txHash: result.txHash,
          nonce: result.nonce,
          from: seq * fragmentSize,
          length: tosFragment.length,
        });
    }
  }
  sendERC20BatchTransactionLooping = async (coin, tos, amounts, gasPrice, perGasLimit, pwd, callback) => {
    const contract = coin.contract;
    let nonce = -1;

    for (let seq = 0; seq < tos.length; seq++) {
      const to = tos[seq];
      const amount = amounts[seq];
      const hexAmount = ethereum.toDecimalsWei(coin.decimals, new BigNumber(amount)).toString(16);
      if (hexAmount.indexOf(".") != -1) {
        throw new Error(
          `非法输入 ${amount}, ${coin.name}的decimals等于${coin.decimals}, 所以小数位数不能大于${coin.decimals}`
        );
      }
      const transferABI = ethereum.encodeContractABI(ethereum.transferMethodID, [to, hexAmount]);
      const result = await this.sendContractTransaction(
        contract,
        "0",
        transferABI,
        gasPrice,
        perGasLimit,
        pwd,
        true,
        nonce
      );

      try {
        _insertErc20Order(this, result.txHash, to, contract, amount, "", 1);
      } catch (error) {
        console.warn(error);
      }

      _.isFunction(callback) &&
        callback({
          txHash: result.txHash,
          nonce: result.nonce,
          from: seq,
          length: 1,
        });

      if (seq < tos.length - 1) {
        nonce = await ethereum.syncNonce(this.address, result.nonce + 1, 20);
      }
    }
  };
  async getKeyStore(pwd) {
    if (!pwd || pwd.length == 0) {
      throw new Error("密码不能为空");
    }
    let result = await RRRNEthereum.exportKeyStore(this.id, pwd);
    if (Platform.OS === "android") {
      result = result.keyStore;
    }
    return result;
  }
  async exportPrivateKey(pwd) {
    if (!pwd || pwd.length == 0) {
      throw new Error("密码不能为空");
    }
    let result = await RRRNEthereum.exportPrivateKey(this.id, pwd);
    if (Platform.OS === "android") {
      result = result.privateKey;
    }
    return result;
  }
  async exportMnemonic(pwd) {
    if (!pwd || pwd.length == 0) {
      throw new Error("密码不能为空");
    }
    let result = await RRRNEthereum.exportMnemonic(this.id, pwd);
    if (Platform.OS === "android") {
      result = result.mnemonic;
    }
    return result;
  }
  updateERC20s = coins => {
    this.coins = _.compact([
      this.ETH,
      ...coins.map(coin => {
        if (
          coin.tokenDecimals > 0 &&
          _.isString(coin.tokenName) &&
          coin.tokenName.length > 0 &&
          _.isString(coin.address) &&
          coin.address.length > 0
        )
          return new ERC20Coin({
            id: coin.tokenId,
            name: coin.tokenName,
            icon: coin.icon,
            balance: coin.balance,
            contract: coin.address,
            decimals: coin.tokenDecimals,
          });
      }),
    ]);
    this.sortCoins();
  };
  findERC20Token = contract => {
    return this.coins.find((el, i) => el.contract && el.contract === contract);
  };
  paymentScheme(amount = 0, coin) {
    let iban = Iban.fromAddress(this.address).toString();
    return `iban:${iban}?token=${coin.name}${amount >= 0 ? `&amount=${amount}` : ""}`;
    // return 'iban:' + iban + '?amount=' + amount + '&token=' + coin.name
  }
  decodePaymentScheme(scheme) {
    let address;
    let token;
    let amount;
    let type = Wallet.WALLET_TYPE_ETH;

    if (scheme.indexOf(SCHEMA_ETH) == 0) {
      let split = scheme.split("?");
      address = split[0].substring(5);
      address = new Iban(address).checksumAddress() || "";
      if (address.length == 40 && address.indexOf("0x") != 0) {
        address = `0x${address}`;
      }
      let query = split[1].split("&").reduce((query, item) => {
        let itemSplit = item.split("=");
        if (itemSplit.length === 2) {
          query[itemSplit[0]] = itemSplit[1];
        }
        return query;
      }, {});

      token = query["token"];
      const coin = this.findCoin(token);
      amount = query["amount"];
      return { address, token, coin, amount, type };
    }

    if (scheme.length == 42) {
      address = scheme;
      return { address, type };
    }

    return {};
  }
  checkMaliciousAddress = async address => {
    try {
      const result = await DFNetwork.get(
        "check/addressCheck.do",
        {
          address: address,
          imeiNum: installID,
          coin: "ETH",
        },
        NOTIFY_API
      );
      return result.data;
    } catch (error) {
      return true;
    }
  };
  sortCoins = () => {
    this.coins = this.coins.sort((a, b) => {
      if (a.id == COIN_ID_ETH && b.id == COIN_ID_ETC) {
        return -1;
      }
      if (a.id == COIN_ID_ETC && b.id == COIN_ID_ETH) {
        return 1;
      }
      if (a.id == COIN_ID_ETH || a.id == COIN_ID_ETC) {
        return -1;
      }
      if (b.id == COIN_ID_ETH || b.id == COIN_ID_ETC) {
        return 1;
      }

      if (a.totalPrice || b.totalPrice) {
        return b.totalPrice - a.totalPrice;
      }
      return b.balance - a.balance;
    });
  };
}

function _createWallet(act, fetch) {
  return DFNetwork.get(fetch ? "/wallet/createWallet.do" : "/wallet/createWalletOnly.do", {
    name: act.name,
    walletAddress: act.address,
    imeiNum: installID,
    tokenType: 1,
  });
}

function _deleteWallet(act) {
  return DFNetwork.get("/wallet/deleteWallet.do", {
    walletAddress: act.address,
    imeiNum: installID,
    tokenType: 1,
  });
}

function _broadcastTx(from, to, amount, fee, note, rawData) {
  return DFNetwork.postJson(
    "/addTrade",
    {
      walletAddress: from,
      fromAddress: from,
      toAddress: to,
      orderCount: amount,
      postData: rawData,
      txCreateTime: new Date().getTime(),
      tokenType: 1,
      batchStatus: 0,
      remark: note,
      costFee: fee,
    },
    HD_ETH_API
  );
}

function _broadcastERC20Tx(contract, from, to, amount, fee, note, rawData) {
  return DFNetwork.postJson(
    "/addTrade",
    {
      tokenAddress: contract,
      walletAddress: from,
      fromAddress: from,
      toAddress: to,
      orderCount: amount,
      postData: rawData,
      txCreateTime: new Date().getTime(),
      tokenType: 1,
      batchStatus: 0,
      remark: note,
      costFee: fee,
    },
    HD_ETH_API
  );
}

function _insertOrder(wallet, txHash, to, amount, note = "", batchStatus = 0) {
  return DFNetwork.postJson("/wallet/insertOrder.do", {
    walletAddress: wallet.address,
    txHash: txHash,
    fromAddress: wallet.address,
    toAddress: to,
    orderCount: amount,
    txCreateTime: new Date().getTime(),
    tokenType: 1,
    batchStatus: batchStatus,
    remark: note,
  });
}

function _insertErc20Order(wallet, txHash, to, contract, amount, note = "", batchStatus = 0) {
  return DFNetwork.postJson("/wallet/insertOrder.do", {
    walletAddress: wallet.address,
    tokenAddress: contract,
    txHash: txHash,
    fromAddress: wallet.address,
    toAddress: to,
    orderCount: amount,
    txCreateTime: new Date().getTime(),
    tokenType: 1,
    batchStatus: batchStatus,
    remark: note,
  });
}

function ethereumChainID() {
  return DFNetwork.env === NETWORK_ENV_MAINNET ? ETHEREUM_CHAINID_MAINNET : ETHEREUM_CHAINID_TESTNET;
}

function* reverseKeys(arr) {
  var key = arr.length - 1;

  while (key >= 0) {
    yield key;
    key -= 1;
  }
}

export default ETHWallet;
