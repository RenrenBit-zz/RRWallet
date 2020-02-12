import { NativeModules, Platform, Dimensions, AsyncStorage } from "react-native";
import DeviceInfo from "react-native-device-info";

const RRRNDevice = NativeModules.RRRNDevice;

let { height, width } = Dimensions.get("window");

Dimensions.addEventListener("change", e => {
  width = e.window.width;
  height = e.window.height;
});

let installID;
let deviceID;

RRRNDevice.deviceID().then(id => {
  deviceID = id;
});

const DEVICE_ID_KEY = "DEVICE_ID_KEY";

export { installID, deviceID };

class Device {
  generateUUID = () => {
    const UUID = "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx"
      .replace(/[xy]/g, function(c) {
        var r = (Math.random() * 16) | 0,
          v = c == "x" ? r : (r & 0x3) | 0x8;
        return v.toString(16);
      })
      .toUpperCase();
    console.log(UUID);
    return UUID;
  };
  keepScreenOn(on) {
    RRRNDevice.keepScreenOn(on);
  }

  setScreenBrightness(val) {
    RRRNDevice.setScreenBrightness(val);
  }
  get isAndroid() {
    return Platform.OS === "android";
  }
  get isIOS() {
    return Platform.OS === "ios";
  }
  async getScreenBrightness() {
    return new Promise((resolove, reject) => {
      RRRNDevice.getScreenBrightness()
        .then(val => {
          resolove(val);
        })
        .catch(error => {
          reject(error);
        });
    });
  }
  /**
   * 请用getDeviceId
   */
  async installID() {
    if (installID) {
      return installID;
    }
    try {
      installID = await AsyncStorage.getItem(DEVICE_ID_KEY);
      if (!installID) {
        installID = this.generateUUID();
        AsyncStorage.setItem(DEVICE_ID_KEY, installID);
        return installID;
      }
    } catch (error) {}
    return installID;
  }
  async deviceID() {
    return new Promise((resolove, reject) => {
      if (deviceID) {
        resolove(deviceID);
      } else {
        RRRNDevice.deviceID()
          .then(id => {
            deviceID = id;
            resolove(id);
          })
          .catch(error => {
            reject(error);
          });
      }
    });
  }
  get idfa() {
    return RRRNDevice.idfa;
  }
  get isIPhoneX() {
    return Platform.OS === "ios" && (height == 812 || height == 896);
  }
  get tabBarHeight() {
    return Platform.select({
      ios: this.isIPhoneX ? 83 : 49,
      android: 49,
    });
  }
  get statusBarHeight() {
    return Platform.select({
      ios: this.isIPhoneX ? 44 : 20,
      android: 0,
    });
  }
  get navBarHeight() {
    return this.isIPhoneX ? 88 : 64;
  }
  get iPhoneXSafeArea() {
    return {
      bottom: 34,
    };
  }
  get safeArea() {
    if (this.isIPhoneX) {
      return {
        bottom: 34,
      };
    }
    return {
      bottom: 0,
    };
  }
  get windowSize() {
    return {
      width: Math.ceil(width),
      height: Platform.select({ ios: height, android: height - 20 }),
    };
  }
  get screenSize() {
    return Dimensions.get("screen");
  }
  get name() {
    return `${DeviceInfo.getBrand()} ${DeviceInfo.getDeviceId()}`;
  }
}

export default new Device();
