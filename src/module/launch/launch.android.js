import { DeviceEventEmitter, AsyncStorage } from "react-native";
import { NOTIFICATION_AUTH_FINISH, LOCKSCREEN_DISPLAY_STYLE_SINGLE } from "../../config/const";
import AppInfo from "../app/AppInfo";
import theme from "../../util/Theme";
import { Navigation } from "react-native-navigation";
import SplashUtil from "../../page/splash/SplashUtil";

let needShowSplash = true;
let restoreOptions;

DeviceEventEmitter.addListener(NOTIFICATION_AUTH_FINISH, () => {
  launch(restoreOptions);
});

const launch = async ({ appStyle }, onlyLaunchTab = false) => {
  restoreOptions = {
    appStyle: Object.assign({}, appStyle),
  };

  if (needShowSplash && !onlyLaunchTab) {
    needShowSplash = false;
    let needShowSplashAd = await SplashUtil.showSplashModalIfNeed(() => {
      launch(restoreOptions);
    }, LOCKSCREEN_DISPLAY_STYLE_SINGLE);
    if (needShowSplashAd) {
      return;
    }
  }

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

  setTimeout(() => {
    AppInfo.checkUpdate();
  }, 1000 * 3);
};

const relaunch = () => {
  launch(restoreOptions, true);
};

export { relaunch };

export default launch;
