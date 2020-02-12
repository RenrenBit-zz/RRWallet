import React, { Component, PureComponent } from "react";
import {
  StyleSheet,
  View,
  SectionList,
  FlatList,
  Text,
  Platform,
  Dimensions,
  TouchableHighlight,
  Image,
  ScrollView,
  PanResponder,
  Animated,
  RefreshControl,
  DeviceEventEmitter,
  ImageBackground,
} from "react-native";
import { observer, Observer } from "mobx-react";
import { observable, computed, toJS } from "mobx";
import AssetsHeader from "../hd-wallet/component/AssetsHeader";
import AccountStore from "../../module/wallet/account/AccountStore";
import BackupSection, { AnimatedBackupSection } from "../hd-wallet/component/BackupSection";
import BackupWalletScreen from "../hd-wallet/BackupWalletScreen";
import { Button } from "react-native-elements";
import theme from "../../util/Theme";
import device from "../../util/device";
import { padding, manualPadding } from "../../util/UIAdapter";
import i18n from "../../module/i18n/i18n";
import { toFixedLocaleString, toPriceString } from "../../util/NumberUtil";
import FastImage from "react-native-fast-image";
import { BTCCoin, USDT, ETH, BCH, BSV } from "../../module/wallet/wallet/Coin";
import CoinStore from "../../module/wallet/wallet/CoinStore";
import { BigNumber } from "bignumber.js";
import MultiSigWallet, {
  MultiSigTransaction,
  MULTISIG_PENDING_TX_STATUS_WAITING,
  MULTISIG_PENDING_TX_STATUS_APPROVAL,
  MULTISIG_PENDING_TX_STATUS_REJECT,
} from "../../module/wallet/wallet/MultiSigWallet";
import _ from "lodash";
import MultiSigAccount from "../../module/wallet/account/MultiSigAccount";
import MultiSigCreateScreen from "./MultiSigCreateScreen";
import MultiSigJoinScreen from "./MultiSigJoinScreen";
import MultiSigManageWalletScreen from "./MultiSigManageWalletScreen";
import MultiSigPendingWalletScreen from "./MultiSigPendingWalletScreen";
import CoinDetailScreen from "../hd-wallet/CoinDetailScreen";
import moment from "moment";
import MultiSigTxAuthorizationScreen from "./MultiSigTxAuthorizationScreen";
import MultiSigWalletInfoScreen from "./MultiSigWalletInfoScreen";
import MultiSigRecoveryScreen from "./MultiSigRecoveryScreen";
import FlatListLoadMoreView from "../../component/common/FlatListLoadMoreView";
import MessageBox from "@CC/MessageBox";
import { WALLET_TAB_JUMP_NOTIFICATION, WALLET_TAB_JUMP_NOTIFICATION_INDEX_MULTISIG } from "../../config/const";
import { BIZ_SCOPE } from "../../module/i18n/const";
import { BTCMultiSigCoin } from "../../module/wallet/wallet/btc/BTCMultiSigWallet";

const promptColor = "#FF801A";
const { height, width } = Dimensions.get("window");

@observer
class MultiSigWalletComponent extends Component {
  @observable isRefreshing = false;

  pan = new Animated.ValueXY();
  /**
   *
   * @type {MultiSigAccount}
   * @readonly
   * @memberof MultiSigWalletComponent
   */
  @computed get account() {
    return AccountStore.defaultMultiSigAccount;
  }

  @computed get wallets() {
    if (this.account.displayChange) {
      return this.account.wallets.slice();
    }
    return this.account.wallets.slice().filter(wallet => wallet.assetPrice >= 100);
  }

