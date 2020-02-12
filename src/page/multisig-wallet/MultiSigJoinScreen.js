import React, { Component, PureComponent } from "react";
import { observer } from "mobx-react";
import { StyleSheet, View, Text, TextInput } from "react-native";
import Screen from "../Screen";
import { Button } from "react-native-elements";
import { action, computed, observable } from "mobx";
import theme from "../../util/Theme";
import i18n from "../../module/i18n/i18n";
import BTCMultiSigWallet from "../../module/wallet/wallet/btc/BTCMultiSigWallet";
import AccountStore from "../../module/wallet/account/AccountStore";
import ProgressHUD from "../../component/common/ProgressHUD";

@observer
class MultiSigJoinScreen extends Screen {
  static get screenID() {
    return "MultiSigJoinScreen";
  }

  static navigatorButtons = {
    leftButtons: Screen.navigatorButtons.leftButtons,
    rightButtons: [
      {
        id: "scan_qrcode",
        icon: require("@img/nav/nav_scan.png"),
      },
    ],
  };

  handleHUDRef = ref => (this.hud = ref);

  @computed get disabled() {
    if (this.forumData.nick.trim().length == 0 || this.forumData.code.trim().length == 0) {
      return true;
    }
    return false;
  }

  @observable forumData = {
    nick: "",
    code: "",
  };

  constructor(props) {
    super(props);
    this.navigator.addOnNavigatorEvent(this.onNavigatorEvent);
  }

  onNavigatorEvent = event => {
    if (event.type == "NavBarButtonPress") {
      switch (event.id) {
        case "scan_qrcode":
          this.onScanPress();
          break;
      }
    }
  };

  @action onChangeNick = text => {
    this.forumData.nick = text;
  };

  @action onChangeCode = text => {
    this.forumData.code = text;
  };

  onScanPress = () => {
    this.props.navigator.push({
      title: i18n.t("wallet-title-scan"), //'选择联系人',
      screen: "ScanQRCodeScreen", //'ContactList',
      passProps: {
        onBarCodeRead: this.onScanQRCode,
      },
    });
  };

  onJoinPress = async () => {
    const include = !!AccountStore.defaultMultiSigAccount.findWallet(this.forumData.code);
    if (include) {
      this.hud && this.hud.showFailed(i18n.t("wallet-multisig-join-include-errmsg"));
      return;
    }

    const nick = this.forumData.nick.trim();
    const isVaildNick = /^[\u0391-\uFFE5A-Za-z\d_-]{1,20}$/.test(nick);
    if (!isVaildNick) {
      this.hud && this.hud.showFailed(i18n.t("wallet-multisig-create-nick-invaild"));
      return;
    }

    try {
      this.hud && this.hud.showLoading();
      await BTCMultiSigWallet.join({
        walletID: this.forumData.code,
        nick,
        extendedPublicKey: AccountStore.defaultHDAccount.BTCWallet.extendedPublicKey,
      });
      this.hud && this.hud.showSuccess(i18n.t("wallet-multisig-join-success"));
      setTimeout(() => {
        this.navigator.popToRoot();
      }, 1000 * 1);
    } catch (error) {
      this.hud && this.hud.showFailed(error.message);
    }
  };

  onScanQRCode = ({ data }) => {
    if (!data) {
      return;
    }
    this.forumData.code = data;
    this.navigator.pop();
  };

  render() {
    return (
      <View style={styles.main}>
        <View style={styles.card}>
          <ForumItemInput
            title={i18n.t("wallet-multisig-create-nick")}
            placeholder={i18n.t("wallet-multisig-create-nick-placeholder")}
            onChangeText={this.onChangeNick}
          />
          <View style={styles.separator} />
          <ForumItemInput
            title={i18n.t("wallet-multisig-join-code")}
            placeholder={i18n.t("wallet-multisig-join-code-placeholder")}
            onChangeText={this.onChangeCode}
            value={this.forumData.code}
          />
        </View>
        <Button
          title={i18n.t("wallet-multisig-join-button")}
          buttonStyle={styles.button}
          titleStyle={styles.buttonTitle}
          disabled={this.disabled}
          onPress={this.onJoinPress}
        />
        <ProgressHUD ref={this.handleHUDRef} />
      </View>
    );
  }
}

const styles = StyleSheet.create({
  main: {
    flex: 1,
    paddingTop: 12,
  },
  card: {
    backgroundColor: "#FFFFFF",
  },
  button: {
    height: 50,
    borderRadius: 3,
    marginHorizontal: 16,
    marginTop: 30,
    backgroundColor: theme.linkColor,
    elevation: 0,
  },
  buttonTitle: {
    fontSize: 18,
  },
  separator: {
    backgroundColor: theme.borderColor,
    height: StyleSheet.hairlineWidth,
    marginHorizontal: 16,
  },
});

class ForumItemInput extends PureComponent {
  onChangeText = text => {
    const { onChangeText } = this.props;
    onChangeText && onChangeText(text);
  };
  render() {
    const { title, placeholder, value } = this.props;
    return (
      <View style={fiiStyles.main}>
        <Text style={fiiStyles.title}>{title}</Text>
        <TextInput
          style={fiiStyles.input}
          placeholder={placeholder}
          placeholderTextColor={theme.textColor.placeHolder}
          onChangeText={this.onChangeText}
          value={value}
        />
      </View>
    );
  }
}

const fiiStyles = StyleSheet.create({
  main: {
    flexDirection: "row",
    alignItems: "center",
    height: 48,
    paddingHorizontal: 16,
    backgroundColor: "#FFFFFF",
  },
  title: {
    fontSize: 16,
    lineHeight: 16,
    color: theme.textColor.primary,
  },
  input: {
    flex: 1,
    fontSize: 16,
    // lineHeight: 16,
    color: theme.textColor.primary,
    textAlign: "right",
  },
});

export default MultiSigJoinScreen;
