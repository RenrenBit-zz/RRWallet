import {
  View,
  StyleSheet,
  Text,
  TextInput,
  DeviceEventEmitter,
  Dimensions,
  Platform,
  Keyboard,
  ScrollView,
} from "react-native";
import Screen from "../Screen";
import Footer from "../../component/common/Footer";
import { Button } from "react-native-elements";
import React, { PureComponent, Component } from "react";
import theme from "../../util/Theme";
import Header from "../../component/common/Header";
import Modal from "react-native-modal";
import * as Animatable from "react-native-animatable";
import { BigNumber } from "bignumber.js";
import Dialog from "../../component/common/Dialog";
import ProgressHUD from "../../component/common/ProgressHUD";
import { toFixedString } from "../../util/NumberUtil";
import Wallet from "../../module/wallet/wallet/Wallet";
import { ERC20Coin, ETC } from "../../module/wallet/wallet/Coin";
import errorHandler from "../../util/ErrorHandler";
import device from "../../util/device";
import DeviceInfo from "react-native-device-info";
import {
  WALLET_TYPE_BCH,
  COIN_ID_BCH,
  COIN_ID_BTC,
  COIN_ID_USDT,
  COIN_ID_BSV,
  WALLET_TYPE_BSV,
  HDACCOUNT_FPPAYMENT_ERROR_FALLBACK,
  HDACCOUNT_FPPAYMENT_ERROR_CANCEL,
} from "../../config/const";
import i18n from "../../module/i18n/i18n";
import MultiSigWallet from "../../module/wallet/wallet/MultiSigWallet";
import { observer } from "mobx-react";
import { observable, computed } from "mobx";
import HDAccount from "../../module/wallet/account/HDAccount";
import { BIZ_SCOPE } from "../../module/i18n/const";

let height = device.windowSize.height + Platform.select({ ios: 0, android: 150 });

@observer
export default class TransferConfirmScreen extends Component {
  static get screenID() {
    return "TransferConfirmScreen";
  }
  static navigatorButtons = {
    leftButtons: [
      {
        id: "cancelLogin",
        icon: require("@img/nav/nav_close.png"),
      },
    ],
  };
  @computed get account() {
    return this.props.tx.account;
  }
  get wallet() {
    return this.props.wallet;
  }
  get to() {
    return this.props.tx.to;
  }
  get amount() {
    return this.props.tx.amount;
  }
  get fee() {
    return this.props.tx.fee;
  }
  get coin() {
    return this.props.tx.coin;
  }
  get gasLimit() {
    return this.props.tx.gasLimit;
  }
  get gasPrice() {
    return this.props.tx.txPriority;
  }
  get feePerByte() {
    return this.props.tx.txPriority;
  }
  get note() {
    return this.props.tx.note;
  }

  @computed get showNote() {
    return this.note.length > 0;
  }
  state = {
    visible: false,
    pwd: "",
  };
  static getDerivedStateFromProps(nextProps, prevState) {
    return {
      visible: nextProps.visible,
    };
  }
  constructor(props) {
    super(props);
    this.props.navigator.addOnNavigatorEvent(this.onNavigatorEvent.bind(this));
  }
  onNavigatorEvent(event) {
    if (event.type == "NavBarButtonPress") {
      if (event.id == "cancelLogin") {
        this.onCloseButtonPress();
      }
    }
  }

  handleViewRef = ref => (this.view = ref);

