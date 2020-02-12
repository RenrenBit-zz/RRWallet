import { NativeModules } from "react-native";
import { SPLASH_SCENE_LOCK, SPLASH_SCENE_TAB } from "../../config/const";
import DeviceSecurity from "../security/DeviceSecurity";
import RNLanguages from "react-native-languages";

const RRRNSplash = NativeModules.RRRNSplash;
class Splash {
  get isFirstLaunch() {
    return RRRNSplash.isFirstLaunch && RNLanguages.language.indexOf("zh") === 0;
  }
  constructor() {
    setTimeout(() => {
      this.dismiss();
    }, 8 * 1000); //八秒后强制dimiss, 防止业务层没人调用卡在闪屏
  }
  /**
   *
   * @param {SPLASH_SCENE_TAB|SPLASH_SCENE_LOCK|SPLASH_SCENE_GUIDE} scene
   * @memberof Splash
   */
  dismissIfNeed = scene => {
    if (scene == SPLASH_SCENE_TAB && (DeviceSecurity.isUnlocking || this.isFirstLaunch)) {
      return;
    }
    this.dismiss();
  };
  dismiss = () => {
    RRRNSplash && RRRNSplash.dismiss && RRRNSplash.dismiss();
  };
}

export default new Splash();
