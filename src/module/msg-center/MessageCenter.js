import Network, { NOTIFY_API } from "../common/network";
import _ from "lodash";
import device from "../../util/device";
import { observable, autorun } from "mobx";
import { setApplicationIconBadgeNumber } from "../notification/notification";
import crypto from "../crypto/crypto";

const PUBLIC_KEY = `-----BEGIN PUBLIC KEY-----
MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQDCUaRAlRjx/ZCALaoKvUvH5Kgz
CvIvnyNqtHMOkZV56ZucJ7vraAkf8f2YRpVfW5bNaYWcZUmXI/oFrw3xbXoLtCDk
UOQ41bcZ72qV4SCagdQxGtCJc4fdnDRG3lXScFYHRFXfCNQUHptkc4vYxKDYr50+
WvHTm0+hTSogczsX2QIDAQAB
-----END PUBLIC KEY-----`;

const MSG_TYPE_ID = {
  all: 0,
  wallet: 1,
  multiSig: 14,
};

const defaultMessageCount = {
  [MSG_TYPE_ID.wallet]: 0,
  [MSG_TYPE_ID.multiSig]: 0,
};

export { MSG_TYPE_ID, defaultMessageCount };

class MessageCenter {
  @observable totalCount = 0;
  @observable countCategory = { ...defaultMessageCount };
  constructor() {
    this.pollingTask();
    autorun(() => {
      setApplicationIconBadgeNumber(this.totalCount);
    });
  }

  pollingTask = () => {
    setTimeout(() => {
      this.getMsgCount().finally(() => setTimeout(this.pollingTask, _.random(50, 70) * 1000));
    }, 1000);
  };

  doFetch = async (url, _param) => {
    const param = _param || {};
    param.imeinum = await device.installID();
    let encryptedData = {};
    const data = crypto.publicEncrypt(param, PUBLIC_KEY);

    encryptedData.secretKey = data.code;
    encryptedData.cipherText = data.encrypto;
    return await Network.get(url, encryptedData, NOTIFY_API);
  };

  getMsgCount = async () => {
    try {
      const msgCountRes = await this.doFetch("/notify/getNotifyCount.do");
      if (msgCountRes.isSuccess) {
        this.countCategory = msgCountRes.data;
      }
    } catch (e) {}

    let totalCount = 0;
    console.log(this.countCategory);
    _.forIn(this.countCategory, function(value, key) {
      totalCount += value;
    });
    this.totalCount = totalCount;

    return this.countCategory;
  };

  getMsgByType = async (msgType, pageNo = 1) => {
    let msgList = [];

    const param = {};
    if (msgType != MSG_TYPE_ID.all) {
      param.notifyType = msgType;
    }
    param.pageNo = pageNo;
    try {
      const ret = await this.doFetch("/notify/getNotifsByType.do", param);
      if (ret.isSuccess) {
        msgList = ret.data;
      }
    } catch (e) {}

    return msgList;
  };

  setAllReaded = async msgType => {
    let ret = true;
    try {
      const setRes = await this.doFetch("/notify/setAllReaded.do", msgType ? { notifyType: msgType } : {});
      ret = setRes.isSuccess;
      this.totalCount = 0;
    } catch (e) {
      ret = false;
    }
    return ret;
  };

  setSingleReaded = async msgId => {
    let setRes = true;
    try {
      const ret = await this.doFetch("/notify/setNotifyReaded.do", { notifyId: msgId });
      setRes = ret.isSuccess;
      this.totalCount = Math.max(this.totalCount - 1, 0);
    } catch (e) {
      setRes = false;
    }
    return setRes;
  };
}
export default new MessageCenter();
