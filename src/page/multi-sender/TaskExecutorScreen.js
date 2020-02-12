import React from "react";
import { StyleSheet, ScrollView, View, Dimensions, Text, TouchableWithoutFeedback } from "react-native";
import Screen from "../Screen";
import Theme from "../../util/Theme";

import ProgressHUD from "../../component/common/ProgressHUD";
import Footer from "../../component/common/Footer";
import { Button } from "react-native-elements";
import { computed, observable } from "mobx";
import { observer } from "mobx-react";
import PasswordModal from "./component/PasswordModal";
import TaskProgressModal from "./component/TaskProgressModal";
import { BigNumber } from "bignumber.js";
import RecipientsComponent from "./component/RecipientsComponent";
import i18n from "../../module/i18n/i18n";
import device from "../../util/device";
import theme from "../../util/Theme";
import GetStartedComponent from "./component/GetStartedComponent";
import AccountStore from "../../module/wallet/account/AccountStore";
import ProgressBarComponent from "./component/ProgressBarComponent";
import MultiSender from "../../module/multi-sender";

const { height } = Dimensions.get("window");
@observer
export default class TaskExecutorScreen extends Screen {
  static navigatorStyle = {
    ...Theme.navigatorStyle,
    tabBarHidden: true,
    statusBarTextColorSchemeSingleScreen: "light",
    navBarButtonColor: "#FFFFFF",
    navBarBackgroundColor: Theme.brandColor,
    navBarTextColor: "#FFFFFF",
  };

  static navigatorButtons = {
    leftButtons: Screen.navigatorButtons.leftButtons,
    rightButtons: [
      {
        id: "order_list",
        icon: require("@img/qunfabao/icon_list.png"),
        buttonColor: "#FFFFFF",
      },
    ],
  };

  @observable recipients = [];

  @computed get coin() {
    return AccountStore.defaultHDAccount.findCoin(this.props.coinID);
  }

  @computed get completedRecipients() {
    return this.recipients.filter(recipient => !!recipient.txhash);
  }

  @computed get selectedRecipients() {
    return this.recipients.filter(recipient => !!recipient.selected);
  }

  @computed get totalAmount() {
    return this.recipients.reduce((res, recipient) => res.plus(recipient.amount + ""), new BigNumber(0)).toString(10);
  }

  @computed get completedAmount() {
    return this.completedRecipients
      .reduce((res, recipient) => res.plus(recipient.amount + ""), new BigNumber(0))
      .toString(10);
  }

  @computed get selectedAmount() {
    return this.selectedRecipients
      .reduce((res, recipient) => res.plus(recipient.amount + ""), new BigNumber(0))
      .toString(10);
  }

  @observable showPasswrodModal = false;
  @observable showBatchProgress = false;
  @observable errorMessage = "";

  @computed get isConfirmDisable() {
    const isFinished = this.completedRecipients.length == this.recipients.length;
    if (isFinished) {
      return false;
    }
    return this.selectedRecipients.length == 0;
  }

  constructor(props) {
    super(props);

    this.props.navigator.addOnNavigatorEvent(this.onNavigatorEvent.bind(this));

    this.props.navigator.setTitle({
      title: this.coin.tokenName,
    });

    this.init();
  }

  init = async () => {
    if (this.props.recipientID) {
      const recipients = await MultiSender.getRecipients(this.props.recipientID, this.props.taskID);
      this.onTaskReady(recipients);
    }
  };

  onNavigatorEvent(event) {
    if (event.type == "NavBarButtonPress") {
      switch (event.id) {
        case "order_list":
          this.goOrderList();
          break;
      }
    }
  }

