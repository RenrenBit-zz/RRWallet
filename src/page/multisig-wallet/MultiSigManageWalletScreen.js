import React, { Component } from "react";
import { StyleSheet, View, TouchableHighlight, Text, Image } from "react-native";
import Screen from "../Screen";
import i18n from "../../module/i18n/i18n";
import MultiSigCreateScreen from "./MultiSigCreateScreen";
import MultiSigJoinScreen from "./MultiSigJoinScreen";
import theme from "../../util/Theme";
import MultiSigRecoveryScreen from "./MultiSigRecoveryScreen";

class MultiSigManageWalletScreen extends Screen {
  static get screenID() {
    return "MultiSigManageWalletScreen";
  }
  data = [
    {
      title: i18n.t("wallet-multisig-manage-create"),
      screenID: MultiSigCreateScreen.screenID,
      screenTitle: i18n.t("wallet-title-create-multisig"),
    },
    {
      title: i18n.t("wallet-multisig-manage-join"),
      screenID: MultiSigJoinScreen.screenID,
      screenTitle: i18n.t("wallet-title-join-multisig"),
    },
    {
      title: i18n.t("wallet-multisig-manage-recovery"),
      screenID: MultiSigRecoveryScreen.screenID,
      screenTitle: i18n.t("wallet-title-recovery-multisig"),
    },
  ];
  onCellPress = (screenID, screenTitle) => {
    this.navigator.push({
      screen: screenID,
      title: screenTitle,
    });
  };
  render() {
    return (
      <View style={styles.main}>
        {this.data.map((item, index) => (
          <View key={index}>
            <TouchableHighlight onPress={this.onCellPress.bind(this, item.screenID, item.screenTitle)}>
              <View style={styles.content}>
                <Text style={styles.title}>{item.title}</Text>
                <Image source={require("@img/icon/right_arrow.png")} />
              </View>
            </TouchableHighlight>
            <View style={styles.separator} />
          </View>
        ))}
      </View>
    );
  }
}

const styles = StyleSheet.create({
  main: {
    marginTop: 12,
  },
  content: {
    flexDirection: "row",
    height: 48,
    alignItems: "center",
    paddingHorizontal: 16,
    backgroundColor: "#FFFFFF",
  },
  title: {
    flex: 1,
    fontSize: 14,
    color: theme.textColor.primary,
  },
  separator: {
    marginLeft: 16,
    backgroundColor: theme.borderColor,
    height: StyleSheet.hairlineWidth,
  },
});

export default MultiSigManageWalletScreen;
