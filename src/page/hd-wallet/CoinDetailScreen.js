import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  FlatList,
  TouchableHighlight,
  Platform,
  Image,
  RefreshControl,
} from "react-native";
import React, { Component, PureComponent } from "react";
import Screen from "../Screen";
import { observer, Observer } from "mobx-react";
import { padding } from "../../util/UIAdapter";
import { computed, observable } from "mobx";
import theme from "../../util/Theme";
import TransactionDetailScreen from "./TransactionDetailScreen";
import { Button } from "react-native-elements";
import AddressScreen from "./AddressScreen";
import Footer from "../../component/common/Footer";
import WalletTxCell from "./component/WalletTxCell";
import ActionSheet from "react-native-actionsheet";
import { toFixedLocaleString } from "../../util/NumberUtil";
import FlatListLoadMoreView from "../../component/common/FlatListLoadMoreView";
import AccountStore from "../../module/wallet/account/AccountStore";
import BigNumber from "bignumber.js";
import Coin, { BTCCoin, ERC20Coin, ETH, BSV, BCH } from "../../module/wallet/wallet/Coin";
import i18n from "../../module/i18n/i18n";
import CoinStore from "../../module/wallet/wallet/CoinStore";
import HDAccount from "../../module/wallet/account/HDAccount";
import ProgressHUD from "../../component/common/ProgressHUD";
import { installID } from "../../util/device";
import MultiSigAccount from "../../module/wallet/account/MultiSigAccount";
import { HDACCOUNT_FIND_WALELT_TYPE_COINID } from "../../config/const";
import MultiSigWallet, { MultiSigTransaction } from "../../module/wallet/wallet/MultiSigWallet";
import MessageBox, { ICON_TYPE } from "@CC/MessageBox";
import Wallet from "../../module/wallet/wallet/Wallet";
import Header from "../../component/common/Header";
import { BIZ_SCOPE } from "../../module/i18n/const";
import MultisigFAQScreen from "../multisig-wallet/MultisigFAQScreen";
import _ from "lodash";
import MultiSender from "../../module/multi-sender";

