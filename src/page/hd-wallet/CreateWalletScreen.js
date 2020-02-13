import React, { Component } from "react";
import {
  StyleSheet,
  View,
  Text,
  Image,
  TouchableHighlight,
  TouchableWithoutFeedback,
} from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import { Button } from "react-native-elements";
import theme from "../../util/Theme";
import Screen from "../Screen";

import PasswordUtil from "../../util/PasswordUtil";
import { observable, computed } from "mobx";
import ProgressHUD from "../../component/common/ProgressHUD";
import { padding } from "../../util/UIAdapter";
import { observer, Observer } from "mobx-react";
import HDAccount from "../../module/wallet/account/HDAccount";
import errorHandler from "../../util/ErrorHandler";
import Tip from "../../component/common/Tip";
import BackupWalletScreen from "./BackupWalletScreen";
import i18n from "../../module/i18n/i18n";
import ActionSheet from "react-native-actionsheet";
import { BIZ_SCOPE } from "../../module/i18n/const";
import ForumItem from "../../component/common/ForumItem";
@observer
export default class CreateWalletScreen extends Screen {
  static get screenID() {
    return "CreateWallet";
  }
  static get title() {
    return i18n.tt(BIZ_SCOPE.wallet, "title-create");
  }
  static navigatorStyle = {
    ...Screen.navigatorStyle,
    disabledSimultaneousGesture: false,
  };
  @computed get icon() {
    return this.checked ? require("@img/icon/checked.png") : require("@img/icon/unchecked.png");
  }
  @observable checked = false;
  @observable pwd = "";
  @observable repwd = "";

  @computed get pwdLevel() {
    let pwd = this.pwd;
    let level = PasswordUtil.getLevel(pwd);

    return level;
  }
  @computed get pwdLevelTxt() {
    let pwd = this.pwd;
    if (!pwd) {
      return "";
    }
    let level = PasswordUtil.getLevel(pwd);
    if (level == 0) {
      return "弱";
    } else if (level == 1) {
      return "一般";
    } else if (level == 2) {
      return "强";
    } else {
      return "很强";
    }
  }
  sheetOptions = [
    i18n.t("wallet-create-mnemonic-type-en"),
    i18n.t("wallet-create-mnemonic-type-zh"),
    i18n.t("common-cancel"),
  ];
  @observable mnemonicWordType = 0;
  @computed get mnemonicWordTypeText() {
    return this.sheetOptions[this.mnemonicWordType];
  }
  onAgreementCheckBoxPress = () => {
    this.checked = !this.checked;
  };
  onAgreementPress = () => {
    this.props.navigator.push({
      screen: "Webview",
      title: "用户服务协议",
      passProps: {
        url: "https://www.renrenbit.com/index.html#/policy",
      },
    });
  };
  renderInputRightView = () => {
    const levelImgArr = [
      require("@img/icon/pwd_lv0.png"),
      require("@img/icon/pwd_lv2.png"),
      require("@img/icon/pwd_lv3.png"),
      require("@img/icon/pwd_lv4.png"),
    ];
    return (
      <Observer>
        {() =>
          this.pwdLevelTxt.length > 0 && (
            <View style={{ width: 36, flexDirection: "row", alignItems: "center", justifyContent: "center" }}>
              <Text style={styles.title}>{this.pwdLevelTxt}&nbsp;</Text>
              <Image source={levelImgArr[this.pwdLevel]} />
            </View>
          )
        }
      </Observer>
    );
  };
  render() {
    return (
      <View style={styles.main}>
        <KeyboardAwareScrollView
          enableOnAndroid={true}
          keyboardDismissMode="interactive"
          contentContainerStyle={styles.container}
          keyboardShouldPersistTaps="always">
          <Text style={[styles.note, { marginTop: 16 }]}>◎ {i18n.t("wallet-create-desc1")}</Text>
          <Text style={styles.note}>◎ {i18n.t("wallet-create-desc2")}</Text>
          <ForumItem
            title={i18n.t("wallet-create-setpwd")}
            onChangeText={text => (this.pwd = text)}
            placeholder={i18n.t("wallet-create-setpwd-placeholder")}
            style={styles.input}
            returnKeyType="done"
            secureTextEntry={true}
            renderInputRightView={this.renderInputRightView}
          />
          <ForumItem
            title={i18n.t("wallet-create-confirmpwd")}
            onChangeText={text => (this.repwd = text)}
            placeholder={i18n.t("wallet-create-confirmpwd-placeholder")}
            style={styles.input}
            returnKeyType="done"
            secureTextEntry={true}
          />
          <View style={styles.card}>
            <View style={[styles.row]}>
              <Text style={styles.desc}>{i18n.t("wallet-create-mnemonic-type")}</Text>
              <TouchableWithoutFeedback onPress={this.onMnemonicWordTypePress}>
                <View style={styles.mnemonicWordTypeWrap}>
                  <Text style={[styles.desc, { marginRight: 6 }]}>{this.mnemonicWordTypeText}</Text>
                  <Image source={require("@img/icon/arrow-right.png")} />
                </View>
              </TouchableWithoutFeedback>
            </View>
          </View>
          <TouchableWithoutFeedback onPress={this.onAgreementCheckBoxPress}>
            <View style={styles.checkbox}>
              <Image source={this.icon} />
              <Text style={styles.aggre}>{i18n.t("wallet-create-agreement-1")}</Text>
              <TouchableHighlight
                onPress={this.onAgreementPress}
                hitSlop={{ top: 10, bottom: 10, left: 20, right: 20 }}
                activeOpacity={0.6}
                underlayColor="transparent">
                <Text style={styles.agreement}> {i18n.t("wallet-create-agreement-2")}</Text>
              </TouchableHighlight>
            </View>
          </TouchableWithoutFeedback>
          <Button
            title={i18n.t("wallet-create-create")}
            disabled={!this.checked}
            onPress={this.nextButtonOnPress.bind(this)}
            containerStyle={styles.nextButtonContainer}
            buttonStyle={styles.nextButton}
          />
          <ProgressHUD ref={ref => (this.hud = ref)} />
          <Tip ref={ref => (this.tip = ref)} />
          <ActionSheet
            ref={ref => (this.sheet = ref)}
            onPress={this.onActionSheetItemPress}
            cancelButtonIndex={this.sheetOptions.length - 1}
            options={this.sheetOptions}
          />
        </KeyboardAwareScrollView>
      </View>
    );
  }
  onMnemonicWordTypePress = () => {
    this.sheet.show();
  };
  onActionSheetItemPress = index => {
    if (index == this.sheetOptions.length - 1) {
      return;
    }
    this.mnemonicWordType = index;
  };
  async nextButtonOnPress() {
    if (this.isVaildInput()) {
      this.hud && this.hud.showLoading();
      try {
        const mnemonicWords = await HDAccount.create("HD钱包", this.pwd, this.mnemonicWordType);
        this.hud && this.hud.dismiss();
        this.props.navigator.push({
          screen: BackupWalletScreen.screenID,
          title: i18n.t("wallet-title-backup-mnemonic"),
          passProps: {
            mnemonicWords: mnemonicWords,
          },
        });
      } catch (error) {
        this.hud && this.hud.dismiss();
        errorHandler(error);
      }
    }
  }
  isVaildInput() {
    let pwd = this.pwd || "";
    let repwd = this.repwd || "";

    let flag = PasswordUtil.checkPasswordWithTip(pwd, repwd);

    if (!flag) {
      return false;
    }

    if (!this.checked) {
      this.tip && this.tip.showInfo("请先同意 《RenrenBit服务协议》");
      return false;
    }

    return true;
  }
}

