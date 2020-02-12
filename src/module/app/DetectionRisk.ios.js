import { NativeModules, Alert } from "react-native";
import AppInfo from "./AppInfo";
import { BUNDLE_ID_PRO_IOS, BUNDLE_ID_DEV, BUNDLE_ID_INHOUSE_IOS } from "../../config/const";

const RRRNDevice = NativeModules.RRRNDevice;

const vaildBundleId = () => {
  if (__DEV__) {
    return true;
  }
  return [BUNDLE_ID_PRO_IOS, BUNDLE_ID_INHOUSE_IOS, BUNDLE_ID_DEV].indexOf(AppInfo.bundleId) != -1;
};

const detectionRisk = () => {
  if (!vaildBundleId()) {
    Alert.alert("警告", "发现二次签名");
    return true;
  }
  const isJailbreak = RRRNDevice.OO0o0OO00O00oOO0o0;
  if (isJailbreak) {
    Alert.alert("警告", "安装包已损坏请重新安装");
    return true;
  }
  return false;
};

export default detectionRisk;
