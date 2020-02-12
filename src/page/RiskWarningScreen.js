import React, { Component } from "react";
import { View, StyleSheet, Text, TouchableHighlight } from "react-native";
import Screen from "./Screen";
import { Button } from "react-native-elements";
import theme from "../util/Theme";
import AccountStore from "../module/wallet/account/AccountStore";
import Dialog from "../component/common/Dialog";

class RiskWarningScreen extends Screen {
  static get screenID() {
    return "RiskWarningScreen";
  }
  static navigatorStyle = {
    navBarHidden: true,
  };
  restoreMnemonic = () => {
    Dialog.prompt(
      "提示",
      "请输入密码",
      [
        {
          text: "取消",
          onPress: text => {},
        },
        {
          text: "确认",
          onPress: async text => {
            AccountStore.defaultHDAccount
              .exportMnemonic(text)
              .then(words => {
                alert(words);
              })
              .catch(error => {
                alert("密码不正确");
              });
          },
        },
      ],
      "secure-text"
    );
    AccountStore.defaultHDAccount.hasCreated;
  };
  render() {
    return (
      <View style={styles.main}>
        <Text style={styles.text} textAlig>
          为了保证用户资产安全, 我们暂时停止了对Root,越狱用户的服务
        </Text>
        <Text style={[styles.text, { marginTop: 20 }]}>给您带来的不便, 敬请谅解!</Text>
        {AccountStore.defaultHDAccount.hasCreated && (
          <View>
            <Text style={[styles.text, { marginTop: 20 }]}>如果需要恢复助记词, 请点击下方按钮</Text>
            <TouchableHighlight underlayColor="transparent" onPress={this.restoreMnemonic}>
              <Text style={[styles.text, { marginVertical: 20, color: theme.linkColor }]}>恢复助记词</Text>
            </TouchableHighlight>
          </View>
        )}
      </View>
    );
  }
}

const styles = StyleSheet.create({
  main: {
    flex: 1,
    paddingHorizontal: 20,
    justifyContent: "center",
  },
  text: {
    fontSize: 18,
    textAlign: "center",
  },
});

export default RiskWarningScreen;
