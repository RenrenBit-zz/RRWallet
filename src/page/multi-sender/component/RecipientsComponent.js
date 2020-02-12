import React, { Component } from "react";
import { StyleSheet, View, Text, Image, TouchableWithoutFeedback, Dimensions } from "react-native";
import Theme from "../../../util/Theme";
import i18n from "../../../module/i18n/i18n";
import { observer } from "mobx-react";
import { computed } from "mobx";
import BigNumber from "bignumber.js";

const { height, width } = Dimensions.get("window");

@observer
export default class RecipientsComponent extends Component {
  constructor(props) {
    super(props);
  }

  @computed get data() {
    return this.props.data;
  }

  @computed get totalAmount() {
    return this.data.reduce((res, recipient) => res.plus(recipient.amount + ""), new BigNumber(0)).toString(10);
  }

  toggleSelect(item, index) {
    if (!item.txhash) {
      item.selected = !item.selected;
    }
  }

  getIcon(item) {
    if (item.txhash && item.txhash.length > 0) {
      return <Image source={require("@img/qunfabao/icon_green.png")} />;
    } else if (item.selected && !item.txhash) {
      return <Image source={require("@img/qunfabao/icon_radio_s.png")} />;
    } else {
      return <Image source={require("@img/qunfabao/icon_radio.png")} />;
    }
  }

  percent = item => {
    return new BigNumber(item.amount + "")
      .div(this.totalAmount)
      .multipliedBy(100)
      .toFixed(5);
  };
  render() {
    return (
      <View style={styles.listContainer}>
        <View style={styles.titleWrap}>
          <Text style={styles.title}>{i18n.t("qunfabao-recipient-reciver-address")}</Text>
        </View>
        {this.data.map((item, index) => (
          <View style={styles.itemContainer} key={index}>
            <TouchableWithoutFeedback
              underlayColor={Theme.highlightColor}
              onPress={this.toggleSelect.bind(this, item, index)}>
              <View style={styles.itemWrap}>
                <View style={styles.radioWrap}>{this.getIcon(item)}</View>
                <View style={styles.innerWrap}>
                  <View style={styles.leftWrap}>
                    <Text style={styles.name}>{item.name}</Text>
                    <Text style={styles.address} numberOfLines={1} ellipsizeMode="middle">
                      {item.address}
                    </Text>
                  </View>
                  <View style={styles.rightWrap}>
                    <Text style={styles.amount}>{item.amount}</Text>
                    <Text style={styles.percent}>
                      {i18n.t("qunfabao-recipient-percent")} {this.percent(item)}%
                    </Text>
                  </View>
                </View>
              </View>
            </TouchableWithoutFeedback>
          </View>
        ))}
      </View>
    );
  }
}

const styles = StyleSheet.create({
  listContainer: {
    backgroundColor: "#fff",
    minHeight: height - 400,
  },
  titleWrap: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: Theme.borderColor,
  },
  title: {
    fontSize: 16,
    color: Theme.textColor.primary,
    padding: 16,
    fontWeight: "600",
  },
  itemContainer: {
    paddingLeft: 16,
  },
  itemWrap: {
    flexDirection: "row",
    paddingVertical: 16,
    alignItems: "center",
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: Theme.borderColor,
  },
  radioWrap: {
    paddingRight: 12,
  },
  radio: {},
  innerWrap: {
    flexDirection: "row",
    flex: 1,
    paddingRight: 16,
  },
  leftWrap: {},
  rightWrap: {
    flex: 1,
  },
  name: {
    color: Theme.textColor.primary,
    fontSize: 14,
  },
  address: {
    color: Theme.linkColor,
    fontSize: 12,
    paddingTop: 6,
    width: 120,
  },
  amount: {
    color: Theme.textColor.primary,
    fontSize: 14,
    textAlign: "right",
    fontFamily: Theme.alphanumericFontFamily,
  },
  percent: {
    color: Theme.textColor.mainTitle,
    fontSize: 12,
    textAlign: "right",
    paddingTop: 6,
  },
});