  @computed get sections() {
    const sections = [];
    const txSection = {
      data: this.account.pendingTxs.slice(),
      renderItem: this._renderTxCell,
      keyExtractor: this._keyExtractorTx,
      renderSectionHeader: this._renderTxSectionHeader,
      renderSeparator: this._renderTxSeparator,
    };
    const walletSection = {
      data: this.wallets,
      renderItem: this._renderWalletCell,
      keyExtractor: this._keyExtractorWallet,
      renderSectionHeader: this._renderWalletSectionHeader,
      renderSeparator: this._renderWalletSeparator,
    };

    if (this.account.pendingTxs.length > 0) {
      sections.push(txSection);
    }
    // if (this.wallets.length > 0) {
    sections.push(walletSection);
    // }

    return sections;
  }
  constructor(props) {
    super(props);
    this._panResponder = PanResponder.create({
      onPanResponderMove: this._onPanResponderMove,
    });
    DeviceEventEmitter.addListener(WALLET_TAB_JUMP_NOTIFICATION, ({ index }) => {
      if (index !== WALLET_TAB_JUMP_NOTIFICATION_INDEX_MULTISIG) {
        return;
      }
      this.props.jumpTo && this.props.jumpTo("multisig");
    });
  }
  onBackupButtonPress = () => {
    this.props.navigator.push({
      screen: BackupWalletScreen.screenID,
      title: i18n.t("wallet-title-backup-mnemonic"),
    });
  };
  onWalletManagePress = () => {
    this.props.navigator.push({
      screen: MultiSigManageWalletScreen.screenID,
      title: i18n.t("wallet-title-multisig-manage"),
    });
  };
  onWalletPress = wallet => {
    if (wallet.isCompleted) {
      this.props.navigator.push({
        screen: MultiSigWalletInfoScreen.screenID,
        title: i18n.t("wallet-title-multisig-walletinfo"),
        passProps: {
          walletID: wallet.id,
        },
      });
      return;
    }
    this.props.navigator.showModal({
      screen: MultiSigPendingWalletScreen.screenID,
      title: wallet.title,
      passProps: {
        walletID: wallet.id,
      },
    });
  };
  onCoinPress = () => {};
  onTxCellPress = tx => {
    this.props.navigator.push({
      screen: MultiSigTxAuthorizationScreen.screenID,
      title: i18n.t("wallet-title-multisig-authorization"),
      passProps: {
        txId: tx.id,
      },
    });
  };
  _onRefresh = async () => {
    if (this.isRefreshing) {
      return;
    }

    this.isRefreshing = true;
    try {
      await this.account.update();
    } catch (error) {}

    setTimeout(() => {
      this.isRefreshing = false;
    }, 100);
  };
  _keyExtractorTx = ({ id }) => id + "";
  _keyExtractorWallet = ({ id }) => id + "";
  _renderHeader = () => (
    <View>
      <BackupSection account={AccountStore.defaultHDAccount} onPress={this.onBackupButtonPress} />
      <AssetsHeader
        account={AccountStore.defaultMultiSigAccount}
        style={styles.assets}
        colors={["#5660F5", "#7077FA"]}
        separatorColor={"#B2B6FB"}
      />
    </View>
  );
  _renderFooter = () => <FlatListLoadMoreView status={"nomore"} style={styles.loadMore} />;
  _renderTxCell = ({ item }) => <Observer>{() => <TxCell tx={item} onPress={this.onTxCellPress} />}</Observer>;
  _renderWalletCell = ({ item }) => (
    <Observer>
      {() => <WalletCell wallet={item} navigator={this.props.navigator} onWalletPress={this.onWalletPress} />}
    </Observer>
  );
  _renderSectionHeader = ({ section }) => section.renderSectionHeader();
  _renderTxSectionHeader = () => <TxSectionHeader />;
  _renderTxSeparator = () => (
    <View style={{ height: StyleSheet.hairlineWidth, backgroundColor: "#FFFFFF" }}>
      <View
        style={{ marginHorizontal: 16, height: StyleSheet.hairlineWidth, backgroundColor: theme.backgroundColor }}
      />
    </View>
  );
  _renderWalletSectionHeader = () => <WalletSectionHeader onPress={this.onWalletManagePress} />;
  _renderWalletSeparator = () => <Separator style={{ backgroundColor: "#FFFFFF" }} />;
  _renderSeparator = ({ section }) => section.renderSeparator();
  render() {
    if (!this.account.hasCreated) {
      return this.renderDefaultPage();
    }
    return (
      <View style={styles.main}>
        <SectionList
          refreshControl={
            <RefreshControl
              refreshing={this.isRefreshing}
              onRefresh={this._onRefresh}
              tintColor={theme.iconColor}
              title={i18n.t("common-loading")}
              titleColor={theme.iconColor}
              colors={["#f00", "#0f0", "#00f"]}
              progressBackgroundColor="#ffffff"
            />
          }
          style={styles.list}
          sections={this.sections}
          ListHeaderComponent={this._renderHeader}
          ListFooterComponent={this._renderFooter}
          ItemSeparatorComponent={this._renderSeparator}
          renderSectionHeader={this._renderSectionHeader}
          stickySectionHeadersEnabled={false}
          onMomentumScrollEnd={this._onMomentumScrollEnd}
          showsVerticalScrollIndicator={false}
          {...this._panResponder.panHandlers}
        />
      </View>
    );
  }
  renderDefaultPage() {
    const { navigator, jumpTo } = this.props;
    return <DefaultPage navigator={navigator} jumpTo={jumpTo} />;
  }
  _onMomentumScrollEnd = () => {
    this.pan.setValue({ x: 0, y: 0 });
  };
  _onPanResponderMove = (ev, state) => {
    if (state.dy >= 0) {
      return;
    }
    this.pan.setValue({ x: 0, y: state.dy });
  };
}

