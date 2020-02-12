import { PushNotificationIOS, DeviceEventEmitter } from "react-native";
import DFNetwork, { NOTIFY_API } from "../common/network";
import { installID } from "../../util/device";
import notificationHandler from "./notificationHandler";
import handleQuickAction from "./quickAction";

let pushToken;
let PushEnabled = false;

PushNotificationIOS.getInitialNotification().then(notification => {
  setTimeout(() => {
    notificationHandler(notification, true);
  }, 1500);
});

PushNotificationIOS.addEventListener("register", token => {
  pushToken = token;
  console.log("register:" + token);
  setPushToken(token);
  checkNotificationPermissions();
});

// DeviceEventEmitter.addListener('quickActionShortcut', data => {
//     alert(111)
//     handleQuickAction(data)
// })

PushNotificationIOS.addEventListener("registrationError", (msg, code, details) => {
  console.log("registrationError:" + msg);
});

PushNotificationIOS.addEventListener("notification", notification => {
  notificationHandler(notification);
});

function setPushToken(token) {
  if (!token) {
    return;
  }

  DFNetwork.get(
    "/notify/updateToken.do",
    {
      pushToken: token,
      imeinum: installID,
      platform: "ios",
    },
    NOTIFY_API
  );
}

export function requestNotificationPermissions() {
  PushNotificationIOS.requestPermissions();
  checkNotificationPermissions();
}

export function checkNotificationPermissions(callback) {
  PushNotificationIOS.checkPermissions(permissions => {
    const { alert, badge, sound } = permissions;
    if (!alert && !badge && !sound) {
      PushEnabled = false;
    } else {
      PushEnabled = true;
    }
    if (callback) {
      callback(PushEnabled);
    }
  });
}

export function setApplicationIconBadgeNumber(number) {
  PushNotificationIOS.setApplicationIconBadgeNumber(number);
}
export { PushEnabled, pushToken };
