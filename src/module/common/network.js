import { NativeModules, DeviceEventEmitter, Platform } from "react-native";
import {
  RPC_URL_CHANGE,
  NETWORK_ENV_TESTNET,
  NETWORK_ENV_MAINNET,
  LOGGER_MODULE_NETWORK,
  I18N_LANGUAGE_CHANGE_NOTIFICATION,
  BASEURL_MAINNET_BITRENREN,
} from "../../config/const";
import logger from "../../util/logger";
import _ from "lodash";
import i18n from "../i18n/i18n";
import device from "../../util/device";
import AppInfo from "../app/AppInfo";

const NONE_API = "";
const WALLET_API = "wallet";
const HD_WEB_API = "hd-web";
const HD_BTC_API = "hd-btc";
const HD_ETH_API = "hd-eth";
const HD_MULTISIG_API = "hd_mulisigner";
const NOTIFY_API = "notify";
const EGG_API = "egg";
const EXCHANGE_RATE_API = "exchangerate";

const ETH_RPC_URL = "https://gateway.bitrenren.com/eth_node/";
const ETC_RPC_URL = "https://gateway.bitrenren.com/etc_node/";
const BTC_RPC_URL = "https://gatewayohio.bitrenren.com/btc_node/";
const USDT_RPC_URL = "https://gatewayohio.bitrenren.com/usdt_node/";

let networkEnv;
const RRRNNetwork = NativeModules.RRRNNetwork;
const defaultHeaders = {
  "client-version": `${AppInfo.jsVersion}`,
  "x-client-version": `${AppInfo.jsVersion}`,
  "accept-language": i18n.locale,
  "device-name": device.name,
  "user-agent": `RRWallet/${AppInfo.version}`,
};
if (Platform.OS === "ios") {
  defaultHeaders["x-idfa"] = device.idfa;
}
device.deviceID().then(id => {
  defaultHeaders["device-id"] = id;
});

DeviceEventEmitter.addListener(I18N_LANGUAGE_CHANGE_NOTIFICATION, () => {
  defaultHeaders["accept-language"] = i18n.locale;
});

class DFNetwork {
  get env() {
    return networkEnv;
  }
  set env(e) {
    networkEnv = e;
  }
  ETHRpcUrl = ETH_RPC_URL;
  ETCRpcUrl = ETC_RPC_URL;
  BTCRpcUrl = BTC_RPC_URL;
  USDTRpcUrl = USDT_RPC_URL;

  setRPCURLs = _.debounce(async (eth = ETH_RPC_URL, btc = BTC_RPC_URL, usdt = USDT_RPC_URL, etc = ETC_RPC_URL) => {
    this.ETHRpcUrl = eth;
    this.BTCRpcUrl = btc;
    this.USDTRpcUrl = usdt;
    this.ETCRpcUrl = etc;
    await NativeModules.RRRNNetwork.setRpcUrls(eth, btc, usdt);
    DeviceEventEmitter.emit(RPC_URL_CHANGE);
  }, 2000);

  fetchRPCURLs = async () => {
    try {
      let result = (await this.get("/getRouteUrl", {}, HD_WEB_API)).data;
      if (!result.ethUrl.length || !result.btcUrl.length || !result.usdtUrl.length) {
        return;
      }
      await this.setRPCURLs(result.ethUrl, result.btcUrl, result.usdtUrl, result.etcUrl);
    } catch (error) {}
  };
  get networkType() {
    return this.env == NETWORK_ENV_TESTNET ? "test" : "main";
  }
  baseURL(type = WALLET_API) {
    return BASEURL_MAINNET_BITRENREN + "/" + type;
  }
  get pingURL() {
    return BASEURL_MAINNET_BITRENREN + "/ping";
  }
  fetch(url, params, type = WALLET_API) {
    const relative = url;
    const path = url.split("?")[0];
    url = this.absoluteURL(url, type);
    return new Promise(async (resolve, reject) => {
      try {
        const result = await NativeModules.RRRNNetwork.fetch(url, params);
        handleResult(result, url);
        resolve(result);
      } catch (error) {
        logger.breadcrumbs(relative, LOGGER_MODULE_NETWORK);
        reject(error);
      }
    });
  }
  fetchV2(url, params, type = WALLET_API) {
    const relative = url;
    const path = url.split("?")[0];
    url = this.absoluteURL(url, type);
    return new Promise(async (resolve, reject) => {
      try {
        const result = await NativeModules.RRRNNetwork.fetch(url, params);
        handleResultV2(result, url);
        resolve(result);
      } catch (error) {
        logger.breadcrumbs(relative, LOGGER_MODULE_NETWORK);
        reject(error);
      }
    });
  }

  /**
   *
   * @param {*} url 请求地址 相对路径或绝对路径  相对路径时会使用默认域名
   * @param {*} _param 请求参数  若要对请求配置进行修改  此时请求参数需要包含在_param.param中 如 {headers: {'Content-Type':'text/plain'}, param: {}}
   */
  async get(url, params = {}, type = WALLET_API, headers = {}) {
    // headers = Object.assign(defaultHeaders, headers)
    headers = Object.assign({}, defaultHeaders, headers);
    let tmp = [];
    for (let n in params) {
      tmp.push(n + "=" + encodeURIComponent(params[n]));
      const lower = n.toLowerCase();
      if ((lower === "imeinum" || lower === "deviceid") && !params[n]) {
        if (__DEV__) {
          console.error(`警告:${n}为空, ${url}`);
        } else {
          logger.error("deviceID为空", LOGGER_MODULE_NETWORK, url);
        }
      }
    }

    let queryString = tmp.join("&");

    if (queryString.length > 0) {
      if (url.indexOf("?") > -1) {
        url = url + "&" + queryString;
      } else {
        url = url + "?" + queryString;
      }
    }

    headers = Platform.select({
      ios: {
        __headers__: headers,
      },
      android: headers,
    });
    return this.fetch(url, headers, type);
  }

