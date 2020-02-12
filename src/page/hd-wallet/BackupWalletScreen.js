import React, { Component } from "react";
import { StyleSheet, View, Image, Text, Alert, AlertIOS, Dimensions, TouchableHighlight } from "react-native";
import Screen from "../Screen";
import theme from "../../util/Theme";
import ExportMnemonicWordScreen from "./ExportMnemonicWordScreen";
import { Button } from "react-native-elements";
import Dialog from "../../component/common/Dialog";
import { padding, manualPadding } from "../../util/UIAdapter";
import AccountStore from "../../module/wallet/account/AccountStore";
import { computed } from "mobx";
import i18n from "../../module/i18n/i18n";
import { BIZ_SCOPE } from "../../module/i18n/const";

const { height, width } = Dimensions.get("window");

export default class BackupWalletScreen extends Screen {
  static get screenID() {
    return "BackupWalletScreen";
  }
  @computed get isBackup() {
    return this.props.type != "display";
  }
  goExportMnemonicScreen = mnenoic => {
    this.props.navigator.push({
      screen: ExportMnemonicWordScreen.screenID,
      title: this.isBackup ? i18n.tt(BIZ_SCOPE.wallet, "backup-backup") : i18n.tt(BIZ_SCOPE.wallet, "backup-explore"),
      navigatorButtons: {
        rightButtons: [
          {
            id: "print",
            title: i18n.tt(BIZ_SCOPE.wallet, "backup-print"),
            buttonColor: theme.linkColor,
          },
        ],
      },
      passProps: {
        mnemonicWord: mnenoic,
        accountID: this.props.accountID,
        type: this.props.type,
      },
    });
  };
  nextButtonOnPress = () => {
    if (this.props.mnemonicWords) {
      this.goExportMnemonicScreen(this.props.mnemonicWords);
      return;
    }
    Dialog.prompt(
      i18n.tt(BIZ_SCOPE.common, "notice"),
      i18n.tt(BIZ_SCOPE.wallet, "common-input-pwd"),
      [
        {
          text: i18n.tt(BIZ_SCOPE.common, "cancel"),
          onPress: text => {},
        },
        {
          text: i18n.tt(BIZ_SCOPE.common, "confirm"),
          onPress: text => {
            AccountStore.defaultHDAccount
              .exportMnemonic(text)
              .then(words => {
                this.goExportMnemonicScreen(words);
              })
              .catch(error => {
                Alert.alert(i18n.tt(BIZ_SCOPE.common, "error"), i18n.tt(BIZ_SCOPE.wallet, "common-invaild-pwd"));
              });
          },
        },
      ],
      "secure-text"
    );
  };
  _onSkipButtonPress = () => {
    this.props.navigator.popToRoot();
  };
  render() {
    return (
      <View style={styles.main}>
        <View style={styles.card}>
          <Text style={styles.title}>{i18n.tt(BIZ_SCOPE.wallet, "backup-title")}</Text>
          <Text style={styles.text}>◎ {i18n.tt(BIZ_SCOPE.wallet, "backup-desc1")}</Text>
          <Text style={styles.text}>◎ {i18n.tt(BIZ_SCOPE.wallet, "backup-desc2")}</Text>
          <Text style={styles.text}>◎ {i18n.tt(BIZ_SCOPE.wallet, "backup-desc3")}</Text>
        </View>
        <Button
          title={
            this.isBackup ? i18n.tt(BIZ_SCOPE.wallet, "backup-backup") : i18n.tt(BIZ_SCOPE.wallet, "backup-explore")
          }
          onPress={this.nextButtonOnPress.bind(this)}
          containerStyle={styles.nextButtonContainer}
          buttonStyle={styles.nextButton}></Button>
        {!!this.isBackup && (
          <TouchableHighlight activeOpacity={0.6} underlayColor="transparent" onPress={this._onSkipButtonPress}>
            <Text style={styles.skip}>{i18n.tt(BIZ_SCOPE.common, "later_1")}</Text>
          </TouchableHighlight>
        )}
      </View>
    );
  }
}

const styles = StyleSheet.create({
  main: {
    flex: 1,
    paddingHorizontal: 16,
  },
  card: {
    marginVertical: padding(30),
    paddingVertical: padding(20),
    paddingHorizontal: padding(16),
    backgroundColor: "#FFFFFF",
    borderRadius: 3,
  },
  text: {
    fontSize: 14,
    color: theme.textColor.mainTitle,
    lineHeight: 23,
  },
  title: {
    fontSize: 16,
    lineHeight: 22,
    color: theme.textColor.primary,
    fontWeight: theme.fontWeight.medium,
    marginBottom: 12,
  },
  nextButtonContainer: {
    // flex: 1
  },
  nextButton: {
    width: "100%",
    height: 50,
    borderRadius: 3,
    backgroundColor: theme.brandColor,
    elevation: 0,
  },
  skip: {
    color: theme.linkColor,
    fontSize: 18,
    marginTop: 30,
    alignSelf: "center",
  },
});
