import React, { Component } from "react";
import { StyleSheet, View, Text, Platform } from "react-native";
import Screen from "../Screen";
import { observable, computed, reaction } from "mobx";
import { observer } from "mobx-react";
import theme from "../../util/Theme";
import PasswordInput from "../../component/common/PasswordInput";
import { padding } from "../../util/UIAdapter";
import DeviceSecurity from "../../module/security/DeviceSecurity";
import ProgressHUD from "../../component/common/ProgressHUD";

const descMap = {
  0: "请输入原密码",
  1: "请输入新密码",
  2: "请再次输入",
};

const errorMap = {
  0: "原密码错误",
  2: "两次密码不一致",
};
@observer
class UnlockPasswordSettingScreen extends Screen {
  static get screenID() {
    return "UnlockPasswordSettingScreen";
  }
  origPwd = "";
  pwd = "";
  @observable step = DeviceSecurity.pwd && DeviceSecurity.pwd.length ? 0 : 1;
  @computed get desc() {
    return descMap[this.step];
  }
  constructor(props) {
    super(props);
  }
  componentDidMount() {
    reaction(
      () => this.step,
      setp => {
        this.input.clear();
      }
    );
  }
  render() {
    return (
      <View style={styles.container}>
        <Text style={styles.note}>◎ 为了保护您的资产安全，请先设置锁屏密码，用于解锁APP</Text>
        <Text style={styles.note}>◎ 锁屏密码为本地密码，请妥善保存，如果丢失，无法恢复APP</Text>
        <PasswordInput
          secureTextEntry={true}
          ref={ref => (this.input = ref)}
          style={styles.input}
          onCompletion={this.onCompletion}
        />
        <Text style={styles.desc}>{this.desc}</Text>
        <ProgressHUD ref={ref => (this.hud = ref)} />
      </View>
    );
  }
  onCompletion = async text => {
    switch (this.step) {
      case 0: {
        if (DeviceSecurity.isVaildPassword(text)) {
          this.origPwd = text;
          this.step++;
        } else {
          this.showError();
        }
        break;
      }
      case 1: {
        this.pwd = text;
        this.step++;
        break;
      }
      case 2: {
        if (this.pwd === text) {
          this.setPassword(this.origPwd, this.pwd);
        } else {
          this.showError();
          this.step = 1;
        }
        break;
      }
    }
  };
  setPassword = async (orig, pwd) => {
    try {
      await DeviceSecurity.resetPassword(this.origPwd, this.pwd);
      this.hud && this.hud.showSuccess("设置成功");
      setTimeout(() => {
        this.props.navigator.pop();
      }, 400);
    } catch (error) {}
  };
  showError() {
    this.hud && this.hud.showFailed(errorMap[this.step]);
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 20,
    backgroundColor: theme.backgroundColor,
  },
  note: {
    marginTop: 4,
    marginLeft: 16,
    color: theme.textColor.mainTitle,
    fontSize: 12,
  },
  input: {
    marginTop: padding(110),
  },
  desc: {
    alignSelf: "center",
    marginTop: 30,
    fontSize: 16,
    color: theme.textColor.mainTitle,
  },
});

export default UnlockPasswordSettingScreen;
