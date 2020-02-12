import { Alert, Platform } from "react-native";
import Sentry from "react-native-sentry";
import logger from "./logger";
import AppInfo from "../module/app/AppInfo";
import { LOGGER_MODULE_WALLET } from "../config/const";

const ERROR_DEFAULT_TITLE = "错误";
const ERROR_DEFAULT_MESSAGE = "网络错误, 请稍后再试";

const ERROR_DOMAIN_ETH = "ERROR_DOMAIN_ETH";
const ERROR_DOMAIN_BTC = "ERROR_DOMAIN_BTC";
const ERROR_DOMAIN_BUSINESS = "ERROR_DOMAIN_BUSINESS";
const ERROR_DOMAIN_COMMON = "ERROR_DOMAIN_COMMON";

const ERROR_MAP = {
  ERROR_DOMAIN_ETH: {
    "-32010": "余额不足",
  },
  ERROR_DOMAIN_BTC: {
    "-6": "余额不足",
  },
  ERROR_DOMAIN_BUSINESS: {},
  ERROR_DOMAIN_COMMON: {},
};

/**
 *
 *
 * @param {*} error
 * @param { ERROR_DOMAIN_ETH|ERROR_DOMAIN_BTC|ERROR_DOMAIN_BUSINESS|ERROR_DOMAIN_COMMON } domain
 */
function errorHandler(error, defaultContent = ERROR_DEFAULT_MESSAGE) {
  logger.error(error, LOGGER_MODULE_WALLET);

  let code = error.code + "";
  let content;
  let message = error.message && error.message.toLowerCase();

  if (Platform.OS === "android") {
    message = error.toString();
    message = message && message.toLowerCase();
  }

  if (message.indexOf("the internet connection appears to be offline") > -1) {
    content = "网络连接失败, 请检查网络是否畅通或稍后再试";
  } else if (message.indexOf("request timed out") > -1) {
    if (message.indexOf("blockchain.info") > -1) {
      content = "blockchain连接超时, 请稍后再试";
    } else {
      content = "连接超时, 请检查网络是否畅通或稍后再试";
    }
  } else if (message.indexOf("same hash was already imported") > -1) {
    content = "链上已经存在相同的交易";
  } else if (message.indexOf("余额") > -1) {
    content = "余额不足";
  } else if (message.indexOf("timeout") > -1 || message.indexOf("超时") > -1) {
    content = "连接超时, 请检查网络是否畅通或稍后再试";
  } else if (message.indexOf("余额") > -1) {
    content = "余额不足";
  }

  if (content) {
    Alert.alert(ERROR_DEFAULT_TITLE, content);
  } else if (message) {
    Alert.alert(ERROR_DEFAULT_TITLE, message);
  } else {
    alert(error);
  }
}

export default errorHandler;
export { ERROR_DOMAIN_ETH, ERROR_DOMAIN_BTC, ERROR_DOMAIN_BUSINESS, ERROR_DOMAIN_COMMON };
