import Screen from "../Screen";
import { StyleSheet, View, Text, TouchableHighlight, Image, ScrollView, Clipboard } from "react-native";
import QRCode from "react-native-qrcode-svg";
import React, { PureComponent, Component } from "react";
import { observer } from "mobx-react";
import { computed, when } from "mobx";
import theme from "../../util/Theme";
import AccountStore from "../../module/wallet/account/AccountStore";
import MultiSigWallet from "../../module/wallet/wallet/MultiSigWallet";
import i18n from "../../module/i18n/i18n";
import Header from "../../component/common/Header";
import moment from "moment";
import ProgressHUD from "../../component/common/ProgressHUD";
import MessageBox from "@CC/MessageBox";

@observer
class MultiSigPendingWalletScreen extends Screen {
  static get screenID() {
    return "MultiSigPendingWalletScreen";
  }
  static navigatorButtons = {
    leftButtons: [
      {
        id: "close",
        icon: require("@img/nav/nav_close.png"),
        buttonColor: "#FFFFFF",
      },
    ],
  };

  @computed get rightButtons() {
    if (this.wallet.founder !== this.wallet.self) {
      return [];
    }
    return [
      {
        id: "cancel",
        title: i18n.t("common-delete"),
        buttonColor: "#FFFFFF",
      },
    ];
  }
  static navigatorStyle = {
    ...theme.navigatorStyle,
    statusBarTextColorSchemeSingleScreen: "light",
    navBarHidden: true,
  };
  /**
   *
   * @type {MultiSigWallet}
   * @memberof MultiSigPendingWalletScreen
   */
  wallet = AccountStore.defaultMultiSigAccount.findWallet(this.props.walletID);

  handleHUDRef = ref => (this.hud = ref);

  /**
   *
   * @param {MessageBox} ref
   * @memberof MultiSigPendingWalletScreen
   */
  handleMsgBoxRef = ref => (this.msgbox = ref);

  constructor(props) {
    super(props);
    this.navigator.addOnNavigatorEvent(this.onNavigatorEvent);

    when(
      () => this.wallet.isCompleted,
      () => {
        setTimeout(() => {
          this.navigator.dismissModal();
        }, 1000 * 1.5);
      }
    );
  }

  onNavigatorEvent = event => {
    if (event.type == "NavBarButtonPress") {
      switch (event.id) {
        case "cancel":
          this.onCancelPress();
          break;
        case "close":
          this.onClosePress();
          break;
      }
    }
  };

  onClosePress = () => {
    this.navigator.dismissModal();
  };

  onCancelPress = () => {
    this.msgbox.showConfirm({
      content: i18n.t("wallet-multisig-pending-cancel-desc"),
      onOk: () => {
        this.cancel();
      },
    });
  };

  onCopy = () => {
    Clipboard.setString(this.wallet.id);
    this.hud && this.hud.showSuccess(i18n.t("common-copy-success"));
  };

  cancel = async () => {
    this.hud && this.hud.showLoading();
    try {
      await AccountStore.defaultMultiSigAccount.deleteWallet(this.wallet.id);
      this.hud && this.hud.showSuccess(i18n.t("wallet-multisig-pending-cancel-success"));
      setTimeout(() => {
        this.navigator.dismissModal();
      }, 350);
    } catch (error) {
      this.hud && this.hud.showFailed(error.message);
    }
  };
  componentDidMount = async () => {
    this.hud && this.hud.showLoading();
    try {
      await this.wallet.updateWalletInfo();
    } catch (error) {}
    this.hud && this.hud.dismiss();
  };
  render() {
    return (
      <View style={styles.main}>
        <Header
          title={this.wallet.name}
          leftButtons={MultiSigPendingWalletScreen.navigatorButtons.leftButtons}
          rightButtons={this.rightButtons}
          navigator={this.props.navigator}
          style={styles.header}
          titleColor={"#FFFFFF"}
        />
        <ScrollView style={styles.scrollview}>
          <WalletDescCard wallet={this.wallet} onCopy={this.onCopy} />
          <MemberListCard wallet={this.wallet} />
        </ScrollView>
        <MessageBox ref={this.handleMsgBoxRef} />
        <ProgressHUD ref={this.handleHUDRef} />
      </View>
    );
  }
}

