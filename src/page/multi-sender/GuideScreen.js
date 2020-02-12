import React from "react";
import { StyleSheet, View, Text, Image } from "react-native";
import Screen from "../Screen";
import Theme from "../../util/Theme";
import Footer from "../../component/common/Footer";
import { Button } from "react-native-elements";
import ProgressHUD from "../../component/common/ProgressHUD";
import i18n from "../../module/i18n/i18n";
import theme from "../../util/Theme";
import AccountStore from "../../module/wallet/account/AccountStore";
import MultiSender from "../../module/multi-sender";

export default class GuideScreen extends Screen {
  static navigatorStyle = {
    ...Theme.navigatorStyle,
    statusBarTextColorSchemeSingleScreen: "light",
    navBarButtonColor: "#FFFFFF",
    navBarBackgroundColor: Theme.linkColor,
    navBarTextColor: "#FFFFFF",
  };

  static navigatorButtons = {
    rightButtons: [
      {
        id: "task_list",
        icon: require("@img/qunfabao/icon_list.png"),
        buttonColor: "#FFFFFF",
      },
    ],
  };
  constructor(props) {
    super(props);
    this.props.navigator.addOnNavigatorEvent(this.onNavigatorEvent.bind(this));
  }

  onNavigatorEvent(event) {
    switch (event.id) {
      case "task_list":
        this.goTaskList();
        break;
    }
  }

  onCreatePress = async () => {
    const ETHWallet = AccountStore.defaultHDAccount.ETHWallet;
    if (!ETHWallet.ETH || ETHWallet.ETH.balance <= 0) {
      this.hud.showFailed(i18n.t("qunfabao-eth-not-enough"));
      return;
    }
    if (this.props.coinID) {
      this.goToPreview();
    } else {
      this.props.navigator.push({
        screen: "MultiSenderSelectCoinScreen",
        title: i18n.t("qunfabao-token-select-title"),
      });
    }
  };

  goTaskList = () => {
    this.props.navigator.push({
      screen: "MultiSenderTaskListScreen",
      title: i18n.t("qunfabao-task-list"),
    });
  };

  goToPreview = async () => {
    this.hud && this.hud.showLoading();
    const coinID = this.props.coinID;
    try {
      let r = await MultiSender.createTask(coinID);
      this.hud && this.hud.dismiss();
      if (r && r.data && r.data.taskUUID) {
        let data = r.data;
        this.props.navigator.push({
          screen: "MultiSenderTaskExecutorScreen",
          passProps: {
            taskUUID: data.taskUUID,
            coinID: coinID,
          },
        });
      }
    } catch (error) {
      this.hud && this.hud.showFailed(i18n.t("qunfabao-task-create-error"));
    }
  };

  render() {
    return (
      <View style={styles.container}>
        <ProgressHUD ref={ref => (this.hud = ref)} />
        <View style={styles.wrap}>
          <Image source={require("@img/qunfabao/pc_preview.png")} />
          <Text style={styles.desc}>{i18n.t("qunfabao-guide-txt-3")}</Text>
          <Text style={styles.desc}>{i18n.t("qunfabao-guide-txt-6")}</Text>
          <Text style={styles.desc}>{i18n.t("qunfabao-guide-txt-7")}</Text>
        </View>
        <Text style={styles.support}>- {i18n.t("qunfabao-renrenbit-lab")} -</Text>
        <Footer>
          <Button
            title={i18n.t("qunfabao-create-task")}
            onPress={this.onCreatePress}
            containerStyle={styles.nextButtonContainer}
            buttonStyle={styles.nextButton}
          />
        </Footer>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
  },
  wrap: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  desc: {
    color: "#000",
    fontSize: 16,
    fontWeight: theme.fontWeight.semibold,
    paddingTop: 10,
  },
  support: {
    fontSize: 12,
    color: theme.textColor.mainTitle,
    marginBottom: 20,
  },
  bottomBorder: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: Theme.borderColor,
  },
  nextButtonContainer: {
    flex: 1,
  },
  nextButton: {
    width: "100%",
    height: 50,
    backgroundColor: Theme.linkColor,
    elevation: 0,
  },
});
