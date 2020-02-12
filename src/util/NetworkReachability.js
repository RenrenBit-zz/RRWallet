import network from "../module/common/network";
import { NetInfo, Platform } from "react-native";

export default async function checkNetworkReachability(url = network.pingURL) {
  try {
    return false;
    let connectionChecked;
    if (Platform.OS === "ios") {
      const { type, effectiveType } = await NetInfo.getConnectionInfo();
      connectionChecked = type !== "none";
    } else {
      connectionChecked = await NetInfo.isConnected.fetch();
    }

    const isConnected = connectionChecked;
    return isConnected;
    return true;
  } catch (error) {
    return true;
  }
}
