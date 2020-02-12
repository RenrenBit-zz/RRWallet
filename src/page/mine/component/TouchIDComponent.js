import React, { Component } from "react";
import { StyleSheet, Text, TouchableHighlight, View, Image, DeviceEventEmitter } from "react-native";

import TouchID from "react-native-touch-id";

import { Button } from "react-native-elements";
import Theme from "../../../util/Theme";
import { NOTIFICATION_AUTH_FINISH, SPLASH_SCENE_LOCK } from "../../../config/const";
import Tip from "../../../component/common/Tip";
import DeviceSecurity from "../../../module/security/DeviceSecurity";
import Splash from "../../../module/launch/splash";
import theme from "../../../util/Theme";

export default class TouchIDComponent extends Component {
  static navigatorStyle = {
    statusBarTextColorSchemeSingleScreen: "dark",
    navBarHidden: true,
  };

  constructor() {
    super();
    this.state = {
      biometryType: null,
      title: "使用密码登录",
      desc: "",
    };
  }

  componentDidMount() {
    setTimeout(() => {
      Splash.dismissIfNeed(SPLASH_SCENE_LOCK);
    }, 0.3 * 1000);
    TouchID.isSupported()
      .then(biometryType => {
        if (biometryType === "FaceID") {
          this.setState({
            biometryType: biometryType,
            desc: "使用FaceID识别",
          });
        } else {
          this.setState({
            biometryType: biometryType,
            desc: "使用指纹识别",
          });
        }
        setTimeout(() => {
          this._clickHandler();
        }, 0.85 * 1000);
      })
      .catch(error => {
        if (error.name && error.name == "LAErrorUserFallback") {
          this.fallbackToPassword();
          return;
        }
        if (error.name && error.name == "RCTTouchIDNotSupported") {
          this.tip &&
            this.tip.showInfo({
              title: "注意",
              message: "验证错误次数过多，请使用密码登录",
              buttons: [
                { title: "取消" },
                {
                  title: "确认",
                  onPress: () => {
                    setTimeout(() => {
                      this.fallbackToPassword();
                    }, 500);
                  },
                },
              ],
            });
        }
      });
    this.setState({
      biometryType: "TouchID",
      desc: "点击下方按钮进行指纹认证",
    });
  }

  render() {
    return (
      <View style={styles.container}>
        <TouchableHighlight activeOpacity={0.6} underlayColor="transparent" onPress={this._clickHandler.bind(this)}>
          <Image
            style={styles.icon}
            source={
              this.state.biometryType === "FaceID" ? require("@img/mine/faceid.png") : require("@img/mine/touchid.png")
            }
          />
        </TouchableHighlight>
        <Text style={styles.instructions}>{this.state.desc}</Text>
        <View style={styles.bottom}>
          <Button
            containerStyle={styles.authButtonContainer}
            buttonStyle={styles.authButton}
            titleStyle={styles.authButtonTitle}
            title={this.state.title}
            onPress={this.fallbackToPassword}
          />
        </View>
        <Tip ref={ref => (this.tip = ref)} />
      </View>
    );
  }

  _clickHandler() {
    TouchID.isSupported()
      .then(() => {
        const optionalConfigObject = {
          title: "生物识别验证",
          color: "#e00606",
          passcodeFallback: true,
        };

        TouchID.authenticate("", optionalConfigObject)
          .then(success => {
            this.props.navigator.dismissModal();
            DeviceSecurity.isUnlocking = false;
            DeviceEventEmitter.emit(NOTIFICATION_AUTH_FINISH);
          })
          .catch(error => {
            if (error.name && error.name == "LAErrorUserFallback") {
              this.fallbackToPassword();
              return;
            }
            console.warn(error);
          });
      })
      .catch(error => {
        if (error.name && error.name == "RCTTouchIDNotSupported") {
          this.tip &&
            this.tip.showInfo({
              title: "注意",
              message: "验证错误次数过多，请使用密码登录",
              buttons: [
                { title: "取消" },
                {
                  title: "确认",
                  onPress: () => {
                    setTimeout(() => {
                      this.fallbackToPassword();
                    }, 500);
                  },
                },
              ],
            });
        }
      });
  }
  fallbackToPassword = () => {
    if (!DeviceSecurity.lockScreenPwdEnable) {
      this.tip && this.tip.showInfo("没有其他可用登录方式, 请尝试锁屏手机后解锁, 即可重新开启指纹或人脸识别");
      return;
    }
    this.props.navigator.resetTo({
      screen: "PasswordComponent",
      navigatorStyle: Theme.navigatorStyle,
      overrideBackPress: true,
      animationType: "fade",
    });
  };
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    backgroundColor: "#FFFFFF",
  },
  bottom: {
    flex: 1,
    justifyContent: "flex-end",
    marginBottom: 80,
  },
  icon: {
    marginTop: 116 + 64,
  },
  welcome: {
    marginTop: 35,
    fontSize: 16,
    textAlign: "center",
    color: Theme.textColor.mainTitle,
  },
  instructions: {
    marginTop: 35,
    color: "#666666",
    fontSize: 16,
    textAlign: "center",
  },
  authButtonContainer: {
    alignSelf: "stretch",
    marginHorizontal: 15,
    marginTop: 40,
  },
  authButton: {
    backgroundColor: "#FFFFFF",
    borderRadius: 3,
    height: 50,
    elevation: 0,
  },
  authButtonTitle: {
    color: theme.brandColor,
  },
  changemethor: {
    fontSize: 14,
    textAlign: "center",
    color: "#fff",
  },
});

const errors = {
  LAErrorAuthenticationFailed:
    "Authentication was not successful because the user failed to provide valid credentials.",
  LAErrorUserCancel: "Authentication was canceled by the user—for example, the user tapped Cancel in the dialog.",
  LAErrorUserFallback: "Authentication was canceled because the user tapped the fallback button (Enter Password).",
  LAErrorSystemCancel:
    "Authentication was canceled by system—for example, if another application came to foreground while the authentication dialog was up.",
  LAErrorPasscodeNotSet: "Authentication could not start because the passcode is not set on the device.",
  LAErrorTouchIDNotAvailable: "Authentication could not start because Touch ID is not available on the device",
  LAErrorTouchIDNotEnrolled: "Authentication could not start because Touch ID has no enrolled fingers.",
  RCTTouchIDUnknownError: "Could not authenticate for an unknown reason.",
  RCTTouchIDNotSupported: "Device does not support Touch ID.",
};
