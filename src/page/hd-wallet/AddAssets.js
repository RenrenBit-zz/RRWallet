import {
  StyleSheet,
  View,
  Image,
  Text,
  Switch,
  PixelRatio,
  ScrollView,
  DeviceEventEmitter,
  TextInput,
  FlatList,
  TouchableHighlight,
  Platform,
  SectionList,
} from "react-native";
import React, { Component } from "react";
import DFNetwork, { HD_WEB_API } from "../../module/common/network";
import { observable, autorun, computed } from "mobx";
import { observer, reaction, Observer } from "mobx-react";
import Theme from "../../util/Theme";
import Wallet from "../../module/wallet/wallet/Wallet";
import Screen from "../Screen";
import theme from "../../util/Theme";
import ProgressHUD from "../../component/common/ProgressHUD";
import errorHandler from "../../util/ErrorHandler";
import { debounce } from "lodash";
import CoinStore from "../../module/wallet/wallet/CoinStore";
import AccountStore from "../../module/wallet/account/AccountStore";
import Header from "../../component/common/Header";
import { Icon } from "react-native-elements";
import i18n from "../../module/i18n/i18n";
import { ERC20Coin, BTCCoin } from "../../module/wallet/wallet/Coin";
import { toFixedLocaleString } from "../../util/NumberUtil";
import AccountStorage from "../../module/wallet/account/AccountStorage";
import EmptyView from "../../component/common/EmptyView";
import FastImage from "react-native-fast-image";
import network from "../../module/common/network";
import { BIZ_SCOPE } from "../../module/i18n/const";
import BigNumber from "bignumber.js";
import device from "../../util/device";
//添加新资产页面
@observer
export default class AddAssets extends Screen {
  static get screenID() {
    return "AddAssets";
  }
  static get title() {
    return i18n.tt(BIZ_SCOPE.wallet, "title-asset");
  }
  static navigatorStyle = {
    ...Screen.navigatorStyle,
    navBarHidden: true,
  };

  @computed get account() {
    return AccountStore.defaultHDAccount;
  }

  @observable text = "";
  constructor(props) {
    super(props);
    this.onSearchBarTextChange = debounce(this.onSearchBarTextChange, 500);
  }
  @observable loading = true;
  @observable tokens = [];
  @computed get sections() {
    const sections = [];
    let main = [];
    let token = this.tokens.slice();
    for (const coin of this.account.allCoins) {
      if (coin instanceof ERC20Coin) {
        // token.push(coin)
      } else {
        main.push(coin);
      }
    }
    if (this.text.length > 0) {
      main = main.filter(coin => coin.name && coin.name.toLowerCase().indexOf(this.text) != -1);
      token = token.filter(coin => coin.name && coin.name.toLowerCase().indexOf(this.text) != -1);
    } else {
      token = token.filter(coin => coin.display || new BigNumber(coin.balance).isGreaterThan(0));
    }

    if (main.length > 0) {
      sections.push({ title: i18n.tt(BIZ_SCOPE.wallet, "asset-mainnet"), data: main });
    }
    if (token.length > 0) {
      sections.push({ title: "Token", data: token });
    }

    return sections;
  }
  componentDidMount = () => {
    this.fetchData();
  };
  fetchData = async () => {
    try {
      this.hud.showLoading();
      const data = (
        await network.get(
          "getAllTokens",
          {
            walletAddress: AccountStore.defaultHDAccount.ETHWallet.address,
          },
          HD_WEB_API
        )
      ).data;
      const tokens = data.map(
        el =>
          new ERC20Coin({
            name: el.tokenName,
            icon: el.logoUrl,
            balance: el.value,
            display: el.include,
            contract: el.tokenAddress,
          })
      );
      this.tokens = tokens;
    } catch (error) {}
    this.hud && this.hud.dismiss();
    this.loading = false;
  };
  render() {
    return (
      <View style={styles.container}>
        <SearchBar onChangeText={this.onSearchBarTextChange} onCancel={this.onCancel} />
        {!this.loading && (
          <SectionList
            sections={this.sections}
            renderSectionHeader={this._renderSectionHeader}
            renderItem={this._renderItem}
            keyboardDismissMode={"on-drag"}
            ItemSeparatorComponent={this._renderSeparator}
            keyExtractor={this._keyExtractor}
            stickySectionHeadersEnabled={true}
            ListEmptyComponent={this._renderEmptyComponent}
          />
        )}
        <ProgressHUD ref={ref => (this.hud = ref)} />
      </View>
    );
  }
  componentWillUnmount() {
    this.isUpToken && DeviceEventEmitter.emit("refreshAppPageAlert");
  }
  onClearText = () => {
    this.text = "";
  };
  onCancel = () => {
    this.props.navigator.pop();
  };
  onSearchBarTextChange = text => {
    this.text = text.toLowerCase();
  };
  _renderItem = ({ item }) => {
    return (
      <Observer>{() => <CoinCell coin={item} wallet={this.wallet} account={this.account} hud={this.hud} />}</Observer>
    );
  };
  _renderSeparator = () => (
    <View style={styles.separatorWrap}>
      <View style={styles.separator} />
    </View>
  );
  _renderSectionHeader = ({ section: { title } }) => (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{title}</Text>
    </View>
  );
  _keyExtractor = (item, i) => `${item.id}${item.contract}`;
  _renderEmptyComponent = () => <EmptyView title="ERC20币种可直接使用ETH地址收款，到账后自动展示" />;
}

