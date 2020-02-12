import React, { Component } from "react";
import {
  StyleSheet,
  View,
  TouchableHighlight,
  Text,
  Image,
  FlatList,
  SectionList,
  Platform,
  Keyboard,
} from "react-native";
import Screen from "../Screen";
import theme from "../../util/Theme";
import { observer, Observer } from "mobx-react";
import { padding } from "../../util/UIAdapter";
import * as Animatable from "react-native-animatable";
import { toFixedLocaleString } from "../../util/NumberUtil";
import { observable, computed } from "mobx";
import AccountStore from "../../module/wallet/account/AccountStore";
import { BTCCoin, ERC20Coin } from "../../module/wallet/wallet/Coin";
import i18n from "../../module/i18n/i18n";
import Wallet from "../../module/wallet/wallet/Wallet";
import HDAccount from "../../module/wallet/account/HDAccount";
import { HDACCOUNT_FIND_WALELT_TYPE_COINID, COIN_ID_BTC, COIN_ID_USDT } from "../../config/const";
import MultiSigAccount from "../../module/wallet/account/MultiSigAccount";
import device from "../../util/device";
import Header from "../../component/common/Header";
import { BIZ_SCOPE } from "../../module/i18n/const";

const height = device.windowSize.height + Platform.select({ ios: 0, android: 150 });

Animatable.initializeRegistryWithDefinitions({
  fadeInOut: {
    0: {
      opacity: 0,
    },
    0.1: {
      opacity: 1,
    },
    0.95: {
      opacity: 1,
    },
    1: {
      opacity: 0,
    },
  },
});

@observer
export default class SelectCoinScreen extends Component {
  static get screenID() {
    return "SelectCoinScreen";
  }

  static navigatorButtons = {
    rightButtons: [
      {
        id: "cancel_select",
        title: i18n.t("common-cancel"),
        buttonColor: theme.linkColor,
      },
    ],
  };

  @observable selectedCoinID = this.props.coinID;

  @computed get account() {
    return this.props.account;
  }
  /**
   *
   * @type {Wallet}
   * @memberof SelectCoinScreen
   */
  @computed get wallet() {
    if (this.account instanceof HDAccount) {
      return this.account.findWallet(this.selectedCoinID, HDACCOUNT_FIND_WALELT_TYPE_COINID);
    } else if (this.account instanceof MultiSigAccount) {
      return this.account.findWallet(this.props.walletID);
    }
  }

  @computed get selectedCoin() {
    if (this.account instanceof HDAccount) {
      return this.account.findCoin(this.selectedCoinID);
    } else if (this.account instanceof MultiSigAccount) {
      return this.wallet.findCoin(this.selectedCoinID);
    }
  }

  @computed get sections() {
    const filter = this.props.filter;
    const sections = [];
    if (this.account instanceof HDAccount) {
      const main = [];
      const token = [];
      for (const coin of this.account.coins) {
        if (filter && !filter(coin)) {
          continue;
        }
        if (coin instanceof ERC20Coin) {
          token.push(coin);
        } else {
          main.push(coin);
        }
      }
      if (main.length > 0) {
        sections.push({ title: i18n.tt(BIZ_SCOPE.wallet, "asset-mainnet"), data: main });
      }
      if (token.length > 0) {
        sections.push({ title: "Token", data: token });
      }

      return sections;
    }
  }

  @computed get sectionsSlice() {
    return this.sections.map(section => {
      return {
        title: section.title,
        data: section.data.slice(),
      };
    });
  }

  constructor(props) {
    super(props);
    this.props.navigator.addOnNavigatorEvent(this.onNavigatorEvent);
  }

  onNavigatorEvent = event => {
    if (event.type == "NavBarButtonPress") {
      if (event.id == "cancel_select") {
        this.onCancelPress();
      }
    }
  };
  handleViewRef = ref => (this.view = ref);

