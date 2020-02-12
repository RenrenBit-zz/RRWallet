import React, { Component } from "react";
import { StyleSheet, Image, View, Text, TouchableWithoutFeedback, Dimensions, Switch } from "react-native";
import { Input, Button, Slider } from "react-native-elements";
import Theme from "../../../util/Theme";
import ProgressHUD from "../../../component/common/ProgressHUD";
import { padding } from "../../../util/UIAdapter";
import Wallet from "../../../module/wallet/wallet/Wallet";
import { BigNumber } from "bignumber.js";
import { observer } from "mobx-react";
import { computed, observable } from "mobx";
import { toFixedNumber, toFixedString } from "../../../util/NumberUtil";
import Ethereum from "../../../util/ethereum";
import Modal from "react-native-modal";
import AccountStore from "../../../module/wallet/account/AccountStore";
import i18n from "../../../module/i18n/i18n";
import recommendFee from "../../../module/wallet/wallet/Fees";
import { COIN_ID_ETH } from "../../../config/const";
import { ETH } from "../../../module/wallet/wallet/Coin";

const { height, width } = Dimensions.get("window");

@observer
export default class PasswordModal extends Component {
  @computed get coin() {
    return this.props.coin;
  }

  @computed get wallet() {
    return AccountStore.defaultHDAccount.ETHWallet;
  }

  @computed get recipients() {
    return this.props.recipients;
  }

  @computed get totalAmount() {
    return this.recipients.reduce((res, recipient) => res.plus(recipient.amount + ""), new BigNumber(0)).toString(10);
  }
  @observable password = "";

  @computed get gasPrice() {
    return recommendFee(COIN_ID_ETH).fast;
  }

  @computed get gasLimit() {
    return 210000;
  }

  @observable manually = false;
  @observable manuallyGasPrice = Math.ceil(this.gasPrice * this.initialSliderValue);
  @observable manuallyGasLimit = this.gasLimit;

  @observable sliderValue = this.initialSliderValue;

  get initialSliderValue() {
    const { avg, fast } = recommendFee(COIN_ID_ETH);
    const gap = fast - avg;
    return new BigNumber(gap / 2 + avg).div(fast).toNumber();
  }

  @computed get minimumSliderValue() {
    const { avg, fast } = recommendFee(COIN_ID_ETH);
    return new BigNumber(avg).div(fast).toNumber();
  }

  @computed get fee() {
    let amount = 0;
    if (this.manually) {
      amount = Ethereum.toEther(this.manuallyGasPrice * this.manuallyGasLimit, "gwei");
    } else {
      amount = Ethereum.toEther(this.gasPrice * this.gasLimit * this.sliderValue, "gwei");
    }
    return toFixedNumber(amount);
  }

  @computed get feePrice() {
    return toFixedNumber(this.fee * this.wallet.defaultCoin.price, 2);
  }

  @computed get totalFee() {
    return toFixedNumber(new BigNumber(this.fee).multipliedBy(this.recipients.length || 1));
  }

  @computed get errorMessage() {
    if (new BigNumber(this.wallet.defaultCoin.balance + "").minus(this.totalFee).isLessThan(0)) {
      return i18n.t("qunfabao-eth-not-enough");
    }

    if (
      this.coin instanceof ETH &&
      new BigNumber(this.wallet.defaultCoin.balance + "")
        .minus(this.totalFee)
        .minus(this.totalAmount)
        .isLessThan(0)
    ) {
      return i18n.t("qunfabao-eth-not-enough");
    }

    if (this.manually) {
      const avgFee = Ethereum.toEther(recommendFee(COIN_ID_ETH).avg * this.gasLimit, "gwei");
      if (new BigNumber("" + avgFee).isGreaterThan("" + this.fee)) {
        return i18n.t("qunfabao-not-enough-fee");
      }
    }
  }

  @computed get isConfirmDisable() {
    return !this.password || this.password.length < 8 || this.errorMessage;
  }
  getGasPrice() {
    return this.manually
      ? this.manuallyGasPrice
      : new BigNumber("" + this.gasPrice).multipliedBy("" + this.sliderValue).toFixed(2);
  }
  getGasLimit() {
    return this.manually ? this.manuallyGasLimit : this.gasLimit;
  }

  onPasswordChange(text) {
    this.password = text.trim();
  }

  onClosePress = () => {
    this.props.onCancel && this.props.onCancel();
  };

