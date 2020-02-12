import { APP_SCHEME, LOGGER_MODULE_CORE } from "../config/const";
import { isString } from "lodash";
import { Navigation } from "react-native-navigation";
import logger from "./logger";
import _ from "lodash";
import { DeviceEventEmitter } from "react-native";

const SWITCH_TAB_KEY = "_switchTab";
class URLRouter {
  /**
   *
   *
   * @param {string} scheme
   * @memberof URLRouter
   */
  open(scheme, context) {
    if (!this.canOpen(scheme, context)) {
      return false;
    }
    if (scheme.indexOf(APP_SCHEME) == 0) {
      scheme = scheme.split(APP_SCHEME)[1];
      let split = scheme.split("?");
      let host = split[0];
      let query =
        split.length > 1
          ? split[1].split("&").reduce((query, item) => {
              let itemSplit = item.split("=");
              if (itemSplit.length == 2) {
                query[decodeURIComponent(itemSplit[0])] = decodeURIComponent(itemSplit[1]);
              }
              return query;
            }, {})
          : {};

      if (host === SWITCH_TAB_KEY) {
        return this.switchTab(query, context);
      }
      context.push({
        screen: host,
        passProps: query,
        navigatorStyle: {
          tabBarHidden: true,
        },
      });
      return true;
    } else if (scheme.indexOf("http") == 0) {
      context.push({
        screen: "Webview",
        title: "网页浏览",
        passProps: {
          url: scheme,
        },
        navigatorStyle: {
          tabBarHidden: true,
        },
      });
      return true;
    } else {
      console.log("不支持的schem");
      return false;
    }
  }
  switchTab = ({ index, event = {} } = {}, context) => {
    index = parseInt(index);
    try {
      event = JSON.parse(event);
    } catch (error) {}

    const { name, payload } = event;

    if (isNaN(index)) {
      return false;
    }

    context.switchToTab({
      tabIndex: index,
    });

    if (_.isString(name)) {
      DeviceEventEmitter.emit(name, payload);
    }

    return true;
  };
  canOpen = (scheme, context) => {
    if (!context || !context.push || !context.switchToTab) {
      return false;
    }
    if (!isString(scheme)) {
      return false;
    }

    if (scheme.indexOf(APP_SCHEME) == 0) {
      scheme = scheme.split(APP_SCHEME)[1];
      const screenID = scheme.split("?")[0];
      if (screenID === SWITCH_TAB_KEY) {
        return true;
      }
      try {
        const screen = Navigation.getRegisteredScreen(screenID);
        return !!screen;
      } catch (error) {
        logger.error(`invaild scheme: ${scheme}`, LOGGER_MODULE_CORE, "URLRouter");
        return false;
      }
    } else if (scheme.indexOf("https://") == 0 || scheme.indexOf("http://") == 0) {
      return true;
    }

    return false;
  };
}

export default new URLRouter();
