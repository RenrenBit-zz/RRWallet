import React, { Component, PureComponent } from "react";
import {
  StyleSheet,
  View,
  Clipboard,
  Text,
  TouchableHighlight,
  ScrollView,
  AlertIOS,
  Image,
  TextInput,
  Dimensions,
  TouchableWithoutFeedback,
  AsyncStorage,
} from "react-native";
import QRCode from "react-native-qrcode-svg";
import { Button } from "react-native-elements";
import Screen from "../Screen";
import * as Animatable from "react-native-animatable";
import { observable, computed, reaction, autorun, toJS } from "mobx";
import { observer, Observer } from "mobx-react";
import theme from "../../util/Theme";
import ProgressHUD from "../../component/common/ProgressHUD";
import { toFixedLocaleString, toFixedString } from "../../util/NumberUtil";
import AccountStore from "../../module/wallet/account/AccountStore";
import { HDACCOUNT_FIND_WALELT_TYPE_COINID, BTC_ADDRESS_TYPE_PKH, BTC_ADDRESS_TYPE_SH } from "../../config/const";
import i18n from "../../module/i18n/i18n";
import FastImage from "react-native-fast-image";
import Modal from "react-native-modal";
import CoinStore from "../../module/wallet/wallet/CoinStore";
import BigNumber from "bignumber.js";
import _ from "lodash";
import MyAddressesScreen from "./MyAddressesScreen";
import { BTCCoin, BCH } from "../../module/wallet/wallet/Coin";
import HDAccount from "../../module/wallet/account/HDAccount";
import MultiSigAccount from "../../module/wallet/account/MultiSigAccount";
import Header from "../../component/common/Header";
import SelectCoinScreen from "./SelectCoinScreen";
import WalletSettingsScreen from "./WalletSettingsScreen";
import { addressType } from "../../module/wallet/wallet/util/serialize";
import { BIZ_SCOPE } from "../../module/i18n/const";
import BackupWalletScreen from "./BackupWalletScreen";
import device from "../../util/device";

const headerBgColor = theme.brandColor;
const headerTextColor = "#FFFFFF";
@observer
export default class AddressScreen extends Screen {
  static get screenID() {
    return "AddressScreen";
  }
  static get title() {
    return i18n.t("wallet-title-receive");
  }

  static navigatorStyle = {
    ...Screen.navigatorStyle,
    navBarTextColor: headerTextColor,
    navBarButtonColor: headerTextColor,
    navBarBackgroundColor: headerBgColor,
    statusBarTextColorSchemeSingleScreen: "light",
    navBarHidden: true,
  };

  static navigatorButtons = {
    leftButtons: [
      {
        id: "_sbackButton",
        icon: require("@img/nav/nav-back.png"),
        buttonColor: "#FFFFFF",
      },
    ],
  };
  account = AccountStore.match(this.props.accountID);

  @observable amount = -1;
  @observable reason = "";
  @observable selectedCoinID = this.props.coinID ? this.props.coinID : this.wallet.defaultCoin.id;

  @computed get wallet() {
    if (this.account instanceof HDAccount) {
      return this.account.findWallet(this.coin.id, HDACCOUNT_FIND_WALELT_TYPE_COINID);
    } else if (this.account instanceof MultiSigAccount) {
      return this.account.findWallet(this.props.walletID);
    }
  }

  @computed get coin() {
    if (this.account instanceof HDAccount) {
      return this.account.findCoin(this.selectedCoinID) || this.account.coins[0];
    } else if (this.account instanceof MultiSigAccount) {
      return this.wallet.findCoin(this.selectedCoinID);
    }
  }
  @computed get rightButtons() {
    if (this.coin instanceof BTCCoin) {
      return [
        {
          id: "setting",
          icon: require("@img/nav/nav_menu_set.png"),
          buttonColor: "#FFFFFF",
        },
      ];
    }
    return [];
  }