  onConfirmPress = () => {
    let password = this.password || "";
    let gasPrice = this.getGasPrice() + "";
    let gasLimit = this.getGasLimit() + "";
    let totalFee = this.totalFee;

    let param = {
      password,
      gasPrice,
      gasLimit,
      totalFee,
    };
    this.props.onConfirm && this.props.onConfirm(param);
  };

  render() {
    return (
      <Modal visible={true} style={styles.modal} avoidKeyboard={true}>
        <View style={styles.container}>
          <ProgressHUD ref={ref => (this.hud = ref)} />
          <View style={styles.wrap}>
            <View style={styles.titleWrap}>
              <View>
                <TouchableWithoutFeedback underlayColor="transparent" onPress={this.onClosePress}>
                  <View style={styles.closeBtn}>
                    <Image source={require("@img/qunfabao/icon_x.png")}></Image>
                  </View>
                </TouchableWithoutFeedback>
              </View>
              <Text style={styles.title}>{i18n.t("qunfabao-enter-password")}</Text>
              <View style={{ width: 56 }}></View>
            </View>

            <Text style={styles.totalText}>
              {this.totalAmount} {this.coin.name}
            </Text>
            <Text style={styles.feeText}>
              {i18n.t("qunfabao-total-fee")}: {this.totalFee} ETH
            </Text>
            <View
              style={{
                paddingHorizontal: 16,
                paddingTop: 12,
              }}>
              <Input
                onChangeText={this.onPasswordChange.bind(this)}
                multiline={false}
                placeholder={i18n.t("qunfabao-enter-password")}
                placeholderTextColor={"#ccc"}
                autoCapitalize="none"
                underlineColorAndroid="transparent"
                containerStyle={styles.containerStyle}
                inputContainerStyle={styles.inputContainerStyle}
                inputStyle={styles.inputStyle}
                secureTextEntry={true}></Input>
              {this.renderFeeComponent()}
              <View style={styles.foot}>
                {this.errorMessage && (
                  <Text style={{ fontSize: 14, paddingBottom: 10, color: "#EB4E3D", textAlign: "center" }}>
                    {this.errorMessage}
                  </Text>
                )}
                <Button
                  disabled={this.isConfirmDisable}
                  title={i18n.t("qunfabao-password-ok")}
                  containerStyle={styles.nextButtonContainer}
                  buttonStyle={styles.nextButton}
                  onPress={this.onConfirmPress}
                />
              </View>
            </View>
          </View>
        </View>
      </Modal>
    );
  }

  renderFeeComponent = () => {
    return (
      <View style={styles.card}>
        {this.renderGasComponent()}
        {this.wallet.type == Wallet.WALLET_TYPE_ETH && (
          <View style={styles.switchContainer}>
            <Text
              style={[
                styles.speedText,
                {
                  color: Theme.linkColor,
                },
              ]}>
              {i18n.t("qunfabao-high-select")}
            </Text>
            <Switch
              value={this.manually}
              onValueChange={value => (this.manually = value)}
              style={styles.switch}></Switch>
          </View>
        )}
      </View>
    );
  };
  renderGasComponent() {
    if (this.manually) {
      return (
        <View>
          <View style={styles.textContainer}>
            <Input
              underlineColorAndroid="transparent"
              value={this.manuallyGasPrice + ""}
              placeholder={i18n.t("qunfabao-custom-gas-price")}
              placeholderTextColor="#ccc"
              onChangeText={text => (this.manuallyGasPrice = text)}
              autoCapitalize="none"
              clearButtonMode="while-editing"
              keyboardType="decimal-pad"
              containerStyle={styles.containerStyle}
              inputContainerStyle={styles.inputContainerStyle}
              inputStyle={styles.inputStyle}
              returnKeyType="done"
              rightIcon={<Text style={styles.patchText}>gwei</Text>}
            />
          </View>
          <View style={styles.textContainer}>
            <Input
              underlineColorAndroid="transparent"
              value={this.manuallyGasLimit + ""}
              placeholder={i18n.t("qunfabao-custom-gas")}
              placeholderTextColor="#ccc"
              onChangeText={text => (this.manuallyGasLimit = text)}
              onFocus={() => this.setState({ showFee: true })}
              onEndEditing={() => this.setState({ showFee: false })}
              autoCapitalize="none"
              clearButtonMode="while-editing"
              keyboardType="decimal-pad"
              containerStyle={styles.containerStyle}
              inputContainerStyle={styles.inputContainerStyle}
              inputStyle={styles.inputStyle}
              returnKeyType="done"
            />
          </View>
        </View>
      );
    } else {
      return [
        <Slider
          key="Slider"
          minimumTrackTintColor={Theme.linkColor}
          thumbTintColor="#FFFFFF"
          thumbStyle={{
            borderColor: "#B6B6B6",
            borderWidth: StyleSheet.hairlineWidth,
            width: 24,
            height: 24,
            borderRadius: 24,
            // shadowRadius: 0,
            shadowOpacity: 0.5,
            shadowColor: "#B6B6B6",
            shadowOffset: {
              h: 2,
              w: 0,
            },
          }}
          step={0.02}
          minimumValue={this.minimumSliderValue}
          onValueChange={sliderValue => (this.sliderValue = sliderValue)}
          trackStyle={{ height: 2, backgroundColor: "#B6B6B6" }}
          value={this.sliderValue}></Slider>,
        <View key="status" style={styles.row}>
          <Text style={styles.speedText}>{i18n.t("qunfabao-custom-slow")}</Text>
          <Text style={styles.speedText}>{i18n.t("qunfabao-custom-fast")}</Text>
        </View>,
      ];
    }
  }
}

