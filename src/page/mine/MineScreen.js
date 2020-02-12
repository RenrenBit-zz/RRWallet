import React, { Component, PureComponent } from "react";
import { StyleSheet, View, Text, Switch, ScrollView, Dimensions } from "react-native";

import Cell from "../../component/common/Cell";
import ProgressHUD from "../../component/common/ProgressHUD";
import Theme from "../../util/Theme";

import { observer } from "mobx-react";
import theme from "../../util/Theme";
import Screen from "../Screen";
import msgCenter from "../../module/msg-center/MessageCenter";
import { computed } from "mobx";
import { padding } from "../../util/UIAdapter";
import AccountStore from "../../module/wallet/account/AccountStore";
import DeviceSecurity from "../../module/security/DeviceSecurity";
import ImportHDWalletScreen from "../hd-wallet/ImportHDWalletScreen";
import CreateWalletScreen from "../hd-wallet/CreateWalletScreen";
import UnlockPasswordSettingScreen from "./UnlockPasswordSettingScreen";
import BackupWalletScreen from "../hd-wallet/BackupWalletScreen";
import AppInfo from "../../module/app/AppInfo";
import Tip from "../../component/common/Tip";
import i18n from "../../module/i18n/i18n";
import CurrencyScreen from "./CurrencyScreen";
import CoinStore from "../../module/wallet/wallet/CoinStore";
import { CURRENCY_TYPE_CNY } from "../../config/const";
import LanauageScreen from "./LanguageScreen";
import { BIZ_SCOPE } from "../../module/i18n/const";
import Header from "../../component/common/Header";

@observer
export default class MineScreen extends Screen {
  static get screenID() {
    return "MineScreen";
  }
  static navigatorStyle = {
    ...Screen.navigatorStyle,
    statusBarTextColorSchemeSingleScreen: "dark",
    navBarButtonColor: "#FFFFFF",
    tabBarHidden: true,
  };

  constructor(props) {
    super(props);
    this.props.navigator.addOnNavigatorEvent(this.onNavigatorEvent.bind(this));
  }

  onNavigatorEvent(event) {
    if (event.type == "NavBarButtonPress") {
      switch (event.id) {
        case "gotoContactList": {
          this.goConcatList();
          break;
        }
        default:
          break;
      }
    }
  }

  goCurrency = () => {
    this.props.navigator.push({
      screen: CurrencyScreen.screenID,
      title: i18n.tt(BIZ_SCOPE.mine, "item-currency"),
    });
  };
  goLanguage = () => {
    this.props.navigator.push({
      screen: LanauageScreen.screenID,
      title: i18n.tt(BIZ_SCOPE.mine, "item-language"),
    });
  };
  goConcatList = () => {
    this.props.navigator.push({
      screen: "ContactScreen",
      title: i18n.tt(BIZ_SCOPE.mine, "item-contact"),
    });
  };

  goMsgList = () => {
    this.props.navigator.push({
      screen: "MsgListScreen",
      title: i18n.t("common-message"),
      passProps: {
        msgTypeId: 1,
      },
    });
  };

  goAbout = () => {
    this.props.navigator.push({
      screen: "AboutScreen",
      title: i18n.tt(BIZ_SCOPE.mine, "item-about"),
    });
  };

  goCreateWallet = () => {
    this.props.navigator.push({
      screen: CreateWalletScreen.screenID,
      title: i18n.t("wallet-title-create"),
    });
  };
  goDisplayMnemonic = () => {
    if (AccountStore.defaultHDAccount.hasBackup) {
      this.props.navigator.push({
        screen: BackupWalletScreen.screenID,
        title: i18n.t("wallet-backup-explore"),
        passProps: {
          type: "display",
        },
      });
    } else {
      this.props.navigator.push({
        screen: BackupWalletScreen.screenID,
        title: i18n.t("wallet-title-backup-mnemonic"),
      });
    }
  };
  goImportWallet = () => {
    this.props.navigator.push({
      screen: ImportHDWalletScreen.screenID,
      title: AccountStore.defaultHDAccount.hasCreated ? i18n.t("wallet-title-import") : i18n.t("wallet-title-recovery"),
      passProps: {
        type: AccountStore.defaultHDAccount.hasCreated ? "import" : "",
      },
    });
  };

