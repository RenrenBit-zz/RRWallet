import { Platform, Dimensions, DeviceEventEmitter } from "react-native";
import { Navigation } from "react-native-navigation";
import { observer } from "mobx-react";
import { observable, computed } from "mobx";
import theme from "../../util/Theme";
import DeviceSecurity from "../../module/security/DeviceSecurity";
import {
  LOCKSCREEN_DISPLAY_STYLE_MODAL,
  LOCKSCREEN_DISPLAY_STYLE_SINGLE,
  NOTIFICATION_AUTH_FINISH,
} from "../../config/const";

const { width, height } = Dimensions.get("window");

class SplashUtil {
  constructor() {
    DeviceEventEmitter.addListener(NOTIFICATION_AUTH_FINISH, () => {
      DeviceSecurity.splashing = false;
    });
  }

  showSplashModalIfNeed(onSplashFinish, style = LOCKSCREEN_DISPLAY_STYLE_MODAL) {
    try {
      if (DeviceSecurity.shouldShowUnlock(true)) {
        if (style == LOCKSCREEN_DISPLAY_STYLE_MODAL) {
          setTimeout(() => {
            Navigation.showModal({
              screen: "SplashPortal",
              passProps: {
                onSplashFinish: onSplashFinish,
              },
              navigatorStyle: theme.navigatorStyle,
              overrideBackPress: true,
              animationType: "none",
            });
          }, 50);
        } else if (style == LOCKSCREEN_DISPLAY_STYLE_SINGLE) {
          Navigation.startSingleScreenApp({
            screen: {
              screen: "SplashPortal",
              navigatorStyle: theme.navigatorStyle,
              overrideBackPress: true,
            },
            passProps: {
              onSplashFinish: () => {
                onSplashFinish && onSplashFinish();
              },
            },
            animationType: "fade",
          });
        }

        return true;
      }
    } catch (error) {
      console.log("splash err", error);
    }

    return false;
  }
}

export default new SplashUtil();