  goOrderList = () => {
    this.props.navigator.push({
      screen: "MultiSenderTaskListScreen",
      title: i18n.t("qunfabao-task-list"),
    });
  };
  goToDetail = () => {
    this.props.navigator.push({
      screen: "MultiSenderTaskDetailScreen",
      passProps: {
        taskUUID: this.props.taskID,
      },
    });
  };
  onTaskReady = recipients => {
    this.recipients = recipients.map(recipient => {
      return {
        ...recipient,
        selected: !recipient.txhash,
        txhash: recipient.txhash || "",
        amount: recipient.amount + "",
      };
    });
  };
  renderGetStartedComponent = () => {
    if (this.recipients.length > 0) {
      return null;
    }
    return (
      <GetStartedComponent navigator={this.props.navigator} taskID={this.props.taskID} onTaskReady={this.onTaskReady} />
    );
  };
  renderTaskExecutorComponent = () => {
    if (this.recipients.length <= 0) {
      return null;
    }

    const completedRecipients = this.selectedRecipients.filter(recipient => !!recipient.txhash);
    const recordCount = completedRecipients.length;
    const sendedAmount = completedRecipients
      .reduce((res, recipient) => res.plus(recipient.amount + ""), new BigNumber(0))
      .toString(10);
    return (
      <View>
        <View style={styles.progressWrap}>
          <TouchableWithoutFeedback onPress={this.goToDetail}>
            <View style={styles.innerWrap}>
              <Text style={styles.totalAmountDesc}>{i18n.t("qunfabao-ready-amount")}</Text>
              <Text style={styles.totalAmount}>{this.selectedAmount || 0}</Text>
              <ProgressBarComponent
                data={{
                  personCount: this.selectedRecipients.length,
                  recordCount,
                  sendedAmount,
                }}
                hideTitle={true}
              />
            </View>
          </TouchableWithoutFeedback>
        </View>
        {!!this.showPasswrodModal ? (
          <PasswordModal
            coin={this.coin}
            recipients={this.selectedRecipients}
            onCancel={this.onPasswordCancel}
            onConfirm={this.onPasswordConfirm}
          />
        ) : null}
        {!!this.showBatchProgress ? (
          <TaskProgressModal
            key={"batch"}
            completedRecipients={this.completedRecipients}
            recipients={this.selectedRecipients}
            errorMessage={this.errorMessage}
            onCancel={this.dismissProgressModal}
            onSuccess={this.dismissProgressModal}
            onError={this.dismissProgressModal}
          />
        ) : null}
        <RecipientsComponent data={this.recipients} />
      </View>
    );
  };

  render() {
    return (
      <View style={styles.container}>
        <ProgressHUD ref={ref => (this.hud = ref)} />
        <View style={styles.coverImage} />
        <ScrollView
          style={{ flex: 1 }}
          containerStyle={{ flex: 1 }}
          keyboardShouldPersistTaps="always"
          showsVerticalScrollIndicator={false}>
          <View style={{ backgroundColor: "#ffffff" }}>
            <View style={styles.availableBalanceWrap}>
              <Text style={styles.availableBalanceDesc}>{i18n.t("qunfabao-remain-balance")}</Text>
              <Text style={styles.availableBalance}>{this.coin.balance}</Text>
            </View>
            {this.renderGetStartedComponent()}
            {this.renderTaskExecutorComponent()}
          </View>
        </ScrollView>
        <Footer>{this.getFootBtn()}</Footer>
      </View>
    );
  }

  btnText = i18n.t("qunfabao-fabi-text-1");
  getFootBtn() {
    let color = Theme.linkColor;
    let text = this.getFootBtnText();
    if (text.indexOf(i18n.t("qunfabao-fabi-text-2")) > -1) {
      color = "#EB4E3D";
    }
    return (
      <Button
        title={text}
        containerStyle={[styles.nextButtonContainer]}
        buttonStyle={[
          styles.nextButton,
          {
            backgroundColor: color,
          },
        ]}
        titleStyle={{ fontWeight: "400" }}
        disabledStyle={{ backgroundColor: "#ccc" }}
        onPress={this.onConfirmPress}
        disabled={this.isConfirmDisable}></Button>
    );
  }

  getFootBtnText() {
    if (this.showBatchProgress) {
      return this.btnText;
    }

    let text = i18n.t("qunfabao-fabi-text-1");

    if (this.completedRecipients.length > 0) {
      if (this.completedRecipients.length == this.recipients.length) {
        text = i18n.t("qunfabao-fabi-text-3");
      } else {
        text = i18n.t("qunfabao-fabi-text-2");
      }
    } else {
      text += `(${this.selectedRecipients.length}${i18n.t("qunfabao-recipient-unit")})`;
    }
    this.btnText = text;
    return text;
  }