const styles = StyleSheet.create({
  main: {
    ...Platform.select({
      ios: {
        width: width,
        height: height - device.tabBarHeight - device.navBarHeight,
      },
      android: {
        flex: 1,
      },
    }),
    backgroundColor: "#FFFFFF",
  },
  cover: {
    position: "absolute",
    backgroundColor: "#FFFFFF",
    width: "100%",
    height: 250,
  },
  list: {
    flex: 1,
  },
  loadMore: {
    backgroundColor: "#FFFFFF",
  },
  assets: {
    marginBottom: 20,
  },
});

@observer
class TxCell extends Component {
  /**
   *
   * @type {MultiSigTransaction}
   * @readonly
   * @memberof TxCell
   */
  @computed get tx() {
    return this.props.tx;
  }
  @computed get date() {
    return moment(this.tx.timestamp * 1000).format("YYYY.MM.DD. HH:mm:ss");
  }
  @computed get statusText() {
    switch (this.tx.ownAuthStatus) {
      case MULTISIG_PENDING_TX_STATUS_WAITING:
        return i18n.t("wallet-multisig-pending-tx-waiting");
      case MULTISIG_PENDING_TX_STATUS_APPROVAL:
        return i18n.t("wallet-multisig-pending-tx-approval");
      case MULTISIG_PENDING_TX_STATUS_REJECT:
        return i18n.t("wallet-multisig-pending-tx-reject");
    }
  }
  @computed get disabled() {
    return this.tx.ownAuthStatus != MULTISIG_PENDING_TX_STATUS_WAITING;
  }
  onPress = () => {
    this.props.onPress && this.props.onPress(this.tx);
  };
  render() {
    //2018年12月22日18:45:21
    return (
      <TouchableHighlight onPress={this.onPress}>
        <View style={tcStyles.main}>
          <Text style={tcStyles.walletName}>{this.tx.wallet.name}</Text>
          <Text style={tcStyles.date}>
            {this.tx.creator} | {this.date}
          </Text>
          <View style={tcStyles.amountSection}>
            <Text style={tcStyles.amount}>
              {this.tx.amount} {this.tx.tokenName}
            </Text>
            <Button
              title={this.statusText}
              disabled={this.disabled}
              disabledStyle={tcStyles.disabledButtonStyle}
              disabledTitleStyle={tcStyles.disabledButtonText}
              buttonStyle={tcStyles.buttonStyle}
              titleStyle={tcStyles.buttonText}
              onPress={this.onPress}
            />
          </View>
        </View>
      </TouchableHighlight>
    );
  }
}

