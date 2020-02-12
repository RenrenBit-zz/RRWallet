import network, { EGG_API } from "../common/network";
import { installID } from "../../util/device";
import AccountStore from "../wallet/account/AccountStore";
import { computed } from "mobx";
import Moment from "moment";
import BigNumber from "bignumber.js";
import { ERC20Coin, ETH } from "../wallet/wallet/Coin";

class MultiSender {
  @computed get coins() {
    return AccountStore.defaultHDAccount.ETHWallet.coins;
  }
  createTask = coinID => {
    const ETHWallet = AccountStore.defaultHDAccount.ETHWallet;
    const coin = AccountStore.defaultHDAccount.findCoin(coinID);
    const param = {
      tokenId: coin.id,
      tokenName: coin.name,
      tokenAddress: coin.contract || "",
      walletAddress: ETHWallet.address,
      deviceId: installID,
    };
    return network.get("/qunfabao/addTask", param, EGG_API);
  };
  deleteTask = taskID => {
    return network.get("/qunfabao/removeTask", { taskUUID: taskID, deviceId: installID }, EGG_API);
  };
  updateTask = (tx, recipients, taskID) => {
    return network.postV2(
      "/qunfabao/addRecord",
      {
        recipientIds: recipients.map(recipient => recipient.id).join(","),
        taskUUID: taskID,
        nonce: tx.nonce,
        txHash: tx.txHash,
      },
      EGG_API
    );
  };
  postRecipients = async (recipients, taskID = "") => {
    const recipientsStr = JSON.stringify(recipients);
    const result = await network.postV2(
      "/qunfabao/addRecipientList",
      {
        recipientList: recipientsStr,
        taskUUID: taskID,
        deviceId: installID,
      },
      EGG_API
    );
    if (result.data && result.data.affectedRows == recipients.length) {
      const array = recipients.map((recipient, index) => {
        return {
          name: recipient[0].trim(),
          address: recipient[1].trim(),
          amount: recipient[2].trim(),
          phone: (recipient[3] || "").trim(),
          uuid: result.data.uuid,
          id: result.data.insertId + index,
        };
      });
      return array;
    } else {
      throw new Error(i18n.t("qunfabao-upload-error"));
    }
  };
  getRecipients = async (recipientID, taskID) => {
    const param = {
      uuid: recipientID,
      deviceId: installID,
    };

    if (taskID) {
      param.taskUUID = taskID;
    }

    const result = await network.get("/qunfabao/getRecipientList", param, EGG_API);
    const recipients = result.data;
    if (recipients && recipients.length > 0) {
      recipients.sort((a, b) => {
        if (a.txhash) {
          return 1;
        } else {
          return -1;
        }
      });

      return recipients;
    }
  };
  fetchTaskDetail = async taskID => {
    const result = await network.get("/qunfabao/getRecordList", { taskUUID: taskID, deviceId: installID }, EGG_API);
    if (result.data) {
      if (result.data.length > 0) {
        for (const item of result.data) {
          item.creatDate = Moment(item.gmt_create).format("YYYY-MM-DD HH:mm:ss");
        }
      }
      return result.data;
    }
  };
  fetchTaskList = async () => {
    const result = await network.get("/qunfabao/getTaskList", { deviceId: installID }, EGG_API);
    if (result.data) {
      if (result.data.length > 0) {
        for (const item of result.data) {
          item.creatDate = Moment(item.gmt_create).format("YYYY-MM-DD");
        }
      }
      return result.data;
    }
  };

  isSupportedCoin = coin => coin instanceof ETH || coin instanceof ERC20Coin;
}

export default new MultiSender();