  show = () => {
    this.view.transitionTo(
      {
        transform: [
          {
            translateY: 0,
          },
        ],
      },
      300,
      "ease-out"
    );
    setTimeout(() => {
      this.textinput && this.textinput.focus();
    }, 250);
  };
  dismiss = () => {
    Keyboard.dismiss();
    this.view.transitionTo(
      {
        transform: [
          {
            translateY: height,
          },
        ],
      },
      300,
      "ease-in"
    );
    setTimeout(() => {
      this.setState({
        pwd: "",
      });
    }, 150);
  };
  render() {
    return (
      <Animatable.View ref={this.handleViewRef} style={styles.modal} useNativeDriver>
        <ScrollView style={styles.main} keyboardDismissMode={"interactive"} bounces={false}>
          <Header
            leftButtons={TransferConfirmScreen.navigatorButtons.leftButtons}
            title={i18n.tt(BIZ_SCOPE.wallet, "send-confirm-title")}
            titleColor="#000000"
            navigator={this.props.navigator}
            style={styles.header}
          />
          <View style={styles.card}>
            <Section title={i18n.tt(BIZ_SCOPE.wallet, "tx-to")} detail={this.to} />
            <Section title={i18n.tt(BIZ_SCOPE.wallet, "tx-amount")} detail={`${this.amount} ${this.coin.name}`} />
            <Section title={i18n.tt(BIZ_SCOPE.wallet, "tx-fee")} detail={this.fee} />
            {this.showNote && <Section title={i18n.tt(BIZ_SCOPE.wallet, "tx-note")} detail={this.note} />}
          </View>
          <Text style={styles.pwd}>{i18n.tt(BIZ_SCOPE.wallet, "send-password-title")}</Text>
          <TextInput
            style={styles.input}
            placeholder={i18n.tt(BIZ_SCOPE.wallet, "send-password-placeholder")}
            onChangeText={this.onChangeText}
            value={this.state.pwd}
            secureTextEntry={true}
            ref={ref => (this.textInput = ref)}
          />
        </ScrollView>
        <Footer>
          <Button
            containerStyle={styles.buttonContainer}
            buttonStyle={styles.button}
            title={i18n.tt(BIZ_SCOPE.wallet, "send-confirm-send")}
            onPress={this.onButtonPress}
          />
        </Footer>
        <ProgressHUD ref={ref => (this.hud = ref)} />
      </Animatable.View>
    );
  }
  onChangeText = text => {
    this.setState({
      pwd: text,
    });
  };
  onCloseButtonPress = () => {
    this.dismiss();
  };
  onButtonPress = async () => {
    Keyboard.dismiss();
    let pwd = this.state.pwd;
    try {
      const vaild = await this.wallet.isVaildPassword(pwd);
      if (!vaild) {
        Dialog.alert("错误", "密码错误");
        return;
      }
      this.hud && this.hud.showLoading();

      let isSafe = true;
      try {
        isSafe = await this.wallet.checkMaliciousAddress(this.to);
      } catch (error) {}

      if (isSafe) {
        this.transfer(pwd);
      } else {
        setTimeout(() => {
          Dialog.alert("警告", "经检测,目标地址为高危地址,存在安全风险,请确认是否继续转账?", [
            { text: "确认", onPress: () => this.transfer(pwd) },
            { text: "取消", onPress: () => this.hud && this.hud.dismiss(), style: "cancel" },
          ]);
        }, 500);
      }
    } catch (error) {
      this.hud && this.hud.dismiss();
      Dialog.alert("错误", error.message ? error.message : "密码错误");
    }
  };
  transfer = pwd => {
    if (
      this.coin.id == COIN_ID_BTC ||
      this.coin.id == COIN_ID_USDT ||
      this.coin.id == COIN_ID_BCH ||
      this.coin.id == COIN_ID_BSV
    ) {
      this.transferBTC(pwd);
      return;
    }
    this.transferETH(pwd);
  };
  transferETH(pwd) {
    let gasPrice = new BigNumber(this.gasPrice).toFixed(2);
    let gasLimit = this.gasLimit + "";

    var success = () => {
      this.hud && this.hud.showSuccess(i18n.t("wallet-send-broadcast-hd"));
      setTimeout(() => {
        this.props.onSuccess && this.props.onSuccess();
      }, 500);
    };

    var fail = error => {
      setTimeout(() => {
        this.hud && this.hud.dismiss();
        setTimeout(() => {
          errorHandler(error);
        }, 250);
      }, 750);
    };

    if (!this.coin) {
      Dialog.alert("错误, 该币种不存在, 请联系客服处理");
      return;
    }

    if (this.coin instanceof ERC20Coin) {
      if (this.coin.contract && this.coin.contract.length) {
        this.wallet
          .sendERC20Transaction(this.to, this.coin.contract, this.amount, gasPrice, gasLimit, this.note, pwd)
          .then(success)
          .catch(fail);
        return;
      } else {
        Dialog.alert("错误", "合约地址为空, 请联系客服处理");
      }
    } else if (this.coin instanceof ETC) {
      this.wallet
        .sendETCTransaction(this.to, this.amount, gasPrice, gasLimit, this.note, pwd)
        .then(success)
        .catch(fail);
    } else {
      this.wallet
        .sendTransaction(this.to, this.amount, gasPrice, gasLimit, this.note, pwd)
        .then(success)
        .catch(fail);
    }
  }
  transferBTC(pwd) {
    let fee = toFixedString(this.feePerByte);

    if (this.coin.id === COIN_ID_USDT) {
      this.wallet
        .sendUSDTTransaction(this.to, this.amount, fee, pwd, this.note)
        .then(async txHash => {
          this.hud &&
            this.hud.showSuccess(
              this.wallet instanceof MultiSigWallet
                ? i18n.t("wallet-send-broadcast-multisig")
                : i18n.t("wallet-send-broadcast-hd")
            );
          setTimeout(() => {
            this.props.onSuccess && this.props.onSuccess();
          }, 500);
        })
        .catch(error => {
          setTimeout(() => {
            this.hud && this.hud.dismiss();
          }, 750);
          setTimeout(() => {
            errorHandler(error);
          }, 1000);
        });
    }
    if (this.coin.id === COIN_ID_BTC || this.coin.id === COIN_ID_BCH || this.coin.id === COIN_ID_BSV) {
      this.wallet
        .sendRawTransaction(this.to, this.amount, fee, pwd, this.note)
        .then(async txHash => {
          this.hud &&
            this.hud.showSuccess(
              this.wallet instanceof MultiSigWallet
                ? i18n.t("wallet-send-broadcast-multisig")
                : i18n.t("wallet-send-broadcast-hd")
            );
          setTimeout(() => {
            this.props.onSuccess && this.props.onSuccess();
          }, 500);
        })
        .catch(error => {
          setTimeout(() => {
            this.hud && this.hud.dismiss();
          }, 750);
          setTimeout(() => {
            errorHandler(error);
          }, 1000);
        });
    }
  }
}