const tcStyles = StyleSheet.create({
  main: {
    height: 120,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 14,
    backgroundColor: "#FFFFFF",
  },
  amountSection: {
    marginTop: 5,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
  },
  walletName: {
    marginTop: 3,
    fontSize: 16,
    fontWeight: theme.fontWeight.medium,
    color: theme.textColor.primary,
  },
  date: {
    marginTop: 12,
    fontSize: 14,
    color: theme.textColor.mainTitle,
  },
  amount: {
    color: promptColor,
    fontFamily: theme.bigNumberFontFamily,
    fontSize: 20,
  },
  buttonStyle: {
    height: 32,
    minWidth: 76,
    paddingVertical: 0,
    borderRadius: 3,
    borderColor: promptColor,
    borderWidth: 1,
    backgroundColor: "#FFFFFF",
    elevation: 0,
  },
  buttonText: {
    color: promptColor,
    fontSize: 14,
  },
  disabledButtonStyle: {
    borderColor: theme.textColor.mainTitle,
    backgroundColor: "#FFFFFF",
  },
  disabledButtonText: {
    color: theme.textColor.mainTitle,
    fontSize: 14,
  },
});
@observer
class WalletCell extends Component {
  @computed get statusText() {
    return this.wallet.isCompleted ? "" : i18n.t("wallet-multisig-walletstatus-pending");
  }
  /**
   *
   * @type {MultiSigWallet}
   * @memberof WalletCell
   */
  wallet = this.props.wallet;
  onWalletPress = () => {
    const { onWalletPress } = this.props;
    onWalletPress && onWalletPress(this.wallet);
  };
  renderCoins() {
    if (!this.wallet.isCompleted) {
      return null;
    }
    return [
      <View style={wcStyles.coinSectionSeparator} key="separator" />,
      _.flatten(
        this.wallet.coins.map((coin, i) => {
          const views = [
            <CoinCell
              coin={coin}
              wallet={this.wallet}
              navigator={this.props.navigator}
              key={i}
              separator={i !== this.wallet.coins.length - 1}
            />,
          ];
          return views;
        })
      ),
    ];
  }
  render() {
    return (
      <View style={wcStyles.main}>
        <View style={wcStyles.border}>
          <TouchableHighlight onPress={this.onWalletPress}>
            <View style={wcStyles.walletSection}>
              <View style={wcStyles.nameContainer}>
                <View style={wcStyles.row}>
                  <Text style={wcStyles.name}>{this.wallet.name}</Text>
                  <Text style={wcStyles.statusText}>{this.statusText}</Text>
                </View>
                <View style={[wcStyles.row, { marginTop: 5 }]}>
                  <Image source={require("@img/wallet/multisig_sign_icon.png")} />
                  <Text style={wcStyles.desc}>
                    {this.wallet.required}-{this.wallet.total}
                  </Text>
                </View>
              </View>
            </View>
          </TouchableHighlight>
          {this.renderCoins()}
        </View>
      </View>
    );
  }
}

const wcStyles = StyleSheet.create({
  main: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  border: {
    marginHorizontal: 16,
    borderRadius: 6,
    borderColor: theme.borderColor,
    borderWidth: StyleSheet.hairlineWidth,
  },
  cover: {
    flex: 1,
    marginHorizontal: 12,
    paddingHorizontal: 16,
    marginVertical: 8,
    paddingVertical: 4,
  },
  row: {
    flexDirection: "row",
  },
  walletSection: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    height: 80,
    paddingHorizontal: 20,
    backgroundColor: "#FFFFFF",
  },
  coinSection: {
    flex: 1,
  },
  nameContainer: {
    flex: 1,
  },
  icon: {},
  name: {
    fontSize: 14,
    height: 20,
    color: theme.textColor.primary,
    fontWeight: theme.fontWeight.medium,
  },
  desc: {
    ...Platform.select({ ios: { marginTop: 1 } }),
    fontSize: 12,
    color: theme.textColor.mainTitle,
    marginLeft: 6,
  },
  statusText: {
    flex: 1,
    textAlign: "right",
    fontSize: 12,
    color: "#fea900",
  },
  coinSectionSeparator: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: theme.borderColor,
    marginLeft: 8,
  },
});