  handlePwdDialogRef = ref => (this.pwdDialog = ref);

  renderHDSection() {
    const payment = i18n.select({
      zh:
        (DeviceSecurity.HDSecurityType === "FaceID" ? i18n.t("mine-item-faceid") : i18n.t("mine-item-touchid")) +
        i18n.t("mine-item-pay"),
      en: "Biometric Payment",
    });

    const create = (
      <Cell
        key={"hd-4"}
        title={i18n.t("mine-item-create")}
        onPress={this.goCreateWallet}
        source={require("@img/mine/mine_create_wallet.png")}
        containerStyle={styles.cellContainer}
        titleStyle={styles.cellText}
      />
    );
    const display = (
      <Cell
        key={"hd-5"}
        title={AccountStore.defaultHDAccount.hasBackup ? i18n.t("mine-item-viewword") : i18n.t("mine-item-backupword")}
        onPress={this.goDisplayMnemonic}
        source={require("@img/mine/mine_display_mnemonic.png")}
        containerStyle={styles.cellContainer}
        titleStyle={styles.cellText}
      />
    );
    const cells = [
      <SectionHeader key={"hd-1"} title={i18n.t("mine-section-hd")} />,
      AccountStore.defaultHDAccount.hasCreated ? display : create,
      <Separator key={"hd-2"} />,
      <Cell
        key={"hd-3"}
        title={AccountStore.defaultHDAccount.hasCreated ? i18n.t("mine-item-import") : i18n.t("mine-item-recovery")}
        onPress={this.goImportWallet}
        source={require("@img/mine/mine_import.png")}
        containerStyle={styles.cellContainer}
        titleStyle={styles.cellText}
      />,
    ];

    return cells;
  }
  onLockScreenPwdValueChange = value => {
    this.props.navigator.push({
      title: "设置锁屏密码",
      screen: UnlockPasswordSettingScreen.screenID,
      passProps: {
        // type: value
      },
    });
  };
  onHDSecurityValueChange = value => {
    if (!DeviceSecurity.lockScreenPwdEnable) {
      this.tip &&
        this.tip.showInfo({
          title: "注意",
          message: "请先设置锁屏密码",
          buttons: [
            { title: "取消" },
            {
              title: "确认",
              onPress: () => {
                setTimeout(() => {
                  this.onLockScreenPwdValueChange();
                }, 500);
              },
            },
          ],
        });
      return;
    }
    DeviceSecurity.enableHDSecurity(value);
  };
  renderCommonSection() {
    const biometric = i18n.select({
      zh:
        (DeviceSecurity.HDSecurityType === "FaceID" ? i18n.t("mine-item-faceid") : i18n.t("mine-item-touchid")) +
        i18n.t("mine-item-unlock"),
      en: "Biometric Verification",
    });
    return [
      <SectionHeader title={i18n.t("mine-section-common")} />,
      <Cell
        title={i18n.t("mine-item-lockpwd")}
        detail={DeviceSecurity.lockScreenPwdEnable ? i18n.t("common-status-open") : i18n.t("common-status-close")}
        onPress={this.onLockScreenPwdValueChange}
        source={require("@img/mine/mine_lock.png")}
        containerStyle={styles.cellContainer}
        titleStyle={styles.cellText}
      />,
      <Separator />,
      DeviceSecurity.HDSecurityCapability ? (
        <Cell
          title={biometric}
          hideRightArrow={true}
          source={require("@img/mine/mine_faceid.png")}
          containerStyle={styles.cellContainer}
          titleStyle={styles.cellText}
          rightNode={<Switch value={DeviceSecurity.HDSecurityEnable} onValueChange={this.onHDSecurityValueChange} />}
        />
      ) : null,
      DeviceSecurity.HDSecurityCapability ? <Separator /> : null,
      <Cell
        title={i18n.t("mine-item-currency")}
        detail={CoinStore.currency === CURRENCY_TYPE_CNY ? i18n.t("mine-currency-rmb") : i18n.t("mine-currency-usd")}
        onPress={this.goCurrency}
        source={require("@img/mine/mine_currency.png")}
        containerStyle={styles.cellContainer}
        titleStyle={styles.cellText}
      />,
      <Separator />,
      <Cell
        title={i18n.t("mine-item-contact")}
        onPress={this.goConcatList}
        source={require("@img/mine/mine_contact.png")}
        containerStyle={styles.cellContainer}
        titleStyle={styles.cellText}
      />,
      <Separator />,
      <Cell
        title={i18n.t("mine-item-language")}
        detail={i18n.select({ zh: "简体中文", en: "English" })}
        onPress={this.goLanguage}
        source={require("@img/mine/mine_language.png")}
        containerStyle={styles.cellContainer}
        titleStyle={styles.cellText}
      />,
      <Separator />,
      <Cell
        title={i18n.t("mine-item-about")}
        onPress={this.goAbout}
        source={require("@img/mine/mine_about.png")}
        containerStyle={styles.cellContainer}
        titleStyle={styles.cellText}
        rightNode={!!AppInfo.hasNewerVersion && <View style={styles.redDot} />}
      />,
    ];
  }
  render() {
    return (
      <View style={styles.main}>
        <Header title={i18n.tt(BIZ_SCOPE.common, "tab-mine")} titleColor={"#000000"} bottomBorder={true} />
        <ProgressHUD ref={ref => (this.hud = ref)} position="absoluteFill" />

        <ScrollView style={styles.scrollView} keyboardShouldPersistTaps="always" showsVerticalScrollIndicator={false}>
          <View style={{ backgroundColor: Theme.bgColor }}>
            <Cell
              title={i18n.t("mine-item-message")}
              onPress={this.goMsgList}
              noticeNum={msgCenter.totalCount}
              source={require("@img/mine/mine_message.png")}
              containerStyle={[styles.cellContainer, { marginTop: 20 }]}
              titleStyle={styles.cellText}
            />
            {this.renderHDSection()}
            {this.renderCommonSection()}
          </View>
        </ScrollView>
        <Tip ref={o => (this.tip = o)} />
      </View>
    );
  }
}