  /**
   *
   * @param {*} url
   * @param {*} data 传入的参数
   * @param {*} _param 请求参数
   * @deprecated
   */
  async post_deprecated(url, data, headers, type = WALLET_API) {
    return this.postJson(url, data, type, headers);
  }
  post = async (url, body, type = WALLET_API, headers) => {
    const relative = url;
    url = this.absoluteURL(url, type);
    headers = Object.assign({}, defaultHeaders, headers);

    try {
      const result = await NativeModules.RRRNNetwork.post(url, body, headers);
      handleResult(result, url);
      return result;
    } catch (error) {
      logger.breadcrumbs(relative, LOGGER_MODULE_NETWORK);
      throw error;
    }
  };
  postV2 = async (url, body, type = WALLET_API, headers) => {
    const relative = url;
    url = this.absoluteURL(url, type);
    headers = Object.assign({}, defaultHeaders, headers);

    try {
      const result = await NativeModules.RRRNNetwork.post(url, body, headers);
      handleResultV2(result, url);
      return result;
    } catch (error) {
      if (error.message && error.message.startsWith("Error Domain=")) {
        error.nativeMessage = error.message;
        error.message = i18n.common("network-unavailable");
      }
      logger.breadcrumbs(relative, LOGGER_MODULE_NETWORK);
      throw error;
    }
  };
  async jsonrpc(url, method, params = [], headers) {
    return (await NativeModules.RRRNNetwork.jsonrpc(url, method, params, headers)).result;
  }

  async postJson(url, param, type = WALLET_API, headers = {}) {
    url = this.absoluteURL(url, type);
    headers = Object.assign({}, defaultHeaders, headers);

    const result = await NativeModules.RRRNNetwork.post(url, param, headers);
    interceptSessionExpireDate(result, url);
    return result;
  }
  absoluteURL(relative, type = WALLET_API) {
    let url = relative;
    if (url.indexOf("http") != 0) {
      if (relative[0] != "/") {
        relative = `/${relative}`;
      }

      url = this.baseURL(type) + relative;
    }
    return url;
  }
}

function interceptSessionExpireDate(result, url) {
  if (!_.isPlainObject(result) || (!result.message && !result.errMsg)) {
    return;
  }
  if (result.message && !result.errMsg) {
    result.errMsg = result.message;
  }

  if (!result.message && result.errMsg) {
    result.message = result.errMsg;
  }

  return false;
}

function handleResult(result, url) {
  if (_.isNil(result)) {
    throw defaultError();
  }

  interceptSessionExpireDate(result, url);

  if (
    _.isPlainObject(result) &&
    result.hasOwnProperty("isSuccess") &&
    (result.isSuccess === false || result.isSuccess === "false") &&
    result.errMsg
  ) {
    if (!result.message) {
      result.message = result.errMsg;
    }

    throw generateError(result);
  }

  if (_.isString(result) && result.startsWith("<")) {
    throw defaultError();
  }
  return true;
}

function handleResultV2(result, url) {
  if (_.isNil(result) || (_.isString(result) && result.length === 0)) {
    throw defaultError();
  }

  interceptSessionExpireDate(result, url);

  if (_.isPlainObject(result)) {
    let isSuccess = true;

    if (
      (result.hasOwnProperty("isSuccess") && (result.isSuccess === false || result.isSuccess === "false")) || //钱包
      (result.hasOwnProperty("success") && result.success === false) || //借贷
      (result.hasOwnProperty("code") &&
        result.hasOwnProperty("message") &&
        result.code !== 200 &&
        result.message !== "SUCCESS")
    ) {
      isSuccess = false;
    }

    if (isSuccess) {
      return true;
    }

    throw generateError(result);
  }

  if (_.isString(result) && result.startsWith("<")) {
    throw defaultError();
  }
  return true;
}

function defaultError() {
  const error = new Error(i18n.t("common-network-unavailable"));
  return error;
}

function generateError(result) {
  if (!result.message) {
    if (result.errMsg) {
      result.message = result.errMsg;
    }
  }

  if (!result.hasOwnProperty("code")) {
    if (result.errorCode) {
      result.code = result.errorCode;
    } else if (result.errCode) {
      result.code = result.errCode;
    }
  }

  if (result.message && result.message.startsWith("Error Domain=")) {
    result.nativeMessage = result.message;
    result.message = i18n.commom("network-unavailable");
  }
  const error = new Error(result.message);
  Object.assign(error, result);
  return error;
}

export {
  NONE_API,
  WALLET_API,
  NOTIFY_API,
  EGG_API,
  EXCHANGE_RATE_API,
  HD_WEB_API,
  HD_BTC_API,
  HD_ETH_API,
  HD_MULTISIG_API,
};

export default new DFNetwork();
