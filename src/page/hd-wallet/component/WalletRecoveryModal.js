import React, { Component } from "react";
import { View, StyleSheet, Text, TextInput, KeyboardAvoidingView, Platform, ScrollView } from "react-native";
import i18n from "../../../module/i18n/i18n";
import device from "../../../util/device";
import theme from "../../../util/Theme";
import { observer } from "mobx-react";
import { observable, action, computed } from "mobx";
import { Button } from "react-native-elements";
import AccountStore from "../../../module/wallet/account/AccountStore";
import HDAccount from "../../../module/wallet/account/HDAccount";
import ProgressHUD from "../../../component/common/ProgressHUD";
import { ACCOUNT_TYPE_HD_IMPORT } from "../../../config/const";

@observer
export default class WalletRecoveryModal extends Component {
  @observable pwd = "";
  @computed get disabled() {
    return !this.pwd || this.pwd.length < 8;
  }
  @action onChangePwd = pwd => {
    this.pwd = pwd;
  };
  onConfirmPress = async () => {
    try {
      const mnemonic = await AccountStore.defaultHDAccount.exportMnemonic(this.pwd);
      this.hud && this.hud.showLoading();
      await HDAccount.recovery(mnemonic, i18n.t("wallet-title-index"), this.pwd, ACCOUNT_TYPE_HD_IMPORT, true);
    } catch (error) {
      this.hud && this.hud.showFailed(error.message);
    }
  };
  render() {
    return (
      <View style={styles.main}>
        <KeyboardAvoidingView behavior={Platform.select({ ios: "padding", android: null })}>
          <View style={styles.container}>
            <View style={styles.titleWrap}>
              <Text style={styles.title}>{i18n.t("wallet-hdindex-recovery-title")}</Text>
            </View>
            <Text style={styles.desc}>◎{i18n.t("wallet-hdindex-recovery-desc1")}</Text>
            <TextInput
              style={styles.input}
              placeholder={i18n.t("wallet-hdindex-recovery-pwdinput-placeholder")}
              onChangeText={this.onChangePwd}
              secureTextEntry={true}
              clearButtonMode={"while-editing"}
            />
            <Button
              title={i18n.t("common-determine")}
              containerStyle={styles.buttonContainerStyle}
              onPress={this.onConfirmPress}
              disabled={this.disabled}
            />
          </View>
        </KeyboardAvoidingView>
        <ProgressHUD ref={ref => (this.hud = ref)} />
      </View>
    );
  }
}

const height =
  device.windowSize.height - device.navBarHeight - device.tabBarHeight + Platform.select({ ios: 0, android: 20 });
const styles = StyleSheet.create({
  main: {
    position: "absolute",
    width: device.windowSize.width,
    height: height,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#00000099",
  },
  container: {
    borderRadius: 12,
    backgroundColor: "#FFFFFF",
    padding: 16,
    paddingTop: 0,
    width: 300,
  },
  titleWrap: {
    alignItems: "center",
    borderBottomColor: theme.borderColor,
    borderBottomWidth: StyleSheet.hairlineWidth,
    marginBottom: 15,
  },
  title: {
    marginVertical: 16,
    fontSize: 18,
    fontWeight: theme.fontWeight.medium,
    color: theme.textColor.primary,
  },
  desc: {
    marginTop: 6,
    fontSize: 14,
    lineHeight: 18,
  },
  input: {
    marginTop: 13,
    borderRadius: 3,
    height: 50,
    paddingHorizontal: 16,
    fontSize: 14,
    backgroundColor: theme.backgroundColor,
    borderColor: theme.borderColor,
    borderWidth: StyleSheet.hairlineWidth,
  },
  buttonContainerStyle: {
    marginTop: 20,
    marginBottom: 14,
  },
  buttonStyle: {
    borderRadius: 3,
    height: 50,
    backgroundColor: theme.brandColor,
  },
});
