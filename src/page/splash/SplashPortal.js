import React, { Component } from "react";
import { DeviceEventEmitter } from "react-native";
import { observer } from "mobx-react";
import { observable, computed } from "mobx";
import { Navigation } from "react-native-navigation";
import SplashUtil from "./SplashUtil";
import TouchIDComponent from "../mine/component/TouchIDComponent";
import PasswordComponent from "../mine/component/PasswordComponent";
import Screen from "../Screen";
import DeviceSecurity from "../../module/security/DeviceSecurity";
import { NOTIFICATION_SPLASH_FINISH, NOTIFICATION_SPLASH_START } from "../../config/const";

@observer
export default class SplashPortal extends Component {
  static get screenID() {
    return "SplashPortal";
  }
  static navigatorStyle = {
    ...Screen.navigatorStyle,
    navBarHidden: true,
    tabBarHidden: true,
  };

  @computed get splashStatus() {
    let flag = 0;
    if (DeviceSecurity.shouldShowUnlock(true)) {
      if (DeviceSecurity.HDSecurityEnable) {
        flag = 2;
      } else {
        flag = 3;
      }
    }
    return flag;
  }

  componentDidMount() {
    setTimeout(() => {
      // Splash.dismissIfNeed(4);
      DeviceEventEmitter.emit(NOTIFICATION_SPLASH_START, {
        splashStatus: this.splashStatus,
      });
    }, 0);
    DeviceSecurity.splashShowing = true;
    SplashUtil.splashing = true;
  }

  tpl = null;

  render() {
    if (this.splashStatus == 2) {
      this.tpl = <TouchIDComponent {...this.props} />;
    } else if (this.splashStatus == 3) {
      this.tpl = <PasswordComponent {...this.props} />;
    }

    return this.tpl;
  }
}
