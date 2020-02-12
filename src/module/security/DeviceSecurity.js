import localStorage from "../../util/localStorage";
import { AppState, DeviceEventEmitter, Platform } from "react-native";
import { Navigation } from "react-native-navigation";
import TouchID from "react-native-touch-id";
import crypto from "../crypto/crypto";
import Dialog from "../../component/common/Dialog";
import { observable, computed } from "mobx";
import theme from "../../util/Theme";
import {
  NOTIFICATION_AUTH_FINISH,
  LOCKSCREEN_DISPLAY_STYLE_MODAL,
  LOCKSCREEN_DISPLAY_STYLE_SINGLE,
} from "../../config/const";

const DEVICE_SECURITY_STORAGE_PWD_KEY = "DEVICE_SECURITY_STORAGE_PWD_KEY";
const DEVICE_SECURITY_STORAGE_HD_KEY = "DEVICE_SECURITY_STORAGE_HD_KEY";
const DEVICE_SECURITY_LOCK_INTERVAL = 2 * 60 * 1000;
const DEVICE_SECURITY_PWD_AES_KEY1 =
  "8M4ZmxWT4FkC8761UXF4f5zP7u6TaYkgb0mmdsNEwP4ZeNfljuikp3wQpo6PyRHoGPjTBpMZi1AMk55qXuJay4QWVWecb7EKMtT4ik2BKyWwwUVeHd2uALFARTs6arlpG5TYrWP2pacMd1OoxLxxkjYXyjR8GNqO5uWZEpSUkqyGONRV1V3fFxWbnUe1Lk6GTPycghR3UrDxVuw78CssMw5x2pBFfbRGk0J3uOzsWTlzPI4yJkIfpi8p5gyEjbYG";
const DEVICE_SECURITY_PWD_AES_KEY2 = "kfyPDjcEvMcNWCnriXCwDIKm90Vylfcne3nw3Rq7UlAhEntiCcQ99wR5IW3jzIIr";

function aesSecretKey() {
  return crypto.sha256(
    `${DEVICE_SECURITY_PWD_AES_KEY2.split("").join("0")}${DEVICE_SECURITY_PWD_AES_KEY1.split("")
      .reverse()
      .join("")}`
  );
}

function secondAesSecretKey() {
  return crypto.sha256(
    `${DEVICE_SECURITY_PWD_AES_KEY2.split("").join("0")}${DEVICE_SECURITY_PWD_AES_KEY1.split("")
      .reverse()
      .join("")}`,
    {
      asByte: true,
    }
  );
}

class DeviceSecurity {
  @observable splashing = false; // 闪屏广告
  @observable isUnlocking = false;
  /**
   * 是否开启锁屏密码
   *
   * @readonly
   * @memberof DeviceSecurity
   */
  @computed get lockScreenPwdEnable() {
    return this.pwd && !!this.pwd.length;
  }

  /**
   * 是否支持硬件级别解锁
   *
   * @readonly
   * @memberof DeviceSecurity
   */
  @computed get HDSecurityCapability() {
    return Platform.select({
      ios: this.HDSecurityType && this.HDSecurityType.length > 0,
      android: !!this.HDSecurityType,
    });
  }

  @observable HDSecurityEnable = false;
  @observable HDSecurityType = "";
  @observable pwd = "";
  leaveTimestamp = 0;

  constructor() {
    AppState.addEventListener("change", nextAppState => {
      if (nextAppState == "active") {
        this.showUnlockIfNeed();
      } else {
        this.leaveTimestamp = new Date().getTime();
      }
    });
    DeviceEventEmitter.addListener(NOTIFICATION_AUTH_FINISH, () => {
      this.isUnlocking = false;
    });
  }
  setup = async () => {
    try {
      const [pwd, HDSecurityEnable] = await Promise.all([
        localStorage.getItem(DEVICE_SECURITY_STORAGE_PWD_KEY),
        localStorage.getItem(DEVICE_SECURITY_STORAGE_HD_KEY),
      ]);
      this.HDSecurityEnable = HDSecurityEnable == "1";
      this.pwd = pwd;

      setTimeout(async () => {
        try {
          this.HDSecurityType = await TouchID.isSupported();
        } catch (error) {}
      }, 1000);
    } catch (error) {}
  };
  showUnlockIfNeed = (start = false, style = LOCKSCREEN_DISPLAY_STYLE_MODAL) => {
    if (!this.shouldShowUnlock(start)) {
      return false;
    }
    if (this.splashing) {
      return false;
    }

    this.isUnlocking = true;
    switch (style) {
      case LOCKSCREEN_DISPLAY_STYLE_SINGLE:
        this.showSingleLockScreen();
        break;
      case LOCKSCREEN_DISPLAY_STYLE_MODAL: {
        setTimeout(() => {
          this.showModalLockScreen();
        }, 20);
        break;
      }
      default:
    }
    return true;
  };
  showModalLockScreen = () => {
    Navigation.showModal({
      screen: this.HDSecurityEnable ? "TouchIdComponent" : "PasswordComponent",
      navigatorStyle: theme.navigatorStyle,
      overrideBackPress: true,
      animationType: "fade",
    });
  };
  showSingleLockScreen = () => {
    Navigation.startSingleScreenApp({
      screen: {
        screen: this.HDSecurityEnable ? "TouchIdComponent" : "PasswordComponent",
        navigatorStyle: theme.navigatorStyle,
      },
      animationType: "fade",
    });
  };
  shouldShowUnlock = (isLaunch = false) => {
    if (this.isUnlocking) {
      return false;
    }
    if (!isLaunch) {
      const now = new Date().getTime();
      if (this.leaveTimestamp <= 0 || now - this.leaveTimestamp < DEVICE_SECURITY_LOCK_INTERVAL) {
        return false;
      }
    }

    if (this.pwd || this.HDSecurityEnable) {
      return true;
    }

    return false;
  };
  isVaildPassword = pwd => {
    if (!this.pwd) {
      return true;
    }
    const encrypt = crypto.aesEncrypt(pwd, aesSecretKey());
    const secEncrypt = crypto.aesEncrypt(pwd, secondAesSecretKey());
    return encrypt === this.pwd || secEncrypt === this.pwd;
  };
  resetPassword = async (orig, pwd) => {
    if (!this.isVaildPassword(orig)) {
      throw new Error("原密码不正确");
    }
    this.pwd = crypto.aesEncrypt(pwd, aesSecretKey());
    if (this.lockType) {
      this.pw;
    }
    await localStorage.setItem(DEVICE_SECURITY_STORAGE_PWD_KEY, this.pwd);
  };
  enableHDSecurity = async enable => {
    let optionalConfigObject = {
      title: "生物识别验证",
      color: "#e00606",
    };
    if (!this.HDSecurityType) {
      Dialog.alert("错误", "该设备不支持生物识别");
      return;
    }

    try {
      const success = await TouchID.authenticate(
        this.HDSecurityType === "FaceID" ? "" : "验证已有指纹信息",
        optionalConfigObject
      );
      this.HDSecurityEnable = enable;
      await localStorage.setItem(DEVICE_SECURITY_STORAGE_HD_KEY, enable ? "1" : "0");
    } catch (error) {}
  };
}

export default new DeviceSecurity();
