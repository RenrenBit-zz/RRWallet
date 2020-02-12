import Screen from "../Screen";
import React, { Component } from "react";
import { StyleSheet, View, ScrollView, Text, Image, TouchableHighlight, Clipboard } from "react-native";
import theme from "../../util/Theme";
import i18n from "../../module/i18n/i18n";
import AccountStore from "../../module/wallet/account/AccountStore";
import PasswordDialog from "../hd-wallet/component/PasswordDialog";
import ProgressHUD from "../../component/common/ProgressHUD";
import MultiSigWallet from "../../module/wallet/wallet/MultiSigWallet";
import { computed, observable } from "mobx";
import { sleep } from "../../util/Timer";
class MultiSigWalletInfoScreen extends Screen {
  static get screenID() {
    return "MultiSigWalletInfoScreen";
  }

  static navigatorButtons = {
    rightButtons: [
      {
        id: "delete",
        buttonColor: theme.linkColor,
        title: i18n.t("common-delete"),
      },
    ],
  };

  /**
   *
   * @type {MultiSigWallet}
   * @memberof MultiSigWalletInfoScreen
   */
  @observable wallet = AccountStore.defaultMultiSigAccount.findWallet(this.props.walletID);

  @computed get members() {
    return this.wallet.members.slice().sort((a, b) => a.timestamp - b.timestamp);
  }

  constructor(props) {
    super(props);
    this.props.navigator.addOnNavigatorEvent(this.onNavigatorEvent);
  }

  handleDialogRef = ref => (this.pwdDialog = ref);

  handleHUDRef = ref => (this.hud = ref);

  onNavigatorEvent = event => {
    switch (event.id) {
      case "delete":
        this.onDeletePress();
        break;
      default:
        break;
    }
  };
  onDeletePress = async () => {
    const pwd = await this.pwdDialog.show();
    const isValid = await this.wallet.isVaildPassword(pwd);
    if (!isValid) {
      this.hud && this.hud.showFailed(i18n.t("common-password-incorrect"));
      return;
    }
    AccountStore.defaultMultiSigAccount.deleteWallet(this.wallet.id);
    this.hud && this.hud.showSuccess(i18n.t("wallet-multisig-walletinfo-delete-success"));
    await sleep(600);
    this.props.navigator.pop();
  };

  onWalletIdPress = () => {
    Clipboard.setString(this.wallet.id);
    this.hud.showSuccess(i18n.t("common-copy-success"));
  };
  render() {
    return (
      <ScrollView style={styles.main} keyboardShouldPersistTaps={"always"}>
        <View style={styles.card}>
          <View style={styles.row}>
            <Text style={styles.title}>{i18n.t("wallet-multisig-walletinfo-name")}</Text>
            <Text style={styles.desc}>{this.wallet.name}</Text>
          </View>
          <View style={styles.separator} />
          <View style={styles.row}>
            <Text style={styles.title}>{i18n.t("wallet-multisig-walletinfo-cointype")}</Text>
            <Text style={styles.desc}>BTC、USDT</Text>
          </View>
          <View style={styles.separator} />
          <View style={styles.row}>
            <Text style={styles.title}>{i18n.t("wallet-multisig-walletinfo-addresstype")}</Text>
            <Text style={styles.desc}>P2SH</Text>
          </View>
          <View style={styles.separator} />
          <View style={styles.row}>
            <Text style={styles.title}>{i18n.t("wallet-multisig-walletinfo-extendedtype")}</Text>
            <Text style={styles.desc}>BIP44</Text>
          </View>
        </View>
        <View style={styles.card}>
          <View style={styles.row}>
            <Text style={styles.title}>{i18n.t("wallet-multisig-walletinfo-id")}</Text>
          </View>
          <View style={styles.separator} />
          <View />
          <TouchableHighlight onPress={this.onWalletIdPress} underlayColor="transparent" activeOpacity={0.7}>
            <View style={styles.row}>
              <View style={{ flex: 1 }}>
                <Text style={styles.desc} numberOfLines={1} ellipsizeMode={"middle"}>
                  {this.wallet.id}
                </Text>
              </View>
              <Image style={styles.copy} source={require("@img/wallet/wallet_copy.png")} />
            </View>
          </TouchableHighlight>
        </View>
        <Text style={styles.members}>{i18n.t("wallet-multisig-walletinfo-members")}</Text>
        <View style={[styles.card, { marginTop: 0 }]}>
          {this.members.map((member, i) => (
            <View>
              <View style={styles.row}>
                <Text style={[styles.title, { flex: 0 }]}>{member.nick}</Text>
                {member.extendedPublicKey === this.wallet.founder.extendedPublicKey && (
                  <Image style={styles.founder} source={require("@img/wallet/multisig-info-founder.png")} />
                )}
              </View>
              {i != this.members.length - 1 && <View style={styles.separator} />}
            </View>
          ))}
        </View>
        <ProgressHUD ref={this.handleHUDRef} />
        <PasswordDialog ref={this.handleDialogRef} />
      </ScrollView>
    );
  }
}

const styles = StyleSheet.create({
  main: {
    flex: 1,
  },
  card: {
    marginTop: 12,
    paddingLeft: 16,
    paddingRight: 20,
    backgroundColor: "#FFFFFF",
  },
  row: {
    flexDirection: "row",
    height: 48,
    alignItems: "center",
  },
  title: {
    flex: 1,
    fontSize: 16,
    color: theme.textColor.primary,
  },
  desc: {
    fontSize: 16,
    color: theme.textColor.mainTitle,
  },
  members: {
    marginLeft: 16,
    marginVertical: 10,
    fontSize: 12,
    color: theme.textColor.mainTitle,
  },
  separator: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: theme.borderColor,
  },
  founder: {
    marginLeft: 6,
  },
});

export default MultiSigWalletInfoScreen;