const headerBgColor = theme.business.hd;
const headerTextColor = "#FFFFFF";
const ITEM_HEIGHT = 100;
const SEPARATOR_HEIGHT = StyleSheet.hairlineWidth;
const AUTO_REFRESH_GAP = 30;
@observer
export default class CoinDetailScreen extends Screen {
  static get screenID() {
    return "CoinDetailScreen";
  }
  static navigatorStyle = {
    ...Screen.navigatorStyle,
    navBarTextColor: headerTextColor,
    navBarButtonColor: headerTextColor,
    navBarBackgroundColor: headerBgColor,
    statusBarTextColorSchemeSingleScreen: "light",
    navBarHidden: true,
    disabledSimultaneousGesture: false,
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

  @computed get rightButtons() {
    if (MultiSender.isSupportedCoin(this.coin)) {
      return [
        {
          id: "batch",
          title: i18n.t("qunfabao-batch-fabi"),
          buttonColor: "#FFFFFF",
        },
      ];
    }

    if (this.wallet instanceof MultiSigWallet) {
      return [
        {
          id: "multisig_faq",
          title: i18n.t("wallet-coindetail-header-faq"),
          buttonColor: "#FFFFFF",
        },
      ];
    }
    return [];
  }

  setRightButton() {
    this.props.navigator.setButtons({
      rightButtons: [
        {
          id: "batch",
          title: i18n.t("qunfabao-batch-fabi"),
        },
      ],
    });
  }
  @observable selectedCoinID = this.props.coinID;
  /**
   * @type {HDAccount}
   *
   * @memberof CoinDetailScreen
   */
  account = AccountStore.match(this.props.accountID);
  /**
   *
   * @type {Wallet}
   * @memberof CoinDetailScreen
   */
  @computed get wallet() {
    if (this.account instanceof HDAccount) {
      return this.account.findWallet(this.selectedCoinID, HDACCOUNT_FIND_WALELT_TYPE_COINID);
    } else if (this.account instanceof MultiSigAccount) {
      return this.account.findWallet(this.props.walletID);
    }
  }
  /**
   * @type {Coin}
   * @readonly
   * @memberof CoinDetailScreen
   */
  @computed get coin() {
    let coin;
    if (this.account instanceof HDAccount) {
      coin = this.account.findCoin(this.selectedCoinID);
    } else if (this.account instanceof MultiSigAccount) {
      coin = this.wallet.findCoin(this.selectedCoinID);
    }
    return coin;
  }

  @computed get txStore() {
    return this.wallet.txStore;
  }

  @computed get txSet() {
    return this.txStore.coinTxSet(this.coin.id);
  }

  @observable isRefreshing = false;
  @observable isLoadingMore = false;

  /**
   * 0: 全部
   * 1: 转入
   * 2: 转出
   * 3: 失败
   *
   * @memberof CoinDetailScreen
   */
  @observable txType = 0;

  @computed get txTypeText() {
    switch (this.txType) {
      case 0:
        return i18n.t("wallet-coindetail-section-type-total");
      case 1:
        return i18n.t("wallet-coindetail-section-type-receive");
      case 2:
        return i18n.t("wallet-coindetail-section-type-send");
      case 3:
        return i18n.t("wallet-coindetail-section-type-failed");
    }
  }
  @computed get txs() {
    let txs;
    switch (this.txType) {
      case 0:
        txs = this.txSet.allTxs;
        break;
      case 1:
        txs = this.txSet.inTxs;
        break;
      case 2:
        txs = this.txSet.outTxs;
        break;
      case 3:
        txs = this.txSet.failedTxs;
        break;
    }
    return txs;
  }
  @computed get loadMoreStatus() {
    if (this.txs.length == 0) {
      return "empty";
    }
    if (!this.txSet.hasMore) {
      return "nomore";
    }
    return this.isLoadingMore ? "loading" : "empty";
  }
  @computed get backgroundColor() {
    return this.wallet instanceof MultiSigWallet ? theme.business.multiSig : theme.business.hd;
  }
  @computed get title() {
    return `${this.coin.name}`;
  }
  @computed get useXpub() {
    return this.account instanceof HDAccount && this.coin instanceof BTCCoin;
  }
  constructor(props) {
    super(props);

    this.props.navigator.addOnNavigatorEvent(this.onNavigatorEvent.bind(this));
  }
  onNavigatorEvent(event) {
    switch (event.id) {
      case "batch":
        this.onBatchPress();
        break;
      case "multisig_faq":
        this.onMultsigFaqPress();
        break;
    }
  }
  handleHUDRef = ref => (this.hud = ref);
  componentDidMount = () => {
    this.intervalTask = setInterval(() => {
      this.refresh();
    }, 60 * 1000);

    const gap = (new Date().getTime() - this.txSet.lastRefreshTimeStamp) / 1000;
    if (gap <= AUTO_REFRESH_GAP) {
      return;
    }
    this.refresh();
  };
  componentWillUnmount = () => {
    clearInterval(this.intervalTask);
  };
  onBatchPress = async () => {
    if (this.coin.balance <= 0) {
      this.msgbox.show({
        content: i18n.t("qunfabao-token-not-enough"),
        iconType: ICON_TYPE.WARNING,
      });
      return;
    }

    this.props.navigator.push({
      screen: "MultiSenderGuideScreen",
      title: i18n.t("qunfabao-portal-title"),
      passProps: {
        coinID: this.coin.id,
      },
    });
  };
  onMultsigFaqPress = () => {
    this.props.navigator.push({
      screen: MultisigFAQScreen.screenID,
    });
  };
  onTxButtonPress = () => {
    if (this.coin.balance < 0) {
      this.hud && this.hud.showFailed(i18n.t("wallet-coindetail-server-maintainace"));
      return;
    }
    // if (this.wallet instanceof MultiSigWallet) {
    //     const currentTx = this.account.pendingTxs.find(tx => tx.wallet === this.wallet)
    //     if (currentTx) {
    //         this.hud && this.hud.showFailed(i18n.t('wallet-multisig-tx-processing'))
    //         return
    //     }
    // }
    this.props.navigator.push({
      screen: "TransferAssetsScreen",
      passProps: {
        accountID: this.account.id,
        coinID: this.coin.id,
        walletID: this.props.walletID,
        onTransferSuccess: this.onTransferSuccess,
        onCoinChanged: this.onCoinChanged,
      },
    });
  };
  onReceiveButtonPress = () => {
    this.props.navigator.push({
      screen: AddressScreen.screenID,
      passProps: {
        walletID: this.props.walletID,
        accountID: this.account.id,
        coinID: this.coin.id,
        backgroundColor: this.backgroundColor,
        onCoinChanged: this.onCoinChanged,
      },
      navigatorStyle: {
        navBarBackgroundColor: this.backgroundColor,
      },
    });
  };
  onTxTypeButtonPress = () => {
    this.actionSheet.show();
  };
  onActionSheetItemPress = index => {
    if (index == 4) {
      return;
    }
    this.txType = index;
  };
  onTransferSuccess = () => {
    this.refresh(false);
    return false;
  };
  onCoinChanged = coin => {
    this.selectedCoinID = coin.id;
    this.refresh();
  };
  _renderItem = ({ item }) => {
    return (
      <Observer>
        {() => (
          <WalletTxCell
            tx={item}
            navigator={this.props.navigator}
            accountID={this.account.id}
            onPress={this._onPress}
          />
        )}
      </Observer>
    );
  };
  _renderSeparator = () => <View style={tabStyles.separator} />;
  _renderEmptyComponent = () => (
    <View style={tabStyles.emptyContainer}>
      <Image source={require("@img/empty/empty_recorder.png")} />
      <Text style={tabStyles.emptyText}>{i18n.t("wallet-coindetail-emptydesc")}</Text>
    </View>
  );
  _keyExtractor = (tx, i) => tx.hash;
  _onPress = tx => {
    this.props.navigator.push({
      title: i18n.t("wallet-title-txdetail"),
      screen: TransactionDetailScreen.screenID,
      passProps: {
        orderId: tx.id,
        accountID: this.account.id,
        walletID: this.wallet.id,
        coinID: this.coin.id,
        backgroundColor: this.backgroundColor,
      },
      navigatorStyle: {
        navBarBackgroundColor: this.backgroundColor,
      },
    });
  };
  _onRefresh = async (balance = true) => {
    this.isRefreshing = true;
    const isHD = this.account instanceof HDAccount;
    try {
      await this.txStore.fetchCoinTxs(this.coin, this.wallet, 1, this.useXpub);

      if (isHD && balance) {
        await this.account.update();
      }
    } catch (error) {}
    setTimeout(() => {
      this.isRefreshing = false;
    }, 100);
  };
  _onEndReached = async () => {
    if (this.isLoadingMore || this.txs.length < 10 || !this.txSet.hasMore) {
      return;
    }

    this.isLoadingMore = true;

    try {
      await this.txStore.loadMoreCoinTxs(this.coin, this.wallet);
    } catch (error) {}

    setTimeout(() => {
      this.isLoadingMore = false;
    }, 100);
  };
  refresh = async (balance = true) => {
    await this._onRefresh(balance);
  };
  render() {
    return (
      <View style={styles.main}>
        <Header
          style={{ backgroundColor: this.backgroundColor }}
          title={this.title}
          leftButtons={CoinDetailScreen.navigatorButtons.leftButtons}
          rightButtons={this.rightButtons}
          navigator={this.navigator}
        />
        <CoinHeader coin={this.coin} backgroundColor={this.backgroundColor} />
        <SectionHeader type={this.txTypeText} onTxTypeButtonPress={this.onTxTypeButtonPress} />
        <FlatList
          refreshControl={
            <RefreshControl
              refreshing={this.isRefreshing}
              onRefresh={this._onRefresh}
              tintColor={theme.textColor.minorTitle1}
              title={i18n.t("common-loading")}
              titleColor={theme.textColor.minorTitle1}
              colors={["#f00", "#0f0", "#00f"]}
              progressBackgroundColor="#ffffff"
            />
          }
          ListEmptyComponent={this._renderEmptyComponent}
          ListFooterComponent={<FlatListLoadMoreView status={this.loadMoreStatus} />}
          onEndReached={this._onEndReached}
          onEndReachedThreshold={0.3}
          // getItemLayout={(data, index) => ({length: ITEM_HEIGHT, offset: (ITEM_HEIGHT + SEPARATOR_HEIGHT) * index, index})}
          removeClippedSubviews={true}
          initialNumToRender={5}
          data={this.txs}
          extraData={this.txs.length}
          renderItem={this._renderItem}
          ItemSeparatorComponent={this._renderSeparator}
          keyExtractor={this._keyExtractor}
          style={styles.list}
        />
        <Footer>
          <Button
            title={i18n.t("wallet-coindetail-send")}
            containerStyle={styles.buttonContainer}
            buttonStyle={[styles.button, styles.txButton, { backgroundColor: this.backgroundColor }]}
            titleStyle={[styles.buttonText, styles.txButtonText]}
            onPress={this.onTxButtonPress}></Button>
          <Button
            title={i18n.t("wallet-coindetail-receive")}
            containerStyle={styles.buttonContainer}
            buttonStyle={[styles.button, styles.receiveButton]}
            titleStyle={styles.buttonText}
            onPress={this.onReceiveButtonPress}></Button>
        </Footer>
        <ProgressHUD ref={this.handleHUDRef} />
        <ActionSheet
          ref={ref => (this.actionSheet = ref)}
          options={[
            i18n.t("wallet-coindetail-section-type-total"),
            i18n.t("wallet-coindetail-section-type-receive"),
            i18n.t("wallet-coindetail-section-type-send"),
            i18n.t("wallet-coindetail-section-type-failed"),
            i18n.t("wallet-coindetail-section-actionsheet-cancel"),
          ]}
          cancelButtonIndex={4}
          tintColor={theme.linkColor}
          onPress={this.onActionSheetItemPress}
        />
        <MessageBox ref={ref => (this.msgbox = ref)} />
      </View>
    );
  }
}

const styles = StyleSheet.create({
  main: {
    flex: 1,
  },
  header: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: headerBgColor,
  },
  price: {
    marginTop: padding(20),
    color: "#FFFFFF",
    fontSize: 30,
    fontWeight: "400",
  },
  priceDesc: {
    marginTop: padding(14),
    marginBottom: padding(20),
    color: "rgba(255, 255, 255, 0.74)",
    fontSize: 14,
    fontWeight: "400",
  },
  list: {
    flex: 1,
  },
  footer: {
    paddingTop: 18,
    height: Platform.OS === "ios" && Dimensions.get("window").width == 812 ? 100 : 86,
    flexDirection: "row",
    justifyContent: "space-between",
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 16,
  },
  buttonContainer: {
    flex: 1,
  },
  button: {
    height: 50,
    borderRadius: 0,
    elevation: 0,
  },
  buttonText: {
    fontSize: 18,
  },
  txButton: {
    backgroundColor: "#FFFFFF",
  },
  txButtonText: {
    color: "#FFFFFF",
  },
  receiveButton: {
    backgroundColor: theme.linkColor,
  },
});