  @observable paymentScheme =
    this.coin instanceof BTCCoin || this.coin instanceof BCH ? this.wallet.currentAddress.address : this.wallet.address;
  // @computed get paymentScheme() {
  //     return this.address
  // }
  @computed get settingsText() {
    return this.hasSettings ? i18n.t("wallet-receive-clearamount") : i18n.t("wallet-receive-setamount");
  }
  @computed get hasSettings() {
    return parseInt(this.amount) >= 0 || (this.reason && this.reason.length);
  }
  @computed get address() {
    if (this.coin instanceof BTCCoin || this.coin instanceof BCH) {
      return this.wallet.currentAddress.address;
    } else {
      return this.wallet.address;
    }
  }
  @computed get addressIcon() {
    if (this.account instanceof HDAccount && this.coin instanceof BTCCoin) {
      if (addressType(this.address) === BTC_ADDRESS_TYPE_SH) {
        return require("@img/wallet/segwit_address.png");
      }
      return require("@img/wallet/normal_address.png");
    }
    return false;
  }
  get sheetOptions() {
    return [
      i18n.t("wallet-title-address"),
      i18n.t("wallet-receive-sheet-new-normal"),
      // i18n.t('wallet-receive-sheet-new-segwit'),
      // i18n.t('wallet-receive-sheet-segwit-desc'),
      i18n.t("common-cancel"),
    ];
  }

  handleSelectorRef = ref => (this.selector = ref);

  constructor(props) {
    super(props);
    this.props.navigator.addOnNavigatorEvent(this.onNavigatorEvent.bind(this));
    this.observer();
  }
  componentWillUnmount() {
    this.unreaction && this.unreaction();
  }
  observer = () => {
    this.unreaction = reaction(
      () => this.selectedCoinID,
      coinID => {
        if (this.account instanceof HDAccount) {
          this.account.stashedReceiveCoinID = coinID;
          this.account.stashedWalletID = this.wallet.id;
        }
      },
      {
        fireImmediately: true,
      }
    );
    reaction(
      () => this.address,
      address => {
        if (!this.visible) {
          return;
        }
        this.paymentScheme = address;
      },
      {
        fireImmediately: true,
      }
    );
    reaction(
      () => this.visible,
      visible => {
        if (!visible) {
          return;
        }
        setTimeout(() => {
          this.paymentScheme = this.address;
        }, 100);
      },
      {
        fireImmediately: true,
      }
    );
  };
  onNavigatorEvent(event) {
    if (event.type == "NavBarButtonPress") {
      switch (event.id) {
        case "setting":
          this.onSettingsPress();
          break;
      }
    }
  }
  onSettingsPress = () => {
    this.navigator.push({
      title: i18n.t("wallet-title-settings"),
      screen: WalletSettingsScreen.screenID,
      passProps: {
        accountID: this.account.id,
        coinID: this.selectedCoinID,
        walletID: this.wallet.id,
      },
    });
  };
  onTitlePress = () => {
    this.selector.show();
  };
  onSelectedCoin = coin => {
    if (this.selectedCoinID !== coin.id) {
      this.selectedCoinID = coin.id;

      setTimeout(() => {
        this.props.onCoinChanged && this.props.onCoinChanged(this.coin);
      }, 300);
    }
    this.selector.dismiss();
  };
  onSelectorDismiss = () => {
    this.selector.dismiss();
  };
  clipAddress = () => {
    Clipboard.setString(this.address);
    this.hud && this.hud.showSuccess(i18n.t("common-copy-success"));
  };
  amountButtonOnPress = () => {
    if (this.hasSettings) {
      this.amount = "";
      this.reason = "";
    } else {
      this.dialog.show();
    }
  };
  onSettingsCompletion = (amount, reason) => {
    this.amount = amount;
    this.reason = reason;
  };
  onBackupConfirm = () => {
    this.props.navigator.push({
      screen: BackupWalletScreen.screenID,
      title: i18n.t("wallet-title-backup-mnemonic"),
    });
  };
  onBackupCancel = () => {
    this.props.navigator.pop();
  };
  _onSheetItemPress = index => {
    if (index == this.sheetOptions.length - 1) {
      return;
    }
    switch (index) {
      case 0:
        this._goMyAddressScreen();
        break;
      case 1:
        this._requestNormalAddress();
        break;
      case 2:
        this._requestScriptAddress();
        break;
      case 3:
        break;
    }
  };
  _goMyAddressScreen = () => {
    this.navigator.push({
      title: i18n.t("wallet-title-address"),
      screen: MyAddressesScreen.screenID,
      passProps: {
        coinID: this.selectedCoinID,
        accountID: this.account.id,
        walletID: this.wallet.id,
      },
    });
  };
  _requestNormalAddress = async () => {
    const address = await this.wallet.generatorAddress(BTC_ADDRESS_TYPE_PKH);
    this.wallet.currentAddress = address;
  };
  _requestScriptAddress = async () => {
    await this.wallet.generatorAddress(BTC_ADDRESS_TYPE_SH);
  };
  renderTitleComponent = () => (
    <Observer>{() => <Title coin={this.coin} onPress={this.onTitlePress} account={this.account} />}</Observer>
  );
  render() {
    const { backgroundColor } = this.props;
    return (
      <View style={{ flex: 1 }}>
        <Header
          leftButtons={AddressScreen.navigatorButtons.leftButtons}
          rightButtons={this.rightButtons}
          renderTitleComponent={this.renderTitleComponent}
          navigator={this.navigator}
          style={{ backgroundColor }}
        />
        <ScrollView style={[styles.main, { backgroundColor }]} keyboardShouldPersistTaps={"always"}>
          <View style={[styles.card, { marginTop: 20 }]}>
            <Text style={styles.desc}>{i18n.t("wallet-receive-desc")}</Text>
            <View style={styles.qrWrap}>
              <QRCode size={180} value={this.paymentScheme} ecl="Q" />
              <FastImage style={styles.icon} source={{ uri: this.coin.icon }} />
            </View>
            {parseInt(this.amount) >= 0 && (
              <Text style={styles.amount}>
                {toFixedLocaleString(this.amount)} {this.coin.name}
              </Text>
            )}
            {this.reason.trim().length > 0 && <Text style={styles.reason}>{this.reason}</Text>}
            <Button
              buttonStyle={styles.button}
              titleStyle={styles.buttonText}
              onPress={this.amountButtonOnPress}
              title={this.settingsText}
            />
          </View>
          <TouchableHighlight style={styles.highlight} onPress={this.clipAddress}>
            <View style={[styles.card, { marginHorizontal: 0 }]}>
              <View style={styles.addressDescWrap}>
                <Text style={styles.addressDesc}>{i18n.t("wallet-receive-address")}</Text>
                {this.addressIcon && <Image source={this.addressIcon} />}
              </View>
              <View style={styles.row}>
                <View style={styles.addressWrap}>
                  <Text style={styles.address}>{this.address}</Text>
                </View>
                <Image source={require("@img/wallet/wallet_copy.png")} />
              </View>
            </View>
          </TouchableHighlight>
          <ProgressHUD ref={ref => (this.hud = ref)} />
          <SettingsDialog ref={ref => (this.dialog = ref)} onCompletion={this.onSettingsCompletion} coin={this.coin} />
        </ScrollView>
        <GuideModal coin={this.coin} account={this.account} />
        <BackupDialog onConfirm={this.onBackupConfirm} onCancel={this.onBackupCancel} />
        <SelectCoinScreen
          ref={this.handleSelectorRef}
          onDismiss={this.onSelectorDismiss}
          onSelected={this.onSelectedCoin}
          account={this.account}
          walletID={this.wallet.id}
          coinID={this.coin.id}
          navigator={this.navigator}
        />
      </View>
    );
  }
}

