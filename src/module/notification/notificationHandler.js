import { Navigation } from "react-native-navigation";
import { Platform, DeviceEventEmitter, AppState } from "react-native";
import { NOTIFICATION_AUTH_FINISH, DEEPLINK_LINK_BLANK, NOTIFICATION_SPLASH_FINISH } from "../../config/const";
import DeviceSecurity from "../security/DeviceSecurity";
import SplashUtil from "../../page/splash/SplashUtil";

let stashedLink = DEEPLINK_LINK_BLANK;
let stashedPayload = {};

DeviceEventEmitter.addListener(NOTIFICATION_AUTH_FINISH, () => {
  setTimeout(() => {
    deepLinkIfNeed(stashedLink, stashedPayload);
  }, 1000);
});

DeviceEventEmitter.addListener(NOTIFICATION_SPLASH_FINISH, () => {
  setTimeout(() => {
    deepLinkIfNeed(stashedLink, stashedPayload);
  }, 1000);
});

const notificationHandler = (notification, forceOpen = false) => {
  const state = AppState.currentState;

  console.log(state);
  if (!notification) {
    return;
  }

  const data = {};
  if (Platform.OS === "ios") {
    Object.assign(data, notification.getData() || {}, notification.getAlert() || {});
    data.content = data["body"];
    data.inApp = data["in-app"];
    data.bizType = data["biz-type"];
  } else if (Platform.OS === "android") {
    Object.assign(data, notification.extra);
    data.title = notification.title;
    data.content = notification.text;
    data.inApp = data["in-app"];
    data.bizType = data["biz-type"];
  }

  if (data.inApp) {
    data.inApp = parseInt(data.inApp);
  }

  if (data.bizType) {
    data.bizType = parseInt(data.bizType);
  }

  if (data.time) {
    data.time = parseInt(data.time);
  }

  let { url, title, content, time, bizType, inApp } = data;
  let clicked = false;
  if (!url) {
    url = DEEPLINK_LINK_BLANK;
  }

  if (Platform.OS === "ios") {
    if (state == "background") {
      inApp = false;
      clicked = true;
    }
  } else if (Platform.OS === "android") {
    clicked = notification.clicked;
  }

  if (forceOpen) {
    clicked = true;
  }

  deepLinkIfNeed(url, { title, content, time, bizType, inApp, clicked });
};

const deepLinkIfNeed = async (link, payload) => {
  // alert('deepLinkIfNeed' + payload.content + '---' + payload.title)
  try {
    if (!payload || !payload.content || !payload.title || payload.title.length <= 0 || payload.content.length <= 0) {
      return;
    }

    if (SplashUtil.splashing) {
      stashedLink = link;
      stashedPayload = payload;
      return;
    }
    if (DeviceSecurity.isUnlocking) {
      stashedLink = link;
      stashedPayload = payload;
      return;
    }

    stashedLink = "";
    stashedPayload = {};

    Navigation.handleDeepLink({ link, payload });
  } catch (error) {}
};

const markPayloadClicked = payload => {
  payload.clicked = true;
};

export { deepLinkIfNeed, markPayloadClicked };

export default notificationHandler;