const styles = StyleSheet.create({
  main: {
    flex: 1,
  },
  scrollview: {
    backgroundColor: theme.business.multiSig,
    paddingHorizontal: 16,
    paddingTop: 20,
  },
  header: {
    backgroundColor: theme.business.multiSig,
  },
});

class WalletDescCard extends PureComponent {
  onCopyPress = async () => {
    this.props.onCopy && this.props.onCopy();
  };
  render() {
    const { wallet } = this.props;
    return (
      <View style={wdcStyles.main}>
        <Text style={wdcStyles.title}>{i18n.t("wallet-multisig-pending-title-desc")}</Text>
        <QRCode size={174} value={wallet.id} />
        <View style={wdcStyles.row}>
          <Text style={wdcStyles.code}>{i18n.t("wallet-multisig-join-code")}: </Text>
          <View style={{ flex: 1 }}>
            <Text style={wdcStyles.code} numberOfLines={1} ellipsizeMode="middle">
              {wallet.id}
            </Text>
          </View>
          <TouchableHighlight
            style={wdcStyles.saveWrap}
            hitSlop={{ top: 20, left: 20, right: 20, bottom: 20 }}
            onPress={this.onCopyPress}
            underlayColor="transparent"
            activeOpacity={0.7}>
            <Text style={wdcStyles.save}>{i18n.t("common-copy")}</Text>
          </TouchableHighlight>
        </View>
      </View>
    );
  }
}

const wdcStyles = StyleSheet.create({
  main: {
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 3,
  },
  row: {
    flexDirection: "row",
    paddingHorizontal: 16,
    marginVertical: 30,
  },
  title: {
    marginTop: 43,
    marginBottom: 46,
    fontSize: 16,
    color: theme.textColor.primary,
  },
  code: {
    fontSize: 14,
    color: theme.textColor.primary,
  },
  save: {
    fontSize: 14,
    color: theme.linkColor,
  },
  saveWrap: {
    marginLeft: 10,
  },
});

@observer
class MemberListCard extends Component {
  @computed get members() {
    return this.props.wallet.members;
  }
  render() {
    const { wallet } = this.props;
    return (
      <View style={mlcStyles.main}>
        <Text style={mlcStyles.title}>{i18n.t("wallet-multisig-pending-signer-title")}</Text>
        <View style={mlcStyles.separator} />
        {this.members.map(member => (
          <MemberInfoCell key={member.extendedPublicKey.key} member={member} />
        ))}
        {wallet.total > this.members.length && <JoiningCell />}
      </View>
    );
  }
}

const mlcStyles = StyleSheet.create({
  main: {
    marginTop: 12,
    backgroundColor: "#FFFFFF",
    borderRadius: 3,
    padding: 16,
  },
  title: {
    fontSize: 16,
    color: theme.textColor.primary,
    fontWeight: theme.fontWeight.medium,
  },
  separator: {
    marginTop: 16,
    backgroundColor: theme.borderColor,
    height: StyleSheet.hairlineWidth,
  },
});

@observer
class MemberInfoCell extends Component {
  @computed get nick() {
    const { member } = this.props;
    return member.nick;
  }
  @computed get date() {
    const { member } = this.props;
    return moment(parseInt(member.timestamp) * 1000).format("YYYY.MM.DD HH:mm");
  }
  render() {
    return (
      <View style={micStyles.main}>
        <Image source={require("@img/icon/check_selected.png")} />
        <Text style={micStyles.nick}>{this.nick}</Text>
        <Text style={micStyles.date}>{this.date}</Text>
      </View>
    );
  }
}

const micStyles = StyleSheet.create({
  main: {
    marginTop: 16,
    flexDirection: "row",
  },
  nick: {
    flex: 1,
    marginLeft: 6,
    fontSize: 14,
    color: theme.textColor.primary,
  },
  date: {
    fontSize: 14,
    color: theme.textColor.mainTitle,
  },
});

class JoiningCell extends PureComponent {
  render() {
    return (
      <View style={jcStyles.main}>
        <Image source={require("@img/icon/waiting.png")} />
        <Text style={jcStyles.text}>{i18n.t("wallet-multisig-pending-joining")}</Text>
      </View>
    );
  }
}

const jcStyles = StyleSheet.create({
  main: {
    marginTop: 16,
    flexDirection: "row",
  },
  text: {
    marginLeft: 6,
    fontSize: 14,
    color: theme.textColor.primary,
  },
});

export default MultiSigPendingWalletScreen;
