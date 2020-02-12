import { BigNumber } from "bignumber.js";
import Wallet from "./Wallet";
import network, { HD_ETH_API, NOTIFY_API } from "../../common/network";
import { ETC } from "./Coin";
import ETCRPCProvider from "./ETCRPCProvider";
import { NativeModules, Platform } from "react-native";
import { ETHEREUM_CHAINID_ETC_MAINNET, WALLET_TYPE_ETC } from "../../../config/const";
import ethereum from "../../../util/ethereum";
import { toFixedString } from "../../../util/NumberUtil";
import { installID } from "../../../util/device";
import _ from "lodash";

const RRRNEthereum = NativeModules.RRRNEthereum;

class ETCWallet extends Wallet {
  type = WALLET_TYPE_ETC;
  ETC = new ETC();
  get defaultCoin() {
    return this.ETC;
  }
  constructor(obj = {}) {
    super(obj);
    this.coins = _.compact(
      (obj.coins &&
        obj.coins.map(coin => {
          if (coin && coin.name && coin.name.toUpperCase() == "ETC" && !coin.contract) {
            this.ETC.balance = coin.balance;
            if (coin.hasOwnProperty("display")) {
              this.ETC.display = coin.display;
            }
            return this.ETC;
          }
          return null;
        })) || [this.ETC]
    );
  }
  sendETCTransaction = async (to, amount, gasPrice, gasLimit, note, pwd) => {
    const origAmount = amount;
    amount = ethereum.toWei(amount) + "";
    gasPrice = ethereum.toWei(gasPrice, "gwei") + "";
    gasLimit = toFixedString(gasLimit, 0);
    const nonce = await ETCRPCProvider.ethGetTransactionCount(this.address, "pending");
    const result = await RRRNEthereum.sendContractTransaction(
      this.id,
      this.address,
      to,
      amount,
      "",
      gasLimit,
      gasPrice,
      Platform.select({ ios: nonce, android: nonce + "" }),
      ETHEREUM_CHAINID_ETC_MAINNET,
      false,
      pwd
    );
    const broadcastResult = await _broadcastETCTx(this.address, to, origAmount, note, result.rawData);
    if (_.isPlainObject(broadcastResult)) {
      const txHash = broadcastResult.data;
      if (txHash) {
        return txHash;
      } else {
        throw new Error(broadcastResult.errMsg);
      }
    } else {
      throw new Error("节点服务异常");
    }
  };
  async isVaildPassword(pwd) {
    if (!pwd || pwd.length == 0) {
      throw new Error("密码不能为空");
    }
    return await RRRNEthereum.isVaildPassword(this.id, pwd);
  }
  checkMaliciousAddress = async address => {
    try {
      const result = await network.get(
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
  decodePaymentScheme(scheme) {
    let address;
    let type = WALLET_TYPE_ETC;

    if (scheme.length == 42) {
      address = scheme;
      return { address, type };
    }

    return {};
  }
}

function _broadcastETCTx(from, to, amount, note, rawData) {
  return network.postJson(
    "/addTrade",
    {
      walletAddress: from,
      fromAddress: from,
      toAddress: to,
      orderCount: amount,
      postData: rawData,
      txCreateTime: new Date().getTime(),
      tokenType: 4,
      batchStatus: 0,
      remark: note,
    },
    HD_ETH_API
  );
}

export default ETCWallet;