const styles = StyleSheet.create({
  main: {
    flex: 1,
    backgroundColor: theme.backgroundColor,
  },
  container: {},
  card: {
    marginTop: 12,
    // paddingHorizontal: 16,
    // backgroundColor: '#FFFFFF',
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    backgroundColor: "#FFFFFF",
    // marginLeft: padding(16),
    paddingVertical: padding(16),
    paddingRight: padding(16),
    paddingLeft: padding(16),
    flex: 1,
  },
  border: {
    borderColor: "transparent",
    borderBottomColor: theme.borderColor,
    borderWidth: StyleSheet.hairlineWidth,
  },
  desc: {
    color: theme.textColor.primary,
    textAlignVertical: "center",
    fontSize: 16,
    marginRight: 12,
  },
  input: {
    marginTop: 12,
  },
  mnemonicWordTypeWrap: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "flex-end",
  },
  title: {
    fontSize: 14,
    color: theme.textColor.minorTitle2,
  },
  nextButtonContainer: {
    flex: 1,
    marginHorizontal: padding(16),
    marginTop: padding(30),
  },
  nextButton: {
    width: "100%",
    height: 50,
    borderRadius: 3,
    backgroundColor: theme.brandColor,
    elevation: 0,
  },
  note: {
    marginHorizontal: padding(16),
    color: theme.textColor.mainTitle,
    fontSize: 12,
    lineHeight: 19,
  },
  checkbox: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: padding(16),
    marginTop: 20,
  },
  aggre: {
    marginLeft: 12,
    fontSize: 14,
    color: theme.textColor.mainTitle,
  },
  agreement: {
    fontSize: 14,
    color: "#007AFF",
    position: "relative",
    top: -1,
  },
});