@observer
class CoinCell extends Component {
  @computed get balance() {
    if (AccountStore.isHiddenPrice) {
      return "*****";
    }
    const bigNumber = new BigNumber(this.props.coin.balance + "");
    if (bigNumber.isLessThan(0)) {
      return "-";
    }
    return toFixedLocaleString(
      bigNumber,
      this.props.coin instanceof BTCMultiSigCoin || this.props.coin instanceof ETH ? 8 : 4,
      true
    );
  }
  @computed get totalPrice() {
    if (AccountStore.isHiddenPrice) {
      return "*****";
    }
    if (this.balance == "-") {
      return "-";
    }
    return `≈${toPriceString(this.props.coin.totalPrice, 2, 4, true)}  ${CoinStore.currency}`;
  }
  @computed get available() {
    if (AccountStore.isHiddenPrice) {
      return "*****";
    }
    return this.props.coin.available;
  }
  @computed get frozen() {
    if (AccountStore.isHiddenPrice) {
      return "*****";
    }
    return this.props.coin.frozen;
  }
  onPress = () => {
    const { coin, wallet, navigator } = this.props;
    navigator.push({
      screen: CoinDetailScreen.screenID,
      title: coin.name,
      passProps: {
        coinID: coin.id,
        walletID: wallet.id,
        accountID: AccountStore.defaultMultiSigAccount.id,
      },
      navigatorStyle: {
        navBarBackgroundColor: theme.business.multiSig,
      },
    });
  };
  render() {
    const { coin, separator } = this.props;
    return (
      <TouchableHighlight
        style={cellStyles.highlight}
        underlayColor="transparent"
        activeOpacity={0.7}
        onPress={this.onPress}>
        <View style={cellStyles.container}>
          <FastImage source={{ uri: coin.icon }} style={cellStyles.icon} />
          <View style={cellStyles.content}>
            <View style={cellStyles.row}>
              <View style={cellStyles.nameWrap}>
                <Text numberOfLines={1} ellipsizeMode="middle" style={cellStyles.primaryText}>
                  {coin.name}
                </Text>
              </View>
              <Text style={cellStyles.primaryText}>{this.balance}</Text>
            </View>
            <View style={[cellStyles.row, { marginTop: 4 }]}>
              <Text style={[cellStyles.mainText]}>
                {toPriceString(coin.price, 2, 4, true)} {CoinStore.currency}
              </Text>
              <Text style={[cellStyles.mainText]}>{this.totalPrice}</Text>
            </View>
            <Text style={cellStyles.descText}>
              {i18n.tt(BIZ_SCOPE.wallet, "available")} {this.available} | {i18n.tt(BIZ_SCOPE.wallet, "frozen")}{" "}
              {this.frozen}
            </Text>
          </View>
        </View>
      </TouchableHighlight>
    );
  }
}

const cellStyles = StyleSheet.create({
  highlight: {
    backgroundColor: "#FFFFFF",
  },
  container: {
    flex: 1,
    flexDirection: "row",
    // height: 68,
    paddingHorizontal: 20,
  },
  content: {
    flex: 1,
    marginLeft: padding(12),
    paddingVertical: 20,
    borderBottomColor: theme.borderColor,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  row: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  nameWrap: {
    flexDirection: "row",
    alignItems: "center",
  },
  typeIcon: {
    marginLeft: 8,
  },
  icon: {
    marginTop: 20,
    width: 36,
    height: 36,
  },
  primaryText: {
    color: theme.textColor.primary,
    fontSize: 16,
    fontWeight: theme.fontWeight.medium,
    fontFamily: theme.alphanumericFontFamily,
  },
  mainText: {
    color: theme.textColor.mainTitle,
    fontSize: 12,
    fontFamily: theme.alphanumericFontFamily,
  },
  descText: {
    marginTop: 8,
    color: theme.textColor.mainTitle,
    fontSize: 13,
  },
  separatorWrap: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: "#FFFFFF",
  },
  separator: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: theme.borderColor,
    marginLeft: manualPadding(64, padding(16) + padding(12) + 36),
  },
});
class Separator extends Component {
  shouldComponentUpdate = () => false;
  render() {
    return <View style={[sStyles.main, this.props.style]} />;
  }
}

