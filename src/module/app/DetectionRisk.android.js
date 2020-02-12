import { NativeModules, Alert } from "react-native";
import AppInfo from "./AppInfo";
import { BUNDLE_ID_PRO_ANDROID } from "../../config/const";

const RRRNDevice = NativeModules.RRRNDevice;

const detectionRisk = () => {
  const isRoot = AppInfo.bundleId === BUNDLE_ID_PRO_ANDROID && !__DEV__ && RRRNDevice.O0o0o0OOoo00O00ooO0o0;

  if (isRoot) {
    Alert.alert("警告", "安装包有问题, 请重新安装");
  }

  return isRoot;
};

export default detectionRisk;