const styles = StyleSheet.create({
  main: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  scrollView: {},
  cellTitle: {
    fontSize: 14,
    color: Theme.textColor.minorTitle2,
    paddingLeft: 16,
    marginTop: 12,
    marginBottom: 12,
  },
  logoutText: {
    fontSize: 14,
    color: "#EB4E35",
  },
  cellContainer: {
    height: 56,
    justifyContent: "center",
  },
  cellText: {
    fontSize: 16,
    color: "#000",
  },
  redDot: {
    backgroundColor: theme.assistColor_red,
    borderRadius: 4,
    width: 8,
    height: 8,
  },
});

class SectionHeader extends PureComponent {
  render() {
    return (
      <View style={shStyles.main}>
        <Text style={shStyles.title}>{this.props.title}</Text>
      </View>
    );
  }
}

const shStyles = StyleSheet.create({
  main: {
    height: 32,
    justifyContent: "center",
    marginLeft: padding(16),
  },
  title: {
    fontSize: 12,
    color: theme.textColor.mainTitle,
  },
});
class Separator extends PureComponent {
  render() {
    return (
      <View style={sStyles.main}>
        <View style={sStyles.separator} />
      </View>
    );
  }
}

const sStyles = StyleSheet.create({
  main: {
    paddingLeft: 52,
    backgroundColor: "#FFFFFF",
    height: StyleSheet.hairlineWidth,
  },
  separator: {
    backgroundColor: theme.borderColor,
    height: StyleSheet.hairlineWidth,
  },
});
