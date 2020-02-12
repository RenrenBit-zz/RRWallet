import React, { Component } from "react";
import { StyleSheet, View, SectionList, TouchableHighlight, Text, Image } from "react-native";
import Screen from "../Screen";
import i18n from "../../module/i18n/i18n";
import theme from "../../util/Theme";
import { observer, Observer } from "mobx-react";
import { observable, computed, action } from "mobx";
import HDAccount from "../../module/wallet/account/HDAccount";
import BTCWallet from "../../module/wallet/wallet/BTCWallet";
import AccountStore from "../../module/wallet/account/AccountStore";
import { HDACCOUNT_FIND_WALELT_TYPE_COINID, BTC_ADDRESS_TYPE_PKH } from "../../config/const";
import ProgressHUD from "../../component/common/ProgressHUD";
import MultiSigAccount from "../../module/wallet/account/MultiSigAccount";
import { addressType } from "../../module/wallet/wallet/util/serialize";

@observer
class MyAddressesScreen extends Screen {
  static get screenID() {
    return "MyAddressesScreen";
  }
  static navigatorButtons = {
    leftButtons: [...Screen.navigatorButtons.leftButtons],
    rightButtons: [
      {
        id: "scan",
        title: i18n.t("wallet-address-scan"),
        buttonColor: theme.linkColor,
      },
    ],
  };

  /**
   *
   * @type {HDAccount}
   * @memberof MyAddressesScreen
   */
  account = AccountStore.match(this.props.accountID);

  coinID = this.props.coinID;
  /**
   *
   * @type {BTCWallet}
   * @readonly
   * @memberof MyAddressesScreen
   */
  @computed get wallet() {
    if (this.account instanceof HDAccount) {
      return this.account.findWallet(this.coinID, HDACCOUNT_FIND_WALELT_TYPE_COINID);
    } else if (this.account instanceof MultiSigAccount) {
      return this.account.findWallet(this.props.walletID);
    }
  }

  @computed get coin() {
    return this.account.findCoin(this.coinID);
  }

  @computed get sections() {
    const scripts = [];
    const normals = [];

    this.wallet.addresses.forEach(address => {
      const item = {
        address: address,
        selected: address.address === this.wallet.currentAddress.address,
      };
      const type = addressType(address.address);
      if (type === BTC_ADDRESS_TYPE_PKH) {
        normals.push(item);
      } else {
        scripts.push(item);
      }
    });
    if (this.account instanceof MultiSigAccount) {
      return [
        {
          title: i18n.t("wallet-address-normal"),
          data: scripts,
        },
      ];
    }
    return [
      {
        title: i18n.t("wallet-address-script"),
        data: scripts,
      },
      {
        title: i18n.t("wallet-address-normal"),
        data: normals,
      },
    ];
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
    switch (event.id) {
      case "scan":
        this._onScanPress();
    }
  };

  _onScanPress = async () => {
    this.hud && this.hud.showLoading();
    try {
      await this.wallet.syncAddress();
      await this.account.update();
    } catch (error) {}
    this.hud && this.hud.dismiss();
  };

  @action _onCellPress = item => {
    if (this.wallet.currentAddress != item.address) {
      setTimeout(() => {
        this.navigator.pop();
      }, 150);
    }
    this.wallet.setCurrentAddress(item.address);
  };
  _listHeaderComponent = () => <Text style={styles.desc}>◎{i18n.t("wallet-address-desc")}</Text>;
  _renderSectionHeader = ({ section: { title } }) => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
    </View>
  );
  _renderItem = ({ item, index, section }) => (
    <Observer>{() => <Cell onPress={this._onCellPress} item={item} />}</Observer>
  );
  _itemSeparatorComponent = () => <View style={styles.separator} />;
  _renderSectionFooter = ({ leadingItem, trailingItem }) => (
    <View style={!!leadingItem && !trailingItem ? styles.sectionSeparator : styles.separator} />
  );
  _keyExtractor = ({ address }) => address.address;
  render() {
    return (
      <View style={styles.main}>
        <SectionList
          sections={this.sectionsSlice}
          ListHeaderComponent={this._listHeaderComponent}
          renderSectionHeader={this._renderSectionHeader}
          renderItem={this._renderItem}
          ItemSeparatorComponent={this._itemSeparatorComponent}
          SectionSeparatorComponent={this._renderSectionFooter}
          keyExtractor={this._keyExtractor}
        />
        <ProgressHUD ref={ref => (this.hud = ref)} />
      </View>
    );
  }
}

const styles = StyleSheet.create({
  main: {
    flex: 1,
  },
  desc: {
    fontSize: 12,
    color: theme.textColor.mainTitle,
    marginVertical: 12,
    marginLeft: 16,
  },
  section: {
    height: 56,
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
  },
  sectionTitle: {
    fontSize: 14,
    marginLeft: 16,
    color: theme.textColor.primary,
  },
  sectionSeparator: {
    height: 14,
  },
  separator: {
    marginLeft: 16,
    backgroundColor: theme.borderColor,
    height: StyleSheet.hairlineWidth,
  },
});

@observer
class Cell extends Component {
  onPress = () => {
    const { onPress, item } = this.props;
    onPress && onPress(item);
  };
  render() {
    const { item } = this.props;
    return (
      <TouchableHighlight onPress={this.onPress}>
        <View style={cstyles.content}>
          <Text style={cstyles.address}>{item.address.address}</Text>
          {item.selected && <Image source={require("@img/mine/mine_currency_selected.png")} />}
        </View>
      </TouchableHighlight>
    );
  }
}

const cstyles = StyleSheet.create({
  content: {
    flexDirection: "row",
    height: 48,
    alignItems: "center",
    paddingHorizontal: 16,
    backgroundColor: "#FFFFFF",
  },
  address: {
    flex: 1,
    fontSize: 14,
    color: theme.textColor.primary,
  },
});
export default MyAddressesScreen;
