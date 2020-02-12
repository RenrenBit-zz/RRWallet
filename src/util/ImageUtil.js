import { CameraRoll, PermissionsAndroid, Platform } from "react-native";
import _ from "lodash";

const ERROR_MESSAGE_SAVE_IMAGE = "图片保存失败，请检查相册读取权限，或者手动截图保存";
async function saveToCameraRoll(uri) {
  if (!_.isString(uri) || uri.length <= 0) {
    throw new Error(ERROR_MESSAGE_SAVE_IMAGE);
  }
  if (Platform.OS === "android") {
    try {
      const granted = await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE);
      if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
        throw new Error(ERROR_MESSAGE_SAVE_IMAGE);
      }
    } catch (err) {
      throw new Error(ERROR_MESSAGE_SAVE_IMAGE);
    }
  }
  try {
    await CameraRoll.saveToCameraRoll(uri);
  } catch (error) {
    throw new Error(ERROR_MESSAGE_SAVE_IMAGE);
  }
}

const ImageUtil = {
  saveToCameraRoll,
};

export default ImageUtil;
