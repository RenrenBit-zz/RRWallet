import { DeviceEventEmitter, NativeEventEmitter, NativeModules } from "react-native";
import DFNetwork, { NOTIFY_API } from "../common/network";
import { installID } from "../../util/device";
import notificationHandler from "./notificationHandler";

const PushNotificationAndroid = NativeModules.PushNotificationAndroid;
const { ReactNativeLoading } = NativeModules;

let pushToken;
let PushEnabled = false;
const loadingManagerEmitter = new NativeEventEmitter(ReactNativeLoading);
const subscription = loadingManagerEmitter.addListener("push_event", event => {
  setTimeout(() => {
    handlePushEvent(event);
  }, 2 * 1000);
});

loadingManagerEmitter.addListener("receive_event", event => {
  onReceiveEvent(event);
});

PushNotificationAndroid.register(function(data) {
  if (data.success) {
    pushToken = data.deviceToken;
    setPushToken(data.deviceToken);
    console.log("deviceToken : " + data.deviceToken);
  } else {
    console.log(data.s + "," + data.s1);
  }
  checkNotificationPermissions();
});

function setPushToken(token) {
  if (!token) {
    return;
  }
  setTimeout(() => {
    DFNetwork.get(
      "/notify/updateToken.do",
      {
        pushToken: token,
        imeinum: installID,
        platform: "android",
      },
      NOTIFY_API
    );
  }, 1000);
}

function handlePushEvent(event) {
  if (event) {
    console.log("push msg : " + JSON.stringify(event));
    console.log("push msg : " + event.custom + ", " + event.extra);
    notificationHandler({ ...event, clicked: true });
  }
}

function onReceiveEvent(event) {
  if (event) {
    console.log("receive msg : " + JSON.stringify(event));
    console.log("receive msg : " + event.custom + ", " + event.extra);
    notificationHandler(event);
  }
}

export function checkNotificationPermissions(callback) {
  PushNotificationAndroid.checkPermissions().then(enable => {
    PushEnabled = enable;
    if (callback) {
      callback(enable);
    }
  });
}

export function requestNotificationPermissions() {
  // setTimeout(() => {
  //     PushNotificationAndroid.requestPermissions();
  //     checkNotificationPermissions()
  // }, 8 * 1000);
}

export function setApplicationIconBadgeNumber(number) {}
export { PushEnabled, pushToken };