  show = () => {
    Keyboard.dismiss();
    this.view.transitionTo(
      {
        transform: [
          {
            translateY: 0,
          },
        ],
      },
      300,
      "ease-out"
    );
  };
  dismiss = () => {
    this.view.transitionTo(
      {
        transform: [
          {
            translateY: height,
          },
        ],
      },
      300,
      "ease-in"
    );
    setTimeout(() => {
      this.setState({
        pwd: "",
      });
    }, 150);
  };
  onCancelPress = () => {
    this.props.onDismiss && this.props.onDismiss();
  };
  _renderItem = ({ item }) => {
    return (
      <Observer>
        {() => (
          <TouchableHighlight style={styles.highlight} onPress={this._onPress.bind(this, item)}>
            <View style={styles.wrap}>
              <Image style={styles.icon} source={{ uri: item.icon }} />
              <View style={styles.container}>
                <View style={styles.row}>
                  <View style={styles.balanceWrap}>
                    <View style={styles.nameWrap}>
                      <Text style={styles.name}>{item.name}</Text>
                      {item instanceof ERC20Coin && <Image source={require("@img/wallet/erc20.png")} />}
                    </View>
                    <Text style={styles.balance}>
                      {i18n.t("wallet-coin-balance")}：
                      {toFixedLocaleString(item.balance, item instanceof BTCCoin ? 8 : 4)}
                    </Text>
                  </View>
                  {item === this.selectedCoin && <Image source={require("@img/mine/mine_currency_selected.png")} />}
                </View>
              </View>
            </View>
          </TouchableHighlight>
        )}
      </Observer>
    );
  };
  _renderSeparator = () => (
    <View style={styles.separatorWrap}>
      <View style={styles.separator} />
    </View>
  );
  _renderHeaderComponent = () => <View style={{ marginTop: 12 }} />;
  _renderSectionHeader = ({ section: { title } }) => (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{title}</Text>
    </View>
  );
  _keyExtractor = (item, i) => item.id + i + "";
  _onPress = coin => {
    this.selectedCoinID = coin.id;
    this.props.onSelected && this.props.onSelected(coin);
  };

  render() {
    if (!(this.account instanceof HDAccount)) {
      return null;
    }
    return (
      <Animatable.View ref={this.handleViewRef} style={styles.main}>
        <Header
          title={i18n.tt(BIZ_SCOPE.wallet, "title-select-coin")}
          titleColor={theme.textColor.primary}
          rightButtons={SelectCoinScreen.navigatorButtons.rightButtons}
          navigator={this.props.navigator}
          style={styles.header}
        />
        <SectionList
          sections={this.sections}
          renderItem={this._renderItem}
          renderSectionHeader={this._renderSectionHeader}
          ItemSeparatorComponent={this._renderSeparator}
          keyExtractor={this._keyExtractor}
          stickySectionHeadersEnabled={true}
        />
      </Animatable.View>
    );
  }
}

const styles = StyleSheet.create({
  main: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    top: 0,
    backgroundColor: theme.backgroundColor,
    transform: [
      {
        translateY: height,
      },
    ],
  },
  header: {
    backgroundColor: "#FFFFFF",
  },
  highlight: {
    backgroundColor: "#FFFFFF",
  },
  wrap: {
    flex: 1,
    paddingTop: 18,
    paddingBottom: 19,
    flexDirection: "row",
    paddingHorizontal: 16,
  },
  container: {
    flex: 1,
    marginLeft: 8,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  separatorWrap: {
    height: 1,
    backgroundColor: "#FFFFFF",
  },
  separator: {
    height: StyleSheet.hairlineWidth,
    marginLeft: 64,
    backgroundColor: theme.borderColor,
  },
  icon: {
    width: 36,
    height: 36,
  },
  nameWrap: {
    flexDirection: "row",
    alignItems: "center",
  },
  name: {
    marginRight: 6,
    fontSize: 16,
    color: theme.textColor.primary,
    fontWeight: theme.fontWeight.medium,
    fontFamily: theme.alphanumericFontFamily,
  },
  balance: {
    marginTop: 5,
    fontSize: 12,
    color: theme.textColor.mainTitle,
  },
  sectionHeader: {
    height: 32,
    backgroundColor: theme.backgroundColor,
    justifyContent: "center",
  },
  sectionTitle: {
    fontSize: 12,
    color: theme.textColor.mainTitle,
    marginLeft: 16,
  },
});

class CoinSelectorHD extends Component {
  render() {}
}

class CoinSelectorMultiSig extends Component {}
