import { Sentry } from "react-native-sentry";
import { installID } from "./device";

import { LOGGER_MODULE_COMMON, LOGGER_MODULE_LOG } from "../config/const";
import _, { isObject, isString, isNumber, isError, isPlainObject } from "lodash";
import { NativeModules } from "react-native";

const RRRNAnalysis = NativeModules.RRRNAnalysis;

const PROXY_IMPRECATION = /^stark:\/\//;
const LOG_TYPE = {
  ERROR: "error",
  BREADCRUMBS: "breadcrumbs",
  EVENT: "event",
  COUNTER: "counter",
};

class Logger {
  start = async () => {
    if (__DEV__) {
      return;
    }
    const AppInfo = require("../module/app/AppInfo").default;
    try {
      if (AppInfo.sentryDSN.length == 0) {
        return;
      }
      Sentry.config(AppInfo.sentryDSN).install();
      Sentry.setTagsContext({
        environment: AppInfo.env,
      });
      Sentry.setDist(AppInfo.jsVersion);

      setTimeout(() => {
        Sentry.setUserContext({
          id: installID,
          username: nick,
          extra: { uid },
        });
      }, 800);
    } catch (error) {}
  };
  setProxy = imprecation => {
    if (this.proxy && (this.proxy.readyState === WebSocket.OPEN || this.proxy.readyState === WebSocket.CONNECTING)) {
      return;
    }
    if (!imprecation || !PROXY_IMPRECATION.test(imprecation)) {
      return;
    }

    const url = imprecation.replace(PROXY_IMPRECATION, "ws://");
    this.proxy = new WebSocket(url);
  };
  forwardToProxy = (event, type) => {
    if (!this.proxy || this.proxy.readyState !== WebSocket.OPEN) {
      return;
    }

    const message = { event, type };
    const str = JSON.stringify(message);

    this.proxy.send(str);
  };
  breadcrumbs = (msg, module = LOGGER_MODULE_COMMON, extra = {}) => {
    if ((!isString(msg) && !isNumber(msg)) || !isString(module) || !isObject(extra)) {
      console.warn("Logger.breadcrumbs: invaild params");
      return;
    }

    if (__DEV__) {
      console.warn(msg);
    }

    try {
      const breadcrumb = {
        message: msg,
        category: module,
        data: extra,
      };
      Sentry.captureBreadcrumb(breadcrumb);
      this.forwardToProxy(breadcrumb, LOG_TYPE.BREADCRUMBS);
    } catch (error) {
      this.error(error, LOGGER_MODULE_LOG);
    }
  };
  error = (err, module = LOGGER_MODULE_COMMON, name) => {
    if (isString(err)) {
      err = new Error(err);
    }

    if (!isError(err) || !isString(module)) {
      console.warn("Logger.error: invaild params");
      return;
    }

    if (name) {
      err.name = name;
    }

    try {
      Sentry.captureException(err, {
        logger: module,
      });
      this.forwardToProxy(error, LOG_TYPE.ERROR);
    } catch (error) {
      try {
        Sentry.captureException(new Error("error serialization failed"), {
          logger: LOGGER_MODULE_LOG,
        });
      } catch (error) {}
    }
  };

  /**
   * 普通埋点, 只记数量
   *
   * @param {String} id 事件id
   * @param {Object} attr 参数
   * @memberof Logger
   */
  event = (id, attr = {}) => {
    try {
      if (!isString(id) || !isPlainObject(attr)) {
        return;
      }

      id = id.trim();

      if (id.length <= 0) {
        return;
      }

      attr = _.reduce(
        attr,
        (result, value, key) => {
          if (isString(value)) {
            value = value.trim();
            if (value.length > 0) {
              result[key] = value.trim();
            }
          } else if (isNumber(value)) {
            result[key] = value + "";
          } else if (__DEV__) {
            throw new Error("value必须为字符串或者数字");
          }
          return result;
        },
        {}
      );
      RRRNAnalysis.event(id, attr);
      this.forwardToProxy(
        {
          id,
          attribute: attr,
        },
        LOG_TYPE.EVENT
      );
    } catch (error) {
      this.error(error, LOGGER_MODULE_LOG, "event");
    }
  };

  /**
   *
   * 计算埋点, 对count进行数据分析
   *
   * @param {String} id 事件id
   * @param {Object} attr 参数
   * @param {Number|String} count 计算值
   * @memberof Logger
   */
  counter = (id, count, attr = {}) => {
    if (!isString(id) || !isPlainObject(attr)) {
      return;
    }

    id = id.trim();

    if (id.length <= 0) {
      return;
    }

    attr = _.reduce(
      attr,
      (result, value, key) => {
        if (isString(value)) {
          value = value.trim();
          if (value.length > 0) {
            result[key] = value.trim();
          }
        } else if (isNumber(value)) {
          result[key] = value + "";
        } else if (__DEV__) {
          throw new Error("value必须为字符串或者数字");
        }
        return result;
      },
      {}
    );

    if (!isString(count) && !isNumber(count)) {
      return;
    }

    count = parseInt(count);

    if (_.isNaN(count)) {
      return;
    }

    count += "";

    RRRNAnalysis.counter(id, attr, count);
    this.forwardToProxy(
      {
        id,
        value: count,
        attribute: attr,
      },
      LOG_TYPE.COUNTER
    );
  };
}

export default new Logger();