const sStyles = StyleSheet.create({
  main: {
    height: 10,
    width: width,
    backgroundColor: theme.bgColor,
  },
});

class TxSectionHeader extends Component {
  shouldComponentUpdate = () => false;
  render() {
    return [
      <Separator key="tx-1" />,
      <View ket="tx-2" style={wshStyles.main}>
        <Text style={wshStyles.title}>{i18n.tt(BIZ_SCOPE.wallet, "multisig-index-txsection-title")}</Text>
      </View>,
    ];
  }
}

@observer
class WalletSectionHeader extends Component {
  @computed get displayChange() {
    return AccountStore.defaultMultiSigAccount.displayChange;
  }
  @computed get displayChangeText() {
    return this.displayChange
      ? i18n.t("wallet-hdindex-sectionheader-hidechange")
      : i18n.t("wallet-hdindex-sectionheader-showchange");
  }
  @computed get displayChangeIcon() {
    return this.displayChange ? require("@img/wallet/asset_visual.png") : require("@img/wallet/asset_invisual.png");
  }
  onDisplayChangeButtonPress = () => {
    AccountStore.defaultMultiSigAccount.displayChange = !this.displayChange;
  };
  render() {
    return [
      <Separator key="1" />,
      <View style={[wshStyles.main, { borderBottomWidth: 0 }]} key="2">
        <Text style={wshStyles.title}>{i18n.t("wallet-multisig-index-walletsection-title")}</Text>
        <TouchableHighlight activeOpacity={0.6} underlayColor="transparent" onPress={this.props.onPress}>
          <View style={wshStyles.buttonWrap}>
            <Image source={require("@img/wallet/icon_wallet_add.png")} />
            <Text style={wshStyles.buttonTitle}>{i18n.t("wallet-multisig-index-walletsection-manage")}</Text>
          </View>
        </TouchableHighlight>
        <View style={wshStyles.separator} />
        <TouchableHighlight activeOpacity={0.6} underlayColor="transparent" onPress={this.onDisplayChangeButtonPress}>
          <View style={[wshStyles.buttonWrap, { paddingRight: 0 }]}>
            <Image source={this.displayChangeIcon} style={wshStyles.icon} />
            <Text style={wshStyles.buttonTitle}>{this.displayChangeText}</Text>
          </View>
        </TouchableHighlight>
      </View>,
    ];
  }
}

