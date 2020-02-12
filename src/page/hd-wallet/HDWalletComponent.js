import React, { Component, PureComponent } from "react";
import {
  StyleSheet,
  View,
  FlatList,
  Image,
  TouchableHighlight,
  Text,
  Alert,
  Platform,
  RefreshControl,
  Dimensions,
  I18nManager,
  ScrollView,
  Animated,
  PanResponder,
  TextInput,
  DeviceEventEmitter,
} from "react-native";
import { observer, Observer } from "mobx-react";
import { padding, manualPadding } from "../../util/UIAdapter";
import { toPriceString, toFixedLocaleString } from "../../util/NumberUtil";
import AssetsHeader from "./component/AssetsHeader";
import { observable, computed, autorun } from "mobx";
import theme from "../../util/Theme";
import CoinDetailScreen from "./CoinDetailScreen";
import TransferAssetsScreen from "./HDSendTransactionScreen";
import AddAssets from "./AddAssets";
import AccountStore from "../../module/wallet/account/AccountStore";
import { Button } from "react-native-elements";
import CreateWalletScreen from "./CreateWalletScreen";
import ImportHDWalletScreen from "./ImportHDWalletScreen";
import {
  WALLET_TYPE_ETH,
  WALLET_TYPE_BTC,
  COIN_ID_BTC,
  COIN_ID_ETH,
  ACCOUNT_TYPE_HD_IMPORT,
  WALLET_TAB_JUMP_NOTIFICATION,
  WALLET_TAB_JUMP_NOTIFICATION_INDEX_HD,
} from "../../config/const";
import Tip from "../../component/common/Tip";
import BackupWalletScreen from "./BackupWalletScreen";
import { BTCCoin, ERC20Coin, ETH, BCH, BSV } from "../../module/wallet/wallet/Coin";
import i18n from "../../module/i18n/i18n";
import device from "../../util/device";
import CoinStore from "../../module/wallet/wallet/CoinStore";
import FastImage from "react-native-fast-image";
import BigNumber from "bignumber.js";
import FlatListLoadMoreView from "../../component/common/FlatListLoadMoreView";
import BackupSection, { AnimatedBackupSection } from "./component/BackupSection";
import FunctionSection from "./component/FunctionSection";
import AddressScreen from "./AddressScreen";
import address from "../../module/wallet/wallet/util/address";
import ProgressHUD from "../../component/common/ProgressHUD";
import HDAccount from "../../module/wallet/account/HDAccount";
import { BIZ_SCOPE } from "../../module/i18n/const";
import MessageBox from "@CC/MessageBox";

