import React, { Component } from "react";
import { StyleSheet, Image, TouchableHighlight, Animated } from "react-native";
import { Text, View } from "react-native";
import { observer } from "mobx-react";
import { padding } from "../../../util/UIAdapter";
//资产信息

import theme from "../../../util/Theme";
import { computed } from "mobx";
import { toFixedLocaleString } from "../../../util/NumberUtil";
import AccountStore from "../../../module/wallet/account/AccountStore";
import BigNumber from "bignumber.js";
import i18n from "../../../module/i18n/i18n";
import CoinStore from "../../../module/wallet/wallet/CoinStore";
import LinearGradient from "react-native-linear-gradient";
import { BIZ_SCOPE } from "../../../module/i18n/const";
@observer
class AssetsHeader extends Component {
  state = {
    hidden: false,
  };

  @computed get totalAsset() {
    return AccountStore.isHiddenPrice ? "*****" : toFixedLocaleString(this.props.account.totalAsset, 2, true);
  }

  @computed get floatingAsset() {
    if (AccountStore.isHiddenPrice) {
      return "*****";
    }

    let price = toFixedLocaleString(Math.abs(this.props.account.floatingAsset), 2, true);

    if (this.props.account.floatingAsset > 0) {
      price = `+${price}`;
    } else if (this.props.account.floatingAsset < 0) {
      price = `-${price}`;
    }
    return `${i18n.tt(BIZ_SCOPE.wallet, "hdindex-header-float")}  ${price} ${CoinStore.currency}`;
  }
  @computed get floatingAssetPercent() {
    if (AccountStore.isHiddenPrice) {
      return "";
    }
    if (this.props.account.totalAsset == 0) {
      return "+0.00 %";
    }

    const float = new BigNumber(this.props.account.floatingAsset + "");
    const yesterdayAsset = new BigNumber(this.props.account.totalAsset + "").minus(float + "");
    const percentNum = float
      .div(yesterdayAsset)
      .multipliedBy(100)
      .abs();
    const percent = toFixedLocaleString(percentNum, 2);

    if (this.isIncreased) {
      return `+${percent} %`;
    } else {
      return `-${percent} %`;
    }
  }
  @computed get isIncreased() {
    return this.props.account.floatingAsset >= 0;
  }
  @computed get coinbaseBTC() {
    if (AccountStore.isHiddenPrice) {
      return "*****";
    }
    const amount = toFixedLocaleString(new BigNumber(this.props.account.totalAsset).div(CoinStore.BTCPrice), 8);
    return `≈${amount} BTC`;
  }
  constructor(props) {
    super(props);
  }

  _onVisualButtonPress = () => {
    AccountStore.isHiddenPrice = !AccountStore.isHiddenPrice;
  };
  render() {
    return (
      <LinearGradient
        style={[styles.main, this.props.style]}
        colors={this.props.colors}
        start={{ x: 0, y: 1 }}
        end={{ x: 1, y: 0 }}>
        <View style={styles.titleWrap}>
          <Text style={[styles.title, { fontSize: 14 }]}>
            {i18n.t("wallet-hdindex-header-total")}({CoinStore.currency}){" "}
          </Text>
          <TouchableHighlight
            hitSlop={{ top: 10, bottom: 10, left: 20, right: 20 }}
            underlayColor="transparent"
            activeOpacity={0.6}
            onPress={this._onVisualButtonPress}>
            <Image
              tintColor={"#FFFFFF80"}
              source={
                AccountStore.isHiddenPrice
                  ? require("@img/wallet/asset_invisual.png")
                  : require("@img/wallet/asset_visual.png")
              }
              style={styles.showIcon}
            />
          </TouchableHighlight>
        </View>
        <Text style={styles.price}>{this.totalAsset}</Text>
        <Text style={[styles.title, { marginTop: 5 }]}>{this.coinbaseBTC}</Text>
        <View style={[styles.separator, { backgroundColor: this.props.separatorColor }]} />
        <View style={styles.row}>
          <Text style={styles.title}>{this.floatingAsset}</Text>
          <Text style={styles.title}>{this.floatingAssetPercent}</Text>
        </View>
      </LinearGradient>
    );
  }
}

const styles = StyleSheet.create({
  main: {
    flex: 1,
    backgroundColor: theme.brandColor,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 15,
    marginHorizontal: 16,
    marginTop: 21,
    borderRadius: 3,
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
    marginTop: 2,
  },
  title: {
    height: 20,
    fontSize: 12,
    color: "#C6C8CC",
  },
  price: {
    marginTop: 6,
    // height: 26,
    fontSize: 30,
    fontWeight: theme.fontWeight.semibold,
    fontFamily: theme.bigNumberFontFamily,
    color: "#FFFFFF",
  },
  percent: {
    color: "#7ED321",
  },
  row: {
    marginTop: 5,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  separator: {
    marginTop: 14,
    marginBottom: 14,
    height: StyleSheet.hairlineWidth,
    backgroundColor: "#858892",
  },
});

export default Animated.createAnimatedComponent(AssetsHeader);
