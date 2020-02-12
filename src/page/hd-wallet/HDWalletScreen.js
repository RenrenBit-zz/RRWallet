import React, { Component } from "react";
import { View, StyleSheet } from "react-native";
import Screen from "../Screen";
import HDWalletComponent from "./HDWalletComponent";
import { BIZ_SCOPE } from "../../module/i18n/const";
import i18n from "../../module/i18n/i18n";
import Header from "../../component/common/Header";
import { computed } from "mobx";
import { observer } from "mobx-react";
import msgCenter from "../../module/msg-center/MessageCenter";

@observer
export default class HDWalletScreen extends Screen {
  static get screenID() {
    return "HDWalletScreen";
  }
  static navigatorStyle = {
    ...Screen.navigatorStyle,
    statusBarTextColorSchemeSingleScreen: "dark",
  };
  @computed get rightButtons() {
    const msgIcon =
      msgCenter.totalCount > 0 ? require("@img/nav/msg-black-full.png") : require("@img/nav/msg-black-empty.png");
    return [
      {
        id: "msg_hd",
        icon: msgIcon,
      },
    ];
  }
  constructor(props) {
    super(props);
    this.props.navigator.addOnNavigatorEvent(this.onNavigatorEvent);
  }
  onNavigatorEvent = event => {
    if (event.type == "NavBarButtonPress") {
      if (event.id == "msg_hd") {
        this.onMsgPress();
      }
    }
  };
  onMsgPress = () => {
    this.props.navigator.push({
      screen: "MsgListScreen",
      title: i18n.t("common-message"),
      passProps: {
        msgTypeId: 1,
      },
    });
  };
  render() {
    const { navigator } = this.props;
    return (
      <View style={styles.main}>
        <Header
          title={i18n.tt(BIZ_SCOPE.common, "tab-hd")}
          titleColor={"#000000"}
          bottomBorder={true}
          rightButtons={this.rightButtons}
          navigator={this.navigator}
        />
        <HDWalletComponent navigator={navigator} />
      </View>
    );
  }
}

const styles = StyleSheet.create({
  main: {
    flex: 1,
  },
});
