import { Navigation } from "react-native-navigation";
import DeviceInfo from "react-native-device-info";
import { Platform, Linking, NativeModules, Keyboard } from "react-native";
import { isObject } from "lodash";
import { observable, computed } from "mobx";
import _ from "lodash";
import i18n from "../i18n/i18n";
import { sleep } from "../../util/Timer";

const ENV = {
  JS_VERSION: process.env.RN_JS_VERSION,
  CID: process.env.RN_CID,
  SENTRY_DSN: process.env.RN_SENTRY_DSN,
};

const TESTFLIGHT_LINK = "itms-beta://testflight.apple.com/join/lUyzQcQM";

const RNFS = require("react-native-fs");
const RRRNDevice = NativeModules.RRRNDevice;

class AppInfo {
  @observable hasNewerVersion = false;
  get bundleId() {
    return DeviceInfo.getBundleId();
  }
  get commitId() {
    return ENV.CID;
  }

  get sentryDSN() {
    return ENV.SENTRY_DSN;
  }

  /**
   *'1.0.1
   * 最后一位是两位
   * @readonly
   * @type {string}
   * @memberof AppInfo
   */
  @computed get version() {
    return `${DeviceInfo.getVersion()}`;
  }
  /**
   *100001
   * 点变成0
   * @readonly
   * @type {number}
   * @memberof AppInfo
   */
  @computed get versionCode() {
    const split = this.version.split(".");
    split[2] = _.padStart(split[2], 2, "0");
    return parseInt(split.join("0"));
  }
  get jsVersion() {
    return ENV.JS_VERSION;
  }
  get userAgent() {
    return DeviceInfo.getUserAgent();
  }
  checkUpdate = async () => {
    try {
      const network = require("../common/network").default;
      const data = await network.get("https://bitrenren.oss-cn-hangzhou.aliyuncs.com/rrwallet/version.json");

      if (!isObject(data)) {
        return false;
      }

      const platform = Platform.OS;
      const version = data[`${platform}_version`];
      const versionCode = data[`${platform}_version_code`];
      const content = i18n.select({ zh: data[`${platform}_update_tip`], en: data[`${platform}_update_tip_en`] });
      const minimumCode = data[`${platform}_minimum_version_code`];
      const packageUrl = data[`${platform}_download_url`];

      let downloadUrl;

      if (platform === "android" && !/^https:\/\/.*\.apk$/.test(packageUrl)) {
        return false;
      }
      downloadUrl = packageUrl;

      const needUpdate = versionCode > this.versionCode;
      this.hasNewerVersion = needUpdate;
      if (!needUpdate) {
        return false;
      }

      const force = minimumCode > this.versionCode;

      setTimeout(() => {
        Keyboard.dismiss();
        Navigation.showLightBox({
          screen: "AppUpdateModal",
          passProps: { version, content, downloadUrl, force },
          style: {
            backgroundBlur: "dark",
            tapBackgroundToDismiss: false,
          },
        });
      }, 1000 * 1);
      return true;
    } catch (error) {}

    return false;
  };
  async install(path, progress) {
    if (Platform.OS == "ios") {
      Linking.openURL(path);
    } else {
      const publicPath = `/data/data/${this.bundleId}/files/public`;
      if (!(await RNFS.exists(publicPath))) {
        await RNFS.mkdir(publicPath);
      }
      const filePath = `${publicPath}/rrwallet.apk`;
      if (await RNFS.exists(filePath)) {
        await RNFS.unlink(filePath);
      }
      let percent = 0;
      const ret = RNFS.downloadFile({
        fromUrl: path,
        toFile: filePath,
        connectionTimeout: 1000 * 120,
        progressDivider: 1,
        progress: ({ contentLength, bytesWritten }) => {
          percent = parseFloat((bytesWritten / contentLength).toFixed(2));
          if (!isFinite(percent) || isNaN(percent)) {
            return;
          }
          progress && progress(percent);
        },
      });
      const res = await ret.promise;
      if (percent !== 1) {
        throw new Error(i18n.common("update-download-failed"));
      }
      await sleep(400);
      try {
        await RRRNDevice.installAPK(filePath);
      } catch (error) {
        const logger = require("../../util/logger").default;
        logger.error(new Error("安装失败"));
        alert(error);
      }
    }
  }
}

export default new AppInfo();