const styles = StyleSheet.create({
  main: {
    flex: 1,
    backgroundColor: headerBgColor,
  },
  highlight: {
    backgroundColor: "#FFFFFF",
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 3,
  },
  card: {
    padding: 16,
    marginHorizontal: 16,
    borderRadius: 3,
    alignItems: "center",
    overflow: "hidden",
    backgroundColor: "#FFFFFF",
  },
  icon: {
    position: "absolute",
    width: 36,
    height: 36,
    top: 72,
    left: 72,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: "#FFFFFF",
  },
  row: {
    flexDirection: "row",
  },
  desc: {
    marginTop: 24,
    marginBottom: 40,
    color: theme.textColor.primary,
    fontSize: 16,
    height: 22,
  },
  qrWrap: {
    marginBottom: 20,
    padding: 1,
  },
  centerBtn: {
    justifyContent: "center",
  },
  button: {
    backgroundColor: "transparent",
    elevation: 0,
    marginBottom: 4,
  },
  buttonText: {
    color: "#007AFF",
    fontSize: 14,
  },
  addressDescWrap: {
    marginBottom: 6,
    height: 20,
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
  },
  addressDesc: {
    marginRight: 6,
    color: theme.textColor.primary,
    fontSize: 14,
  },
  addressWrap: {
    flex: 1,
    marginRight: 4,
  },
  address: {
    color: theme.textColor.mainTitle,
    fontSize: 12,
  },
  amount: {
    color: theme.textColor.primary,
    fontSize: 24,
    fontWeight: "600",
    marginBottom: 5,
  },
  reason: {
    fontSize: 14,
    lineHeight: 20,
    color: theme.textColor.mainTitle,
    marginBottom: 9,
  },
});