const styles = StyleSheet.create({
  modal: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.4)",
    margin: 0,
  },
  container: {
    // position: 'absolute',
    // width: '100%',
    // height: height,
    // zIndex: 1,
    // top: 0,
  },

  wrap: {
    marginHorizontal: padding(width < 340 ? 20 : 36),
    backgroundColor: "#fff",
    borderRadius: 12,
    overflow: "hidden",
    shadowRadius: 10,
    shadowOpacity: 0.5,
    shadowColor: "#27347D",
    shadowOffset: {
      h: 2,
      w: 0,
    },
  },
  titleWrap: {
    borderColor: Theme.borderColor,
    borderBottomWidth: StyleSheet.hairlineWidth,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  closeBtn: {
    width: 56,
    height: 56,
    justifyContent: "center",
    alignItems: "center",
  },
  title: {
    fontSize: 18,
    color: Theme.textColor.primary,
    textAlign: "center",
    // paddingTop: 12,
    // paddingBottom: 12,
    height: 56,
    lineHeight: 56,
    flex: 1,
    fontWeight: "600",
  },
  totalText: {
    color: Theme.textColor.primary,
    fontSize: 24,
    textAlign: "center",
    paddingTop: 20,
    fontWeight: "600",
  },
  feeText: {
    color: Theme.textColor.mainTitle,
    fontSize: 14,
    textAlign: "center",
    paddingTop: 8,
  },
  containerStyle: {
    overflow: "hidden",
    width: "100%",
    marginBottom: 16,
  },
  inputContainerStyle: {
    borderColor: Theme.borderColor,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 3,
    height: 49,
    backgroundColor: Theme.backgroundColor,
  },
  inputStyle: {
    // height: 230,
    fontSize: 14,
    height: 50,
    paddingHorizontal: 0,
    borderWidth: 0,
  },

  foot: {
    paddingBottom: padding(30),
    paddingTop: padding(20),
  },
  nextButtonContainer: {},
  nextButton: {
    height: 45,
    width: "100%",
    borderRadius: 6,
    backgroundColor: Theme.linkColor,
    elevation: 0,
  },

  card: {
    // marginTop: 10,
    // padding: padding(16),
    backgroundColor: "#FFFFFF",
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    // flex: 1,
  },
  desc: {
    color: "#212C68",
    opacity: 0.74,
    textAlignVertical: "center",
    fontSize: 14,
  },
  fee: {
    color: Theme.linkColor,
    fontSize: 14,
  },
  speedText: {
    color: Theme.textColor.primary,
    fontSize: 14,
  },
  switchContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    marginTop: padding(20),
  },
  gasInput: {
    flex: 1,
    color: Theme.textColor.mainTitle,
    fontSize: 14,
    height: 50,
    includeFontPadding: true,
    textAlignVertical: "center",
    paddingVertical: 0,
  },
  textContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderColor: "transparent",
    // borderBottomColor: Theme.borderColor,
    // borderWidth: StyleSheet.hairlineWidth,
  },
  switch: {
    marginLeft: 12,
  },
  patchText: {
    color: "#ccc",
    fontSize: 14,
    paddingRight: 16,
  },
});
