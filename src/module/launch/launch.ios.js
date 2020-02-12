import { Navigation } from "react-native-navigation";
import theme from "../../util/Theme";
import { DeviceEventEmitter } from "react-native";
import AppInfo from "../app/AppInfo";
import { requestNotificationPermissions } from "../notification/notification";
import Splash from "../launch/splash";
import { NOTIFICATION_AUTH_FINISH, NOTIFICATION_WARNING_FINISH } from "../../config/const";
import SplashUtil from "../../page/splash/SplashUtil";

DeviceEventEmitter.addListener(NOTIFICATION_AUTH_FINISH, () => {
  startModal();
});

DeviceEventEmitter.addListener(NOTIFICATION_WARNING_FINISH, () => {
  startModal();
});

let needShowSplash = true;
let needShowUpdate = true;
let needRequestNotificationPermission = true;
let restoreOptions;

async function startModal() {
  if (needShowSplash) {
    needShowSplash = false;
    let needShowSplashAd = SplashUtil.showSplashModalIfNeed(startModal);
    if (needShowSplashAd) {
      return;
    }
  }

  if (needShowUpdate && !__DEV__) {
    needShowUpdate = false;
    setTimeout(() => {
      AppInfo.checkUpdate();
    }, 1000 * 2);
  }

  if (needRequestNotificationPermission) {
    needRequestNotificationPermission = false;
    setTimeout(() => {
      requestNotificationPermissions();
    }, 4000);
  }
}

const launch = ({ appStyle }, onlyLaunchTab = false) => {
  restoreOptions = {
    appStyle: Object.assign({}, appStyle),
  };

  const exec = () => {
    Navigation.startSingleScreenApp({
      screen: {
        screen: "SkeletonScreen",
        navigatorStyle: {
          ...theme.navigatorStyle,
          navBarHidden: true,
          screenBackgroundColor: "#FFFFFF",
        },
      },
      appStyle: {
        ...appStyle,
      },
      animationType: "fade",
    });
    if (!onlyLaunchTab) {
      startModal();
    }
  };
  if (Splash.isFirstLaunch && !onlyLaunchTab) {
    setTimeout(() => {
      exec();
    }, 2 * 1000);
  } else {
    exec();
  }
};

const relaunch = () => {
  launch(restoreOptions, true);
};

export { relaunch };
export default launch;