class SearchBar extends Component {
  _onChangeText = text => {
    this.props.onChangeText && this.props.onChangeText(text);
  };
  _onCancel = () => {
    this.props.onCancel && this.props.onCancel();
  };
  render() {
    return (
      <View style={sbStyles.main}>
        <View style={sbStyles.container}>
          <View style={sbStyles.searchBox}>
            <Image source={require("@img/icon/search.png")} />
            <TextInput
              style={sbStyles.inputText}
              ref="searchText"
              underlineColorAndroid="transparent"
              onChangeText={this._onChangeText}
              //onSubmitEditing = {this.search.bind(this)}
              autoCorrect={false}
              autoCapitalize="none"
              keyboardType="web-search"
              returnKeyType="search"
              clearButtonMode="while-editing"
              placeholder={i18n.t("wallet-coinsearching-search-placeholder-v2")}
            />
          </View>
          <TouchableHighlight onPress={this._onCancel} activeOpacity={0.6} underlayColor="transparent">
            <Text style={sbStyles.cancel}> {i18n.t("common-cancel")} </Text>
          </TouchableHighlight>
        </View>
      </View>
    );
  }
}

const sbStyles = StyleSheet.create({
  main: {
    height: device.navBarHeight + 10,
    paddingTop: device.statusBarHeight,
    backgroundColor: "#FFFFFF",
  },
  container: {
    flex: 1,
    flexDirection: "row",
    paddingHorizontal: 16,
    // paddingBottom: 6,
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Theme.borderColor,
  },
  searchBox: {
    //搜索框
    marginRight: 16,
    paddingHorizontal: 10,
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    height: 32,
    borderRadius: 16,
    backgroundColor: Theme.backgroundColor,
  },
  inputText: {
    position: "relative",
    top: 1,
    flex: 1,
    backgroundColor: "transparent",
    fontSize: 12,
    marginLeft: 6,
    paddingVertical: 0,
  },
  searchIcon: {
    //搜索图标
    height: 20,
    width: 20,
    resizeMode: "stretch",
  },
  cancel: {
    fontSize: 16,
    color: Theme.linkColor,
  },
});
@observer
class CoinCell extends Component {
  @computed get coin() {
    return this.props.coin;
  }
  @computed get icon() {
    if (this.coin instanceof ERC20Coin) {
      return require("@img/wallet/erc20.png");
    }
    return undefined;
  }
  render() {
    return (
      <View style={itemStyles.wrap}>
        <FastImage style={itemStyles.icon} source={{ uri: this.coin.icon }} />
        <View style={itemStyles.container}>
          <View style={itemStyles.row}>
            <View style={itemStyles.balanceWrap}>
              <View style={itemStyles.nameWrap}>
                <Text style={itemStyles.name}>{this.coin.name}</Text>
                {this.icon && <Image source={this.icon} />}
              </View>
              <Text style={itemStyles.balance}>
                {i18n.t("wallet-coin-balance")}：
                {toFixedLocaleString(this.coin.balance, this.coin instanceof BTCCoin ? 8 : 4)}
              </Text>
            </View>
            <Switch onValueChange={this._onValueChange} value={this.coin.display} />
          </View>
        </View>
      </View>
    );
  }
  _onValueChange = async value => {
    this.coin.display = value;
    if (this.coin instanceof ERC20Coin) {
      this.props.hud.showLoading();
      try {
        let result = await network.get(
          "/setWalletToken",
          {
            walletAddress: AccountStore.defaultHDAccount.ETHWallet.address,
            tokenAddress: this.coin.contract,
            type: value ? 1 : 0,
          },
          HD_WEB_API
        );
        if (result.isSuccess) {
          await this.props.account.update();
          if (value) {
            await CoinStore.fetchPrice();
          }
          this.props.hud.dismiss();
        } else {
          this.props.hud.showFailed(i18n.t("common-tip-operation-failed"));
        }
      } catch (error) {
        // this.props.hud.dismiss()
        this.props.hud.showAlert(error.message || i18n.t("common-tip-operation-failed"));
        // errorHandler(error)
      }
    }

    await AccountStorage.update();
  };
}

const itemStyles = StyleSheet.create({
  highlight: {
    backgroundColor: "#FFFFFF",
  },
  wrap: {
    flex: 1,
    paddingTop: 18,
    paddingBottom: 19,
    flexDirection: "row",
    paddingHorizontal: 16,
    backgroundColor: "#FFFFFF",
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
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.backgroundColor,
  },
  header: {
    backgroundColor: "#FFFFFF",
  },
  searchBar: {
    backgroundColor: "#F1F2F7",
    borderTopColor: "#F1F2F7",
    borderBottomColor: "#F1F2F7",
    height: 45,
    paddingBottom: 8,
    paddingTop: 8,
  },
  searchBarInput: {
    fontSize: 12,
  },
  searchBarInputContainer: {
    height: 28,
    borderRadius: 14,
    backgroundColor: "#FFFFFF",
  },
  separatorWrap: {
    height: 1,
    backgroundColor: "#FFFFFF",
  },
  separator: {
    height: StyleSheet.hairlineWidth,
    marginLeft: 16,
    backgroundColor: theme.borderColor,
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
