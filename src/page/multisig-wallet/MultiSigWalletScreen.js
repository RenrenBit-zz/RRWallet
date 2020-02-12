import React, { Component } from "react";
import { View, StyleSheet } from "react-native";
import Screen from "../Screen";
import MultiSigWalletComponent from "./MultiSigWalletComponent";
import Header from "../../component/common/Header";
import i18n from "../../module/i18n/i18n";
import { BIZ_SCOPE } from "../../module/i18n/const";
import { computed } from "mobx";
import msgCenter from "../../module/msg-center/MessageCenter";
import { observer } from "mobx-react";

@observer
export default class MultiSigWalletScreen extends Screen {
  static get screenID() {
    return "MultiSigWalletScreen";
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
        id: "msg_multisig",
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
      if (event.id == "msg_multisig") {
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
  jumpToHD = () => {
    this.props.navigator.switchToTab({
      tabIndex: 0,
    });
  };
  render() {
    const { navigator } = this.props;
    return (
      <View style={styles.main}>
        <Header
          title={i18n.tt(BIZ_SCOPE.common, "tab-multisig")}
          titleColor={"#000000"}
          bottomBorder={true}
          rightButtons={this.rightButtons}
          navigator={this.props.navigator}
        />
        <MultiSigWalletComponent navigator={navigator} jumpTo={this.jumpToHD} />
      </View>
    );
  }
}

const styles = StyleSheet.create({
  main: {
    flex: 1,
  },
});