const wshStyles = StyleSheet.create({
  main: {
    height: 70,
    flexDirection: "row",
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    paddingHorizontal: 16,
    borderBottomColor: theme.borderColor,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  title: {
    flex: 1,
    color: theme.textColor.primary,
    fontSize: 20,
    fontWeight: theme.fontWeight.medium,
  },
  icon: {
    tintColor: theme.linkColor,
  },
  buttonWrap: {
    height: 48,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 10,
  },
  buttonTitle: {
    marginLeft: 6,
    color: theme.linkColor,
    fontSize: 12,
  },
  separator: {
    height: 12,
    width: 1,
    backgroundColor: theme.borderColor,
  },
});

class DefaultPage extends PureComponent {
  handleMsgBoxRef = ref => (this.msgbox = ref);

  onCreatePress = () => {
    if (!AccountStore.defaultHDAccount.hasCreated) {
      this.msgbox.showConfirm({
        content: i18n.t("wallet-multisig-index-hd-tip-content"),
        okText: i18n.t("wallet-multisig-index-hd-tip-ok"),
        cancelText: i18n.t("common-later"),
        onOk: () => {
          this.props.jumpTo && this.props.jumpTo("hd");
        },
      });
      return;
    }
    this.props.navigator.push({
      screen: MultiSigCreateScreen.screenID,
      title: i18n.t("wallet-title-create-multisig"),
    });
  };
  onJoinPress = () => {
    if (!AccountStore.defaultHDAccount.hasCreated) {
      this.msgbox.showConfirm({
        content: i18n.t("wallet-multisig-index-hd-tip-content"),
        okText: i18n.t("wallet-multisig-index-hd-tip-ok"),
        cancelText: i18n.t("common-later"),
        onOk: () => {
          this.props.jumpTo && this.props.jumpTo("hd");
        },
      });
      return;
    }
    this.props.navigator.push({
      screen: MultiSigJoinScreen.screenID,
      title: i18n.t("wallet-title-join-multisig"),
    });
  };
  onRecoveryPress = () => {
    if (!AccountStore.defaultHDAccount.hasCreated) {
      this.msgbox.showConfirm({
        content: i18n.t("wallet-multisig-index-hd-tip-content"),
        okText: i18n.t("wallet-multisig-index-hd-tip-ok"),
        cancelText: i18n.t("common-later"),
        onOk: () => {
          this.props.jumpTo && this.props.jumpTo("hd");
        },
      });
      return;
    }
    this.props.navigator.push({
      screen: MultiSigRecoveryScreen.screenID,
      title: i18n.t("wallet-title-recovery"),
    });
  };
  render() {
    return (
      <ScrollView style={dpStyles.main} justifyContent="center" contentContainerStyle={dpStyles.container}>
        <View style={dpStyles.imageWrap}>
          <Image source={require("@img/wallet/multisig_default_img.png")} style={dpStyles.img} />
        </View>
        <Text style={dpStyles.title}>{i18n.t("wallet-msindex-default-title")}</Text>
        <Text style={dpStyles.desc}>{i18n.t("wallet-msindex-default-desc")}</Text>
        <Button
          containerStyle={dpStyles.buttonContainer}
          buttonStyle={dpStyles.buttonStyle}
          title={i18n.t("wallet-msindex-default-create")}
          onPress={this.onCreatePress}
        />
        <View style={dpStyles.recoveryWrap}>
          <Text style={dpStyles.recoveryDesc}>{i18n.t("wallet-msindex-default-recovery-desc")}</Text>
          <TouchableHighlight
            style={{ height: 16 }}
            hitSlop={{ top: 20, bottom: 20, left: 20, right: 5 }}
            underlayColor="transparent"
            onPress={this.onJoinPress}
            activeOpacity={0.7}>
            <Text style={dpStyles.recovery}>{i18n.t("wallet-msindex-default-join")}</Text>
          </TouchableHighlight>
          <View style={dpStyles.separator} />
          <TouchableHighlight
            style={{ height: 16 }}
            hitSlop={{ top: 20, bottom: 20, left: 5, right: 20 }}
            underlayColor="transparent"
            onPress={this.onRecoveryPress}
            activeOpacity={0.7}>
            <Text style={dpStyles.recovery}>{i18n.t("wallet-msindex-default-recovery")}</Text>
          </TouchableHighlight>
        </View>
        <MessageBox ref={this.handleMsgBoxRef} />
      </ScrollView>
    );
  }
}

const dpStyles = StyleSheet.create({
  main: {
    backgroundColor: "#FFFFFF",
  },
  container: {
    alignItems: "center",
    backgroundColor: "#FFFFFF",
  },
  imageWrap: {
    width: 243,
    height: 255,
    justifyContent: "flex-end",
  },
  img: {
    width: 243,
    height: 235,
  },
  title: {
    marginTop: 0,
    fontSize: 26,
    fontWeight: theme.fontWeight.medium,
    height: 37,
    color: theme.textColor.primary,
  },
  desc: {
    marginHorizontal: 30,
    marginTop: padding(15),
    fontSize: 14,
    lineHeight: 22,
    color: "#666666",
  },
  buttonContainer: {
    width: "100%",
    marginTop: padding(40),
  },
  buttonStyle: {
    marginHorizontal: 30,
    borderRadius: 3,
    height: 50,
    elevation: 0,
    backgroundColor: theme.business.multiSig,
  },
  recoveryWrap: {
    flexDirection: "row",
    paddingVertical: padding(30),
  },
  recovery: {
    fontSize: 14,
    color: theme.linkColor,
  },
  recoveryDesc: {
    fontSize: 14,
    color: theme.textColor.mainTitle,
  },
  separator: {
    width: StyleSheet.hairlineWidth,
    height: "100%",
    marginHorizontal: 4,
    backgroundColor: theme.borderColor,
  },
});
export default MultiSigWalletComponent;