const { height, width } = Dimensions.get("window");
const ITEM_HEIGHT = 78;
const SEPARATOR_HEIGHT = StyleSheet.hairlineWidth;
@observer
class HDWalletComponent extends Component {
  pan = new Animated.ValueXY();
  @observable isRefreshing = false;
  @computed get account() {
    return AccountStore.defaultHDAccount;
  }
  static navigatorButtons = {
    leftButtons: [
      {
        id: "drawer",
        icon: require("@img/nav/nav_menu.png"),
      },
    ],
    rightButtons: [
      {
        id: "tx_list",
        icon: require("@img/nav/nav_menu_bill.png"),
      },
    ],
  };
  @computed get coins() {
    if (this.account.displayChange) {
      return this.account.coins;
    }
    return this.account.coins.filter(coin => coin && (coin.totalPrice >= 100 || coin.balance >= 100));
  }
  get functionSectionData() {
    return [
      {
        icon: require("@img/wallet/wallet_send.png"),
        name: i18n.tt(BIZ_SCOPE.wallet, "hdindex-function-transfer"),
        onPress: this.onSendPress,
      },
      {
        icon: require("@img/wallet/wallet_receive.png"),
        name: i18n.tt(BIZ_SCOPE.wallet, "hdindex-function-receive"),
        onPress: this.onReceivePress,
      },
      {
        icon: require("@img/wallet/wallet_scan.png"),
        name: i18n.tt(BIZ_SCOPE.wallet, "hdindex-function-scan"),
        onPress: this.onScanPress,
      },
      {
        icon: require("@img/wallet/wallet_batch.png"),
        name: i18n.tt(BIZ_SCOPE.wallet, "hdindex-function-batch"),
        onPress: this.onBatchPress,
      },
    ];
  }
  constructor(props) {
    super(props);
    this._panResponder = PanResponder.create({
      onPanResponderMove: this._onPanResponderMove,
    });
    DeviceEventEmitter.addListener(WALLET_TAB_JUMP_NOTIFICATION, ({ index }) => {
      if (index !== WALLET_TAB_JUMP_NOTIFICATION_INDEX_HD) {
        return;
      }
      this.props.jumpTo && this.props.jumpTo("hd");
    });
  }
  onSendPress = () => {
    this.props.navigator.push({
      screen: TransferAssetsScreen.screenID,
      passProps: {
        accountID: this.account.id,
        walletID: this.account.lastWalletID,
        coinID: this.account.lastTransferCoinID,
        onTransferSuccess: () => {
          this.props.navigator.pop();
          const exec = () => {
            this.props.navigator.push({
              screen: CoinDetailScreen.screenID,
              passProps: {
                coinID: this.account.lastTransferCoinID,
                accountID: this.account.id,
              },
            });
          };
          if (Platform.OS === "android") {
            setTimeout(() => {
              exec();
            }, 650);
          } else {
            exec();
          }
          return true;
        },
      },
    });
  };
  onReceivePress = () => {
    this.props.navigator.push({
      screen: AddressScreen.screenID,
      passProps: {
        accountID: this.account.id,
        walletID: this.account.lastWalletID,
        coinID: this.account.lastReceiveCoinID,
        backgroundColor: theme.business.hd,
      },
    });
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
  onScanQRCode = ({ data }, tip) => {
    const res = address.decodeAdress(data);
    if (res.type !== COIN_ID_BTC && res.type !== COIN_ID_ETH) {
      tip.showInfo({
        title: "注意",
        message: "不支持的地址格式",
      });
      return;
    }
    this.props.navigator.push({
      screen: TransferAssetsScreen.screenID,
      passProps: {
        accountID: this.account.id,
        coinID: res.type,
        address: res.address,
        onTransferSuccess: () => {
          this.props.navigator.popToRoot();
          const exec = () => {
            this.props.navigator.push({
              screen: CoinDetailScreen.screenID,
              passProps: {
                coinID: this.account.lastTransferCoinID,
                accountID: this.account.id,
              },
            });
          };
          if (Platform.OS === "android") {
            setTimeout(() => {
              exec();
            }, 650);
          } else {
            exec();
          }
          return true;
        },
      },
    });
    return true;
  };
  onBatchPress = () => {
    this.props.navigator.push({
      screen: "MultiSenderGuideScreen",
      title: i18n.t("qunfabao-portal-title"),
    });
  };
  onAddCoinButtonPress = () => {
    this.props.navigator.push({
      screen: AddAssets.screenID,
      passProps: {
        accountID: this.account.id,
      },
    });
  };
  onCreateButtonPress = () => {
    this.props.navigator.push({
      screen: CreateWalletScreen.screenID,
    });
  };
  onRecoveryButtonPress = () => {
    this.props.navigator.push({
      screen: ImportHDWalletScreen.screenID,
    });
  };
  onBackupButtonPress = () => {
    this.props.navigator.push({
      screen: BackupWalletScreen.screenID,
      title: i18n.t("wallet-title-backup-mnemonic"),
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
  _renderHeader = () => (
    <View style={styles.header}>
      <BackupSection account={this.account} onPress={this.onBackupButtonPress} />
      <AssetsHeader account={this.account} colors={["#343a49", "#515663"]} separatorColor={"#858892"} />
      <FunctionSection data={this.functionSectionData} />
      <View style={styles.separator} />
      <CoinHeader account={this.account} onPress={this.onAddCoinButtonPress} />
    </View>
  );
  _renderSeparator = () => (
    <View style={cellStyles.separatorWrap}>
      <View style={cellStyles.separator} />
    </View>
  );
  _keyExtractor = item => item.id + "";
  _renderItem = ({ item }) => (
    <Observer>{() => <CoinCell coin={item} navigator={this.props.navigator} account={this.account} />}</Observer>
  );
  _getItemLayout = (data, index) => ({ length: ITEM_HEIGHT, offset: (ITEM_HEIGHT + SEPARATOR_HEIGHT) * index, index });
  render() {
    if (this.account.needRecovery) {
      return <HDWalletRecoveryComponent />;
    }
    if (!this.account.hasCreated) {
      return this.renderDefaultPage();
    }
    return (
      <View style={styles.main}>
        <FlatList
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
          ListFooterComponent={<FlatListLoadMoreView status={"nomore"} style={styles.loadMore} />}
          ListHeaderComponent={this._renderHeader}
          ItemSeparatorComponent={this._renderSeparator}
          keyExtractor={this._keyExtractor}
          renderItem={this._renderItem}
          data={this.coins}
          onMomentumScrollEnd={this._onMomentumScrollEnd}
          initialNumToRender={5}
          removeClippedSubviews={true}
          showsVerticalScrollIndicator={false}
          {...this._panResponder.panHandlers}
        />
        <MessageBox ref={ref => (this.msgbox = ref)} />
      </View>
    );
  }
  renderDefaultPage = () => {
    return <DefaultPage navigator={this.props.navigator} />;
  };
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
    backgroundColor: theme.backgroundColor,
  },
  cover: {
    position: "absolute",
    backgroundColor: "#FFFFFF",
    width: "100%",
    height: 250,
  },
  header: {
    backgroundColor: "#FFFFFF",
  },
  list: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  separator: {
    height: 10,
    backgroundColor: theme.backgroundColor,
  },
  loadMore: {
    backgroundColor: "#FFFFFF",
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
      this.props.coin instanceof BTCCoin || this.props.coin instanceof ETH ? 8 : 4,
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
  onPress = () => {
    const { coin, account } = this.props;
    this.props.navigator.push({
      screen: CoinDetailScreen.screenID,
      title: coin.name,
      passProps: {
        coinID: coin.id,
        accountID: account.id,
      },
    });
  };
  render() {
    const { coin } = this.props;
    return (
      <TouchableHighlight style={cellStyles.highlight} onPress={this.onPress}>
        <View style={cellStyles.container}>
          <FastImage source={{ uri: this.props.coin.icon }} style={cellStyles.icon} />
          <View style={cellStyles.firstColumn}>
            <View style={cellStyles.nameWrap}>
              <Text numberOfLines={1} ellipsizeMode="middle" style={cellStyles.primaryText}>
                {this.props.coin.name}
              </Text>
              {coin instanceof ERC20Coin && coin.name === "USDT" && (
                <Image style={cellStyles.typeIcon} source={require("@img/wallet/erc20.png")} />
              )}
            </View>
            <Text style={[cellStyles.mainText, { marginTop: 4 }]}>
              {toPriceString(this.props.coin.price, 2, 4, true)} {CoinStore.currency}
            </Text>
          </View>
          <View style={cellStyles.secondColumn}>
            <Text style={cellStyles.primaryText}>{this.balance}</Text>
            <Text style={[cellStyles.mainText, { marginTop: 4 }]}>{this.totalPrice}</Text>
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
    alignItems: "center",
    height: 78,
    paddingHorizontal: padding(16),
  },
  firstColumn: {
    flex: 1,
    marginLeft: padding(12),
  },
  nameWrap: {
    flexDirection: "row",
    alignItems: "center",
  },
  typeIcon: {
    marginLeft: 8,
  },
  secondColumn: {
    alignItems: "flex-end",
  },
  icon: {
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
@observer
class CoinHeader extends Component {
  @computed get displayChangeText() {
    return this.props.account.displayChange
      ? i18n.t("wallet-hdindex-sectionheader-hidechange")
      : i18n.t("wallet-hdindex-sectionheader-showchange");
  }
  @computed get displayChangeIcon() {
    return this.props.account.displayChange
      ? require("@img/wallet/asset_visual.png")
      : require("@img/wallet/asset_invisual.png");
  }
  onDisplayChangeButtonPress = () => {
    this.props.account.displayChange = !this.props.account.displayChange;
  };
  render() {
    return (
      <View style={chStyles.main}>
        <Text style={chStyles.title}>{i18n.t("wallet-hdindex-coinsection-title")}</Text>
        <TouchableHighlight activeOpacity={0.6} underlayColor="transparent" onPress={this.props.onPress}>
          <View style={chStyles.buttonWrap}>
            <Image source={require("@img/wallet/icon_wallet_add.png")} />
            <Text style={chStyles.buttonTitle}>{i18n.t("wallet-hdindex-sectionheader-add")}</Text>
          </View>
        </TouchableHighlight>
        <View style={chStyles.separator} />
        <TouchableHighlight activeOpacity={0.6} underlayColor="transparent" onPress={this.onDisplayChangeButtonPress}>
          <View style={[chStyles.buttonWrap, { paddingRight: 0 }]}>
            <Image source={this.displayChangeIcon} style={chStyles.icon} />
            <Text style={chStyles.buttonTitle}>{this.displayChangeText}</Text>
          </View>
        </TouchableHighlight>
      </View>
    );
  }
}

const chStyles = StyleSheet.create({
  main: {
    height: 70,
    flexDirection: "row",
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    paddingHorizontal: padding(16),
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
  separator: {
    height: 12,
    width: 1,
    backgroundColor: theme.borderColor,
  },
  buttonTitle: {
    marginLeft: 6,
    color: theme.linkColor,
    fontSize: 12,
  },
});

class DefaultPage extends PureComponent {
  onCreatePress = () => {
    this.props.navigator.push({
      screen: CreateWalletScreen.screenID,
      title: i18n.t("wallet-title-create"),
    });
  };
  onRecoveryPress = () => {
    this.props.navigator.push({
      screen: ImportHDWalletScreen.screenID,
      title: i18n.t("wallet-title-recovery"),
    });
  };
  render() {
    return (
      <ScrollView style={dpStyles.main} justifyContent="center" contentContainerStyle={dpStyles.container}>
        <View style={dpStyles.imageWrap}>
          <Image source={require("@img/wallet/hd_default_img.png")} style={dpStyles.img} />
        </View>

        <Text style={dpStyles.title}>{i18n.t("wallet-hdindex-default-title")}</Text>
        <Text style={dpStyles.desc}>{i18n.t("wallet-hdindex-default-desc")}</Text>
        <Button
          containerStyle={dpStyles.buttonContainer}
          buttonStyle={dpStyles.buttonStyle}
          title={i18n.t("wallet-hdindex-default-create")}
          onPress={this.onCreatePress}
        />
        <TouchableHighlight underlayColor="transparent" onPress={this.onRecoveryPress} activeOpacity={0.7}>
          <Text style={dpStyles.recoveryDesc}>
            {i18n.t("wallet-hdindex-default-recovery-desc")}
            <Text style={dpStyles.recovery}>{i18n.t("wallet-hdindex-default-recovery")}</Text>
          </Text>
        </TouchableHighlight>
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
    width: 190,
    height: 214,
    justifyContent: "flex-end",
  },
  img: {
    width: 190,
    height: 190,
  },
  title: {
    marginTop: padding(40),
    fontSize: 26,
    height: 37,
    fontWeight: theme.fontWeight.medium,
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
    backgroundColor: theme.business.hd,
  },
  recoveryWrap: {
    flexDirection: "row",
    marginTop: padding(30),
  },
  recovery: {
    fontSize: 14,
    color: theme.linkColor,
  },
  recoveryDesc: {
    marginTop: padding(30),
    fontSize: 14,
    color: theme.textColor.mainTitle,
  },
});

@observer
class HDWalletRecoveryComponent extends Component {
  @computed get disabled() {
    return this.pwd.length < 8;
  }
  @observable pwd = "";
  _onChangeText = text => {
    this.pwd = text;
  };
  _onPress = async () => {
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
      <View style={rcStyles.main}>
        <Text style={rcStyles.title}>{i18n.tt(BIZ_SCOPE.wallet, "hdindex-recovery-title")}</Text>
        <Text style={rcStyles.desc}>{i18n.tt(BIZ_SCOPE.wallet, "hdindex-recovery-desc1")}</Text>
        <View style={rcStyles.inputWrap}>
          <TextInput
            style={rcStyles.input}
            value={this.pwd}
            onChangeText={this._onChangeText}
            autoCorrect={false}
            allowFontScaling={false}
            clearButtonMode="always"
            secureTextEntry={true}
          />
        </View>
        <Button
          containerStyle={rcStyles.buttonContainer}
          buttonStyle={rcStyles.buttonStyle}
          disabled={this.disabled}
          title={i18n.t("common-confirm")}
          onPress={this._onPress}
        />
        <ProgressHUD ref={ref => (this.hud = ref)} />
      </View>
    );
  }
}

const rcStyles = StyleSheet.create({
  main: {
    flex: 1,
    paddingHorizontal: 30,
    alignItems: "center",
    backgroundColor: "#FFFFFF",
  },
  title: {
    marginTop: 80,
    fontSize: 26,
    fontWeight: theme.fontWeight.medium,
    color: theme.textColor.primary,
  },
  desc: {
    paddingHorizontal: 20,
    marginTop: 10,
    fontSize: 14,
    lineHeight: 24,
    textAlign: "center",
    color: theme.textColor.mainTitle,
  },
  inputWrap: {
    height: 49,
    flexDirection: "row",
    alignItems: "center",
    borderBottomColor: theme.borderColor,
    borderBottomWidth: 1,
  },
  input: {
    flex: 1,
    fontSize: 16,
  },
  buttonContainer: {
    width: "100%",
    marginTop: 30,
  },
  buttonStyle: {
    height: 50,
    elevation: 0,
    borderRadius: 3,
    backgroundColor: theme.business.hd,
  },
});
export default HDWalletComponent;