@observer
class SettingsDialog extends Component {
  @observable visible = false;
  @observable amount = "";
  @observable reason = "";
  @computed get coin() {
    return this.props.coin;
  }
  @computed get desc() {
    if (this.amount.length == 0) {
      return "";
    }
    const reg = /^[0-9]+[.]?[0-9]*$/g;
    const result = reg.test(this.amount);
    if (result) {
      const bignumer = new BigNumber(this.amount).multipliedBy(this.coin.price + "");
      return `≈${toFixedString(bignumer, 2, true)} ${CoinStore.currency}`;
    } else {
      if (this.amount.length > 15) {
        return i18n.t("wallet-receive-tip-numberoverflow");
      }
      return i18n.t("wallet-receive-tip-numberformat");
    }
  }
  @computed get disabled() {
    if (this.amount.length == 0 && this.reason.length > 0) {
      return this.reason.length > 15;
    }
    const reg = /^[0-9]+[.]?[0-9]*$/g;
    const result = reg.test(this.amount);
    if (!result) {
      return true;
    }
    return this.reason.length > 15;
  }
  show = () => {
    this.visible = true;
  };
  dismiss = () => {
    this.amount = "";
    this.reason = "";
    this.visible = false;
  };
  onClosePress = () => {
    this.dismiss();
  };
  onConfirmPress = () => {
    this.props.onCompletion && this.props.onCompletion(this.amount, this.reason.trim());
    this.dismiss();
  };
  onChangeAmount = text => {
    this.amount = text;
  };
  onChangeReason = text => {
    this.reason = text;
  };
  render() {
    return (
      <Modal
        isVisible={this.visible}
        style={sdStyles.modal}
        animationIn="fadeIn"
        animationOut="fadeOut"
        animationOutTiming={100}
        backdropOpacity={0.4}>
        <View style={sdStyles.main}>
          <View style={sdStyles.titleWrap}>
            <Text style={sdStyles.title}>{i18n.t("wallet-receive-settings-title")}</Text>
            <TouchableHighlight
              style={sdStyles.close}
              onPress={this.dismiss}
              underlayColor="transparent"
              activeOpacity={0.6}
              hitSlop={{ top: 20, left: 10, bottom: 16, right: 16 }}>
              <Image source={require("@img/wallet/close_icon.png")} />
            </TouchableHighlight>
          </View>
          <TextInput
            style={[sdStyles.input, { marginTop: 30 }]}
            placeholder={i18n.t("wallet-receive-settings-amount-placeholder")}
            onChangeText={this.onChangeAmount}
          />
          <Text style={sdStyles.price}>{this.desc}</Text>
          <TextInput
            style={[sdStyles.input, { marginTop: 11 }]}
            placeholder={i18n.t("wallet-receive-settings-reason-placeholder")}
            onChangeText={this.onChangeReason}
          />
          <Button
            title={i18n.t("wallet-receive-settings-confirm")}
            containerStyle={sdStyles.buttonContainerStyle}
            onPress={this.onConfirmPress}
            disabled={this.disabled}
          />
        </View>
      </Modal>
    );
  }
}