const styles = StyleSheet.create({
  modal: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    top: 0,
    transform: [
      {
        translateY: height,
      },
    ],
  },
  main: {
    flex: 1,
    backgroundColor: theme.backgroundColor,
  },
  header: {
    backgroundColor: "#FFFFFF",
  },
  card: {
    marginTop: 12,
    paddingBottom: 16,
    paddingHorizontal: 16,
    backgroundColor: "#FFFFFF",
  },
  pwd: {
    color: theme.textColor.mainTitle,
    fontSize: 12,
    marginVertical: 12,
    marginLeft: 16,
  },
  input: {
    height: 49,
    backgroundColor: "#FFFFFF",
    paddingLeft: 16,
    fontSize: 14,
  },
  buttonContainer: {
    flex: 1,
  },
  button: {
    height: 50,
    borderRadius: 0,
    backgroundColor: theme.linkColor,
    elevation: 0,
  },
});

class Section extends PureComponent {
  render() {
    const { children, title, detail } = this.props;
    return (
      <View style={sStyles.main}>
        <Text style={sStyles.title}>{title}</Text>
        {!!children ? children : <Text style={sStyles.detail}>{detail}</Text>}
      </View>
    );
  }
}

const sStyles = StyleSheet.create({
  main: {},
  title: {
    marginTop: 17,
    fontSize: 12,
    color: theme.textColor.mainTitle,
  },
  detail: {
    marginTop: 6,
    fontSize: 12,
    color: theme.textColor.primary,
  },
});
