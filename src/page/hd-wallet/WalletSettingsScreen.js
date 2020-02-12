import React, { Component } from "react";
import { StyleSheet, View, TouchableHighlight, Image, Text } from "react-native";
import Screen from "../Screen";
import { computed } from "mobx";
import theme from "../../util/Theme";
import i18n from "../../module/i18n/i18n";
import { observer } from "mobx-react";
import {
  COIN_ID_BTC,
  HDACCOUNT_FIND_WALELT_TYPE_COINID,
  BTC_ADDRESS_TYPE_SH,
  BTC_ADDRESS_TYPE_PKH,
} from "../../config/const";
import AccountStore from "../../module/wallet/account/AccountStore";
import HDAccount from "../../module/wallet/account/HDAccount";
import MultiSigAccount from "../../module/wallet/account/MultiSigAccount";
import MyAddressesScreen from "./MyAddressesScreen";
import SegwitQAScreen from "./SegwitQAScreen";
import ProgressHUD from "../../component/common/ProgressHUD";

@observer
class WalletSettingsScreen extends Screen {
  static get screenID() {
    return "WalletSettingsScreen";
  }

  @computed get account() {
    return AccountStore.match(this.props.accountID);
  }

  @computed get wallet() {
    if (this.account instanceof HDAccount) {
      return this.account.findWallet(this.props.coinID, HDACCOUNT_FIND_WALELT_TYPE_COINID);
    } else if (this.account instanceof MultiSigAccount) {
      return this.account.findWallet(this.props.walletID);
    }
  }

  @computed get segwitEnabled() {
    return this.account instanceof HDAccount;
  }

  handleHUDRef = ref => (this.hud = ref);

  onHistoryPress = () => {
    this.navigator.push({
      title: i18n.t("wallet-title-address"),
      screen: MyAddressesScreen.screenID,
      passProps: {
        coinID: COIN_ID_BTC,
        accountID: this.account.id,
        walletID: this.wallet.id,
      },
    });
  };
  onNormalAddressPress = async () => {
    const address = await this.wallet.generatorAddress(BTC_ADDRESS_TYPE_PKH);
    this.wallet.setCurrentAddress(address);
    this.navigator.pop();
  };
  onSegWitAddressPress = async () => {
    const address = await this.wallet.generatorAddress(BTC_ADDRESS_TYPE_SH);
    this.wallet.setCurrentAddress(address);
    this.navigator.pop();
  };
  onSegWitQaPress = () => {
    this.props.navigator.push({
      screen: SegwitQAScreen.screenID,
      title: i18n.t("wallet-settings-segwit-qa"),
    });
  };
  render() {
    return (
      <View style={styles.main}>
        <View style={styles.barrier} />
        <Cell title={i18n.t("wallet-settings-history-address")} onPress={this.onHistoryPress} />
        <View style={styles.separator} />
        <Cell title={i18n.t("wallet-settings-new-address-normal")} onPress={this.onNormalAddressPress} />
        {this.segwitEnabled && [
          <View key="1" style={styles.separator} />,
          <Cell key="2" title={i18n.t("wallet-settings-new-address-segwit")} onPress={this.onSegWitAddressPress} />,
          <View key="3" style={styles.barrier} />,
          <Cell key="4" title={i18n.t("wallet-settings-segwit-qa")} onPress={this.onSegWitQaPress} />,
        ]}
        <ProgressHUD ref={this.handleHUDRef} />
      </View>
    );
  }
}

const styles = StyleSheet.create({
  main: {
    flex: 1,
  },
  separator: {
    marginLeft: 16,
    height: StyleSheet.hairlineWidth,
    backgroundColor: theme.borderColor,
  },
  barrier: {
    height: 12,
    backgroundColor: theme.backgroundColor,
  },
});

class Cell extends Component {
  @computed get title() {
    return this.props.title;
  }
  onPress = () => {
    this.props.onPress && this.props.onPress();
  };
  render() {
    return (
      <TouchableHighlight underlayColor="transparent" activeOpacity={0.7} onPress={this.onPress}>
        <View style={cStyles.main}>
          <Text style={cStyles.title}>{this.title}</Text>
          <Image source={require("@img/icon/right_arrow.png")} />
        </View>
      </TouchableHighlight>
    );
  }
}

const cStyles = StyleSheet.create({
  main: {
    height: 48,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    backgroundColor: "#FFFFFF",
  },
  title: {
    color: theme.textColor.primary,
    fontSize: 16,
  },
});

export default WalletSettingsScreen;