const sdStyles = StyleSheet.create({
  modal: {
    margin: 0,
    alignItems: "center",
  },
  main: {
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
  },
  title: {
    marginVertical: 16,
    fontSize: 18,
    fontWeight: theme.fontWeight.medium,
    color: theme.textColor.primary,
  },
  close: {
    position: "absolute",
    left: 4,
    top: 20,
  },
  input: {
    borderRadius: 3,
    height: 50,
    paddingHorizontal: 16,
    fontSize: 14,
    backgroundColor: theme.backgroundColor,
    borderColor: theme.borderColor,
    borderWidth: StyleSheet.hairlineWidth,
  },
  price: {
    height: 20,
    color: "#F5A623",
    fontSize: 14,
    lineHeight: 20,
    marginTop: 9,
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

@observer
class Title extends Component {
  @computed get coin() {
    return this.props.coin;
  }

  @computed get text() {
    return i18n.t("wallet-title-receive", { coin: this.coin.name });
  }
  @computed get enabled() {
    return this.props.account instanceof HDAccount;
  }
  onPress = () => {
    this.props.onPress && this.props.onPress();
  };
  render = () => {
    return (
      <TouchableHighlight
        underlayColor={"transparent"}
        activeOpacity={0.7}
        onPress={this.enabled ? this.onPress : null}>
        <View style={tStyles.main}>
          <Text style={tStyles.text}>{this.text}</Text>
          {this.enabled && (
            <Image style={tStyles.icon} tintColor={"#FFFFFF"} source={require("@img/icon/arrow_down.png")} />
          )}
        </View>
      </TouchableHighlight>
    );
  };
}

const tStyles = StyleSheet.create({
  main: {
    flexDirection: "row",
    alignItems: "center",
  },
  text: {
    fontSize: 18,
    fontWeight: theme.fontWeight.medium,
    color: "#FFFFFF",
  },
  icon: {
    marginLeft: 6,
    tintColor: "#FFFFFF",
  },
});

@observer
class BackupDialog extends Component {
  @computed get visible() {
    return !AccountStore.defaultHDAccount.hasBackup;
  }
  render() {
    if (!this.visible) {
      return null;
    }
    return (
      <Animatable.View style={bdStyles.modal} animation="fadeIn" duration={200} useNativeDriver={true}>
        <View style={bdStyles.main}>
          <View style={bdStyles.header}>
            <Image source={require("@img/wallet/backup_dialog.png")} />
          </View>
          <Text style={bdStyles.title}>{i18n.tt(BIZ_SCOPE.wallet, "receive-backup-title")}</Text>
          <Text style={bdStyles.desc}>{i18n.tt(BIZ_SCOPE.wallet, "receive-backup-desc")}</Text>
          <View style={bdStyles.buttonGroup}>
            <Button
              title={i18n.tt(BIZ_SCOPE.wallet, "receive-backup-later")}
              titleStyle={bdStyles.buttonTitle}
              containerStyle={bdStyles.buttonContainer}
              buttonStyle={bdStyles.buttonStyle}
              onPress={this.props.onCancel}
            />
            <View style={bdStyles.separator} />
            <Button
              title={i18n.tt(BIZ_SCOPE.wallet, "receive-backup-confirm")}
              titleStyle={bdStyles.buttonTitle}
              containerStyle={bdStyles.buttonContainer}
              buttonStyle={bdStyles.buttonStyle}
              onPress={this.props.onConfirm}
            />
          </View>
        </View>
      </Animatable.View>
    );
  }
}
const bdStyles = StyleSheet.create({
  modal: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0, 0, 0, 0.4)",
  },
  main: {
    width: 300,
    height: 320,
    borderRadius: 12,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    overflow: "hidden",
  },
  header: {
    backgroundColor: theme.noticeColor,
    height: 142,
    alignSelf: "stretch",
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    marginTop: 30,
    fontSize: 18,
    height: 25,
    color: theme.textColor.primary,
  },
  desc: {
    marginTop: 16,
    fontSize: 14,
    height: 20,
    color: theme.textColor.mainTitle,
  },
  buttonGroup: {
    marginTop: 30,
    flexDirection: "row",
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: theme.borderColor,
  },
  buttonContainer: {
    flex: 1,
  },
  buttonStyle: {
    backgroundColor: "#FFFFFF",
    height: 56,
    borderRadius: 0,
  },
  buttonTitle: {
    fontSize: 18,
    color: theme.brandColor,
  },
  separator: {
    height: "100%",
    width: StyleSheet.hairlineWidth,
    backgroundColor: theme.borderColor,
  },
});

const GUIDE_SEGWIT_FLAG = "GUIDE-SEGWIT-FLAG";
@observer
class GuideModal extends Component {
  @observable hasDisplayed = false;
  @computed get visible() {
    return !this.hasDisplayed && this.props.coin instanceof BTCCoin && this.props.account instanceof HDAccount;
  }
  constructor(props) {
    super(props);
    this.init();
  }
  init = async () => {
    this.hasDisplayed = !!parseInt(await AsyncStorage.getItem(GUIDE_SEGWIT_FLAG));
  };
  _onPress = () => {
    this.hasDisplayed = true;
    AsyncStorage.setItem(GUIDE_SEGWIT_FLAG, "1");
  };
  render() {
    if (!this.visible) {
      return null;
    }
    return (
      <TouchableWithoutFeedback onPress={this._onPress}>
        <View style={gmStyles.modal}>
          <Image style={gmStyles.icon} source={require("@img/wallet/guide_segwit.png")} />
        </View>
      </TouchableWithoutFeedback>
    );
  }
}

const gmStyles = StyleSheet.create({
  modal: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
  },
  icon: {
    position: "absolute",
    right: 12,
    top: device.navBarHeight - 8,
  },
});