const tabStyles = StyleSheet.create({
  separator: {
    height: StyleSheet.hairlineWidth,
    marginLeft: 52,
    backgroundColor: theme.borderColor,
  },
  emptyContainer: {
    height: 350,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyText: {
    marginTop: 23,
    color: theme.textColor.minorTitle2,
    fontSize: 14,
  },
});

class SectionHeader extends PureComponent {
  render() {
    return (
      <View style={shStyles.main}>
        <Text style={shStyles.text}>{i18n.t("wallet-coindetail-section-title")}</Text>
        <TouchableHighlight
          activeOpacity={0.6}
          underlayColor="transparent"
          onPress={this.props.onTxTypeButtonPress}
          hitSlop={{ top: 10, bottom: 10, left: 20, right: 20 }}>
          <View style={shStyles.typeWrap}>
            <Text style={shStyles.text}>{this.props.type}</Text>
            <Image source={require("@img/wallet/arrow_down.png")} style={shStyles.arrow} />
          </View>
        </TouchableHighlight>
      </View>
    );
  }
}

const shStyles = StyleSheet.create({
  main: {
    height: 36,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: padding(16),
    backgroundColor: theme.bgColor,
  },
  text: {
    color: theme.textColor.mainTitle,
    fontSize: 12,
  },
  arrow: {
    marginLeft: 6,
  },
  typeWrap: {
    flexDirection: "row",
    alignItems: "center",
  },
});

@observer
class CoinHeader extends Component {
  @computed get balance() {
    if (AccountStore.isHiddenPrice) {
      return "*****";
    }

    const bigNumber = new BigNumber(this.props.coin.balance + "");
    if (bigNumber.isLessThan(0)) {
      return "-";
    }

    return toFixedLocaleString(
      this.props.coin.balance,
      this.props.coin instanceof BTCCoin || this.props.coin instanceof ETH ? 8 : 4,
      true
    );
  }

  @computed get totalAsset() {
    if (AccountStore.isHiddenPrice) {
      return "*****";
    }

    if (this.balance == "-") {
      return "-";
    }

    return `≈${toFixedLocaleString(this.props.coin.totalPrice, 2, true)} ${CoinStore.currency}`;
  }

  @computed get floatingAsset() {
    if (AccountStore.isHiddenPrice) {
      return "*****";
    }

    const price = toFixedLocaleString(Math.abs(this.props.coin.floatingTotalPrice), 2, true);
    if (this.props.coin.floatingTotalPrice > 0) {
      return `+${price}`;
    } else if (this.props.coin.floatingTotalPrice < 0) {
      return `-${price}`;
    } else {
      return price;
    }
  }

  @computed get coinbase() {
    if (AccountStore.isHiddenPrice) {
      return "*****";
    }
    return `≈${this.props.coin.coinbase} BTC`;
  }
  @computed get hasAvailable() {
    return this.props.coin.hasOwnProperty("available");
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
  _onVisualButtonPress = () => {
    AccountStore.isHiddenPrice = !AccountStore.isHiddenPrice;
  };
  render() {
    const { coin, backgroundColor } = this.props;
    return (
      <View style={[hStyles.main, { backgroundColor }]}>
        <View style={hStyles.titleWrap}>
          <Text style={hStyles.title}>
            {i18n.t("wallet-coindetail-header-total")}({coin.name}){" "}
          </Text>
          <TouchableHighlight
            hitSlop={{ top: 10, bottom: 10, left: 20, right: 20 }}
            underlayColor="transparent"
            activeOpacity={0.6}
            onPress={this._onVisualButtonPress}>
            <Image
              tintColor={theme.textColor.light}
              source={
                AccountStore.isHiddenPrice
                  ? require("@img/wallet/asset_invisual.png")
                  : require("@img/wallet/asset_visual.png")
              }
              style={hStyles.showIcon}
            />
          </TouchableHighlight>
        </View>
        <Text style={hStyles.price}>{this.balance}</Text>
        <Text style={[hStyles.title, { marginTop: 6 }]}>{this.totalAsset}</Text>
        {this.hasAvailable && (
          <Text style={hStyles.available}>
            {i18n.tt(BIZ_SCOPE.wallet, "available")} {this.available} | {i18n.tt(BIZ_SCOPE.wallet, "frozen")}{" "}
            {this.frozen}
          </Text>
        )}
      </View>
    );
  }
}

const hStyles = StyleSheet.create({
  main: {
    // flex: 1,
    backgroundColor: theme.business.hd,
    paddingHorizontal: padding(16),
    paddingTop: padding(10),
    paddingBottom: padding(30),
  },
  showIcon: {
    position: "relative",
    top: -1,
    tintColor: "#FFFFFF80",
  },
  totalWrap: {
    width: "50%",
  },
  todayWrap: {
    width: "50%",
  },
  titleWrap: {
    flexDirection: "row",
    alignItems: "center",
  },
  title: {
    height: 17,
    fontSize: 12,
    color: "#FFFFFF80",
  },
  price: {
    marginTop: padding(12),
    // height: 26,
    fontSize: 30,
    fontWeight: theme.fontWeight.medium,
    color: "#FFFFFF",
    fontFamily: theme.bigNumberFontFamily,
  },
  available: {
    marginTop: 8,
    color: "#FFFFFF80",
    fontSize: 13,
  },
});
