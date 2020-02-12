import React, { Component } from "react";
import { StyleSheet, Text, View, DeviceEventEmitter, Keyboard } from "react-native";

import { padding } from "../../../util/UIAdapter";
import PasswordInput from "../../../component/common/PasswordInput";
import theme from "../../../util/Theme";
import { observer } from "mobx-react";
import DeviceSecurity from "../../../module/security/DeviceSecurity";
import { observable, computed } from "mobx";
import { NOTIFICATION_AUTH_FINISH, SPLASH_SCENE_LOCK } from "../../../config/const";
import Splash from "../../../module/launch/splash";
import i18n from "../../../module/i18n/i18n";
import { BIZ_SCOPE } from "../../../module/i18n/const";

@observer
export default class PasswordComponent extends Component {
  static navigatorStyle = {
    navBarHidden: true,
  };

  @observable errCount = 0;
  constructor() {
    super();

    this.state = {
      pwText: null,
    };
  }
  @observable errMsg = "";
  componentDidMount() {
    setTimeout(() => {
      Splash.dismissIfNeed(SPLASH_SCENE_LOCK);
    }, 20);
  }
  onPressToTouchId() {
    this.props.navigator.resetTo({
      screen: "TouchIdComponent",
      passProps: {
        address: this.props.address,
        name: this.props.name,
      },
    });
  }
  hideKeyboard() {
    Keyboard.dismiss();
  }

  onCompletion = text => {
    if (DeviceSecurity.isVaildPassword(text)) {
      this.hideKeyboard();
      this.props.navigator.dismissModal({
        animationType: "fade",
      });
      DeviceEventEmitter.emit(NOTIFICATION_AUTH_FINISH);
    } else {
      this.errMsg = "密码错误, 请重新输入";
      this.input.clear();
    }
  };
  render() {
    return (
      <View style={styles.container}>
        <Text ellipsizeMode="middle" numberOfLines={1} style={styles.instructions}>
          {i18n.tt(BIZ_SCOPE.mine, "unlock-password")}
        </Text>
        <PasswordInput
          secureTextEntry={true}
          ref={ref => (this.input = ref)}
          style={styles.input}
          onCompletion={this.onCompletion}
        />
        <Text style={styles.err}>{this.errMsg}</Text>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    height: "100%",
    backgroundColor: "#FFFFFF",
    alignItems: "center",
  },
  instructions: {
    marginTop: padding(180),
    color: theme.textColor.mainTitle,
    fontSize: 18,
    textAlign: "center",
    marginBottom: 24,
  },
  input: {
    marginTop: 12,
    marginHorizontal: 40,
  },
  text: {
    fontSize: 14,
    color: "#222222",
  },
  err: {
    marginTop: padding(40),
    fontSize: 17,
    color: "#EB4E35",
  },
});