  onConfirmPress = () => {
    if (this.btnText == i18n.t("qunfabao-fabi-text-3")) {
      this.props.navigator.pop();
      return;
    }

    this.recipients.forEach(recipient => {
      if (recipient.selected && recipient.txhash && recipient.txhash.length > 0) {
        recipient.selected = false;
      }
    });

    if (new BigNumber(this.coin.balance + "").isLessThan(this.selectedAmount)) {
      this.showCommonError(i18n.t("qunfabao-in-wallet") + this.coin.name + i18n.t("qunfabao-amount-not-enough"));
    }

    this.showPasswrodModal = true;
  };
  onPasswordCancel = () => {
    this.showPasswrodModal = false;
  };
  dismissProgressModal = () => {
    this.showBatchProgress = false;
  };
  showCommonError(errorMessage) {
    this.errorMessage = errorMessage;
    this.showBatchProgress = true;
  }

  onPasswordConfirm = async ({ gasPrice, gasLimit, password }) => {
    this.showPasswrodModal = false;
    const recipients = this.selectedRecipients.map(({ address, amount }) => {
      return { address, amount };
    });
    try {
      let isDecimalsOverflow = false;
      this.selectedRecipients.forEach(recipient => {
        const split = ("" + recipient.amount).split(".");
        if (split[1] && split[1].length > this.coin.decimals) {
          isDecimalsOverflow = true;
        }
      });
      if (isDecimalsOverflow) {
        this.showCommonError(`${i18n.t("qunfabao-decimal-pre", { decimals: coin.decimals })}`);
        return;
      }
      this.showBatchProgress = true;
      await AccountStore.defaultHDAccount.ETHWallet.sendBatchTransaction(
        this.coin,
        recipients,
        gasPrice,
        gasLimit,
        password,
        data => {
          this.dealContractResult(data);
        }
      );
    } catch (error) {
      this.showCommonError(error.message || i18n.t("qunfabao-fabi-fail"));
    }
  };

  dealContractResult = async res => {
    const recipients = this.selectedRecipients.slice(res.from, res.from + res.length);
    recipients.forEach(recipient => {
      recipient.txhash = res.txHash;
      recipient.nonce = res.nonce;
    });
    try {
      await MultiSender.updateTask({ nonce: res.nonce, txHash: res.txhash }, recipients, this.props.taskID);
    } catch (error) {}
  };
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#fff",
    height: "100%",
  },
  availableBalanceWrap: {
    backgroundColor: theme.linkColor,
  },
  availableBalanceDesc: {
    color: "#FFFFFF",
    fontSize: 14,
    textAlign: "center",
    paddingTop: 10,
  },
  availableBalance: {
    color: "#FFFFFF",
    fontSize: 24,
    textAlign: "center",
    paddingTop: 12,
    paddingBottom: 20,
    fontWeight: "500",
    fontFamily: theme.alphanumericFontFamily,
  },
  coverImage: {
    position: "absolute",
    height: height / 2,
    backgroundColor: Theme.brandColor,
    width: "100%",
  },
  center: {
    justifyContent: "center",
    alignItems: "center",
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
    borderRadius: 4,
    backgroundColor: Theme.brandColor,
    elevation: 0,
  },
  supportWrap: {
    position: "absolute",
    left: 0,
    bottom: device.safeArea.bottom + 50,
    width: "100%",
    height: 34,
    alignItems: "center",
  },
  support: {
    color: theme.textColor.mainTitle,
    fontSize: 12,
  },
  supportName: {
    color: theme.brandColor,
  },
  progressWrap: {
    paddingVertical: 20,
    paddingHorizontal: 16,
    backgroundColor: Theme.backgroundColor,
  },
  innerWrap: {
    backgroundColor: "#fff",
    borderRadius: 3,
    paddingTop: 16,
    overflow: "hidden",
  },
  totalAmountDesc: {
    paddingHorizontal: 16,
  },
  totalAmount: {
    paddingHorizontal: 16,
    color: Theme.textColor.primary,
    fontSize: 30,
    fontWeight: "500",
  },
});
