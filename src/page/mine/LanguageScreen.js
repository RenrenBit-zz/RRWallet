import React, { Component } from "react";
import { StyleSheet, View, Text, Image, TouchableHighlight } from "react-native";
import Screen from "../Screen";
import { observable } from "mobx";
import { observer } from "mobx-react";
import i18n from "../../module/i18n/i18n";
import theme from "../../util/Theme";
import { BIZ_SCOPE } from "../../module/i18n/const";
import { relaunch } from "../../module/launch/launch";

@observer
class LanauageScreen extends Screen {
  static get screenID() {
    return "LanauageScreen";
  }
  @observable data = [
    { id: "zh", title: i18n.tt(BIZ_SCOPE.mine, "language-zh"), selected: i18n.locale.split("-")[0] === "zh" },
    { id: "en", title: i18n.tt(BIZ_SCOPE.mine, "language-en"), selected: i18n.locale.split("-")[0] === "en" },
  ];
  onCellPress = id => {
    if (i18n.locale.split("-")[0] === id) {
      return;
    }
    i18n.locale = id;
    relaunch();
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

export default LanauageScreen;
