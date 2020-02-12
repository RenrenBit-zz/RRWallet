import { AlertIOS, AlertAndroid, Alert, Platform } from "react-native";
// import DialogAndroid from 'react-native-dialogs'
import prompt from "react-native-prompt-android";

class Dialog {
  alert = Alert.alert;

  prompt = (title, message, buttons, type, defaultValue) => {
    if (Platform.OS == "ios") {
      AlertIOS.prompt(title, message, buttons, type, defaultValue);
    } else if (Platform.OS == "android") {
      prompt(title, message, buttons, {
        type: type,
        cancelable: false,
        defaultValue: defaultValue,
      });
      // prompt(title, message, buttons, {
      //     type: type,
      //     defaultValue: defaultValue,
      // })
      // DialogAndroid.prompt(title, message, {
      //     positiveText: 'OK',
      //     negativeText: 'Cancel',
      //     keyboardType: 'password',
      //     defaultValue: defaultValue
      // }).then(result => {
      //     console.log(result)
      // })
    }
  };
}

export default new Dialog();
