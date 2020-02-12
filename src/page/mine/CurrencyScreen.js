import React, { Component } from "react";
import { StyleSheet, View, Text, Image, TouchableHighlight } from "react-native";
import Screen from "../Screen";
import { observable } from "mobx";
import { observer } from "mobx-react";
import i18n from "../../module/i18n/i18n";
import theme from "../../util/Theme";
import { CURRENCY_TYPE_CNY, CURRENCY_TYPE_USD } from "../../config/const";
import CoinStore from "../../module/wallet/wallet/CoinStore";

@observer
class CurrencyScreen extends Screen {
  static get screenID() {
    return "CurrencyScreen";
  }
  @observable data = [
    { id: CURRENCY_TYPE_CNY, title: i18n.t("mine-currency-rmb"), selected: CoinStore.currency === CURRENCY_TYPE_CNY },
    { id: CURRENCY_TYPE_USD, title: i18n.t("mine-currency-usd"), selected: CoinStore.currency === CURRENCY_TYPE_USD },
  ];
  onCellPress = id => {
    CoinStore.currency = id;
    this.data.forEach(item => {
      item.selected = item.id == id;
    });
    setTimeout(() => {
      this.navigator.pop();
    }, 250);
  };
  render() {
    return (
      <View style={styles.main}>
        {this.data.map((item, index) => (
          <View>
            <TouchableHighlight onPress={this.onCellPress.bind(this, item.id)}>
              <View style={styles.content}>
                <Text style={styles.title}>{item.title}</Text>
                {item.selected && <Image source={require("@img/mine/mine_currency_selected.png")} />}
              </View>
            </TouchableHighlight>
            <View style={styles.separator} />
          </View>
        ))}
      </View>
    );
  }
}

const styles = StyleSheet.create({
  main: {
    marginTop: 12,
  },
  content: {
    flexDirection: "row",
    height: 48,
    alignItems: "center",
    paddingHorizontal: 16,
    backgroundColor: "#FFFFFF",
  },
  title: {
    flex: 1,
    fontSize: 14,
    color: theme.textColor.primary,
  },
  separator: {
    marginLeft: 16,
    backgroundColor: theme.borderColor,
    height: StyleSheet.hairlineWidth,
  },
});

export default CurrencyScreen;
