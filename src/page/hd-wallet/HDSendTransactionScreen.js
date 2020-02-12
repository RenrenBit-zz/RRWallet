import React, { Component } from "react";
import { Image, Platform, TouchableWithoutFeedback } from "react-native";
import {
  StyleSheet,
  View,
  ScrollView,
  Text,
  TextInput,
  Modal,
  TouchableHighlight,
  DeviceEventEmitter,
  Alert,
  Switch,
} from "react-native";
import Wallet from "../../module/wallet/wallet/Wallet";
import ethereum from "../../util/ethereum";
import Screen from "../Screen";
import theme from "../../util/Theme";
import { padding } from "../../util/UIAdapter";
import Footer from "../../component/common/Footer";
import { toFixedNumber, toFixedString, toFixedLocaleString } from "../../util/NumberUtil";
import { observer, Observer } from "mobx-react";
import { computed, observable, action, reaction } from "mobx";
import { BigNumber } from "bignumber.js";
import PropTypes, { instanceOf } from "prop-types";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import errorHandler, { ERROR_DOMAIN_BTC, ERROR_DOMAIN_ETH } from "../../util/ErrorHandler";
import Dialog from "../../component/common/Dialog";
import ProgressHUD from "../../component/common/ProgressHUD";
import { ERC20Coin, ETH, USDT, BTCCoin, ETC, BCH, BSV } from "../../module/wallet/wallet/Coin";
import { isString } from "lodash";
import AccountStore from "../../module/wallet/account/AccountStore";
import {
  HDACCOUNT_FIND_WALELT_TYPE_COINID,
  WALLET_TYPE_BTC,
  WALLET_TYPE_ETH,
  WALLET_TYPE_ETC,
  WALLET_TYPE_BCH,
  WALLET_TYPE_BSV,
  COIN_ID_BTC,
  COIN_ID_USDT,
  COIN_ID_BCH,
  COIN_ID_BSV,
} from "../../config/const";
import i18n from "../../module/i18n/i18n";
import TransferConfirmScreen from "./TransferConfrimScreen";
import Header from "../../component/common/Header";
import CoinStore from "../../module/wallet/wallet/CoinStore";
import HDAccount from "../../module/wallet/account/HDAccount";
import MultiSigAccount from "../../module/wallet/account/MultiSigAccount";
import recommendFee from "../../module/wallet/wallet/Fees";
import MultiSigWallet from "../../module/wallet/wallet/MultiSigWallet";
import MessageBox from "@CC/MessageBox";
import Button from "../../component/common/Button";
import GrowingTextInput from "../../component/common/GrowingTextInput";
import SelectCoinScreen from "./SelectCoinScreen";
import ETCWallet from "../../module/wallet/wallet/ETCWallet";
import BSVWallet from "../../module/wallet/wallet/BSVWallet";
import { BTCMultiSigCoin, USDTMultiSigCoin } from "../../module/wallet/wallet/btc/BTCMultiSigWallet";

@observer
class TransferAssetsScreen extends Screen {
  static get screenID() {
    return "TransferAssetsScreen";
  }
  static propTypes = {
    onTransferSuccess: PropTypes.func,
    onCoinChanged: PropTypes.func,
  };
  static defaultProps = {
    onTransferSuccess: () => {},
    onCoinChanged: () => {},
  };
  static navigatorStyle = {
    ...Screen.navigatorStyle,
    navBarHidden: true,
  };

  static navigatorButtons = {
    leftButtons: Screen.navigatorButtons.leftButtons,
    rightButtons: [],
  };

  @observable selectedCoinID = this.props.coinID;

  @computed get account() {
    return AccountStore.match(this.props.accountID);
  }

  /**
   *
   * @type {Wallet}
   * @memberof TransferAssetsScreen
   */
  @computed get wallet() {
    if (this.account instanceof HDAccount) {
      return this.account.findWallet(this.coin.id, HDACCOUNT_FIND_WALELT_TYPE_COINID);
    } else if (this.account instanceof MultiSigAccount) {
      return this.account.findWallet(this.props.walletID);
    }
  }
  @computed get coin() {
    if (this.account instanceof HDAccount) {
      return this.account.findCoin(this.selectedCoinID) || this.account.coins[0];
    } else if (this.account instanceof MultiSigAccount) {
      return this.wallet.findCoin(this.selectedCoinID);
    }
  }
  @computed get available() {
    if (this.coin instanceof BTCMultiSigCoin || this.coin instanceof USDTMultiSigCoin) {
      return this.coin.available;
    }
    return this.coin.balance;
  }
  @observable modalVisible = false;

  @observable address = this.props.address || "";
  @observable amount = "";
  @observable note = "";
  @observable showHand = false;

  /**
   * 推荐的手续费档位
   *
   * BTC/USDT中单位为 sat/B
   * ETH中单位为 gwei
   *
   * @readonly
   * @memberof TransferAssetsScreen
   */
  @computed get txPriority() {
    if (this.manually) {
      return this.manuallyTxPriority;
    }
    const fee = recommendFee(this.coin.id);
    switch (this.priority) {
      case 0:
        return fee.low;
      case 1:
        return fee.avg;
      case 2:
        return fee.fast;
    }
  }
  @observable priority = 1;
  //Fee
  gasLimit = this.coin instanceof ETH || this.coin instanceof ETC ? 21000 : 150000;

  @observable manually = false;
  @observable manuallyTxPriority = recommendFee(this.coin.id).avg;
  @observable manuallyGasLimit = this.coin instanceof ETH || this.coin instanceof ETC ? 21000 : 150000;

  @computed get fee() {
    let amount;
    if (
      this.coin.id == COIN_ID_BTC ||
      this.coin.id == COIN_ID_USDT ||
      this.coin.id == COIN_ID_BCH ||
      this.coin.id == COIN_ID_BSV
    ) {
      amount = this.wallet.estimateFee({
        amount: this.amount,
        feePerByte: this.txPriority,
        showHand: this.showHand,
        coin: this.coin,
      });
    } else {
      amount = ethereum.toEther(this.txPriority * (this.manually ? this.manuallyGasLimit : this.gasLimit), "gwei");
    }

    return toFixedNumber(amount);
  }

  @computed get feeText() {
    if (new BigNumber(this.fee).isLessThanOrEqualTo(0)) {
      return `- ${this.wallet.defaultCoin.name}`;
    }
    return `${this.fee} ${this.wallet.defaultCoin.name} ≈${CoinStore.currencySymbol}${this.feePrice}`;
  }
  @computed get feePrice() {
    let price = this.wallet.defaultCoin.price;
    return toFixedNumber(this.fee * price, 2);
  }
  @computed get tx() {
    const fee = this.feeText;
    return {
      to: this.address,
      amount: this.amount,
      fee,
      gasLimit: this.manually ? this.manuallyGasLimit : this.gasLimit,
      txPriority: this.txPriority,
      note: this.note,
      coin: this.coin,
      account: this.account,
      wallet: this.wallet,
    };
  }
  @computed get price() {
    const price = new BigNumber(this.coin.price).multipliedBy(this.amount);
    return `≈${toFixedLocaleString(price.isNaN() ? "0" : price, 2, true)} ${CoinStore.currency}`;
  }
  handleAddressRef = ref => (this.addressInput = ref);
  handleAmountRef = ref => (this.amountInput = ref);
  handleConfirmRef = ref => (this.confirm = ref);
  handleSelectorRef = ref => (this.selector = ref);
  handleMsgBoxRef = ref => (this.msgbox = ref);
  constructor(props) {
    super(props);
    this.props.navigator.addOnNavigatorEvent(this.onNavigatorEvent.bind(this));
    this.observerCoinID();
  }
  componentWillUnmount() {
    this.unreaction && this.unreaction();
  }
  onNavigatorEvent(event) {
    if (event.type == "NavBarButtonPress") {
      // this is the event type for button presses
      if (event.id == "scan_qrcode") {
        // this is the same id field from the static navigatorButtons definition
        //   AlertIOS.alert('NavBar', 'Edit button pressed');
        this.onScanCodePress();
      } else if (event.id == "contact") {
        this.onContactPress();
      } else if (event.id == "_sbackButton") {
        if (this.props.isFromRoot) {
          this.props.navigator.popToRoot();
        }
      }
    }
  }
  observerCoinID = () => {
    this.unreaction = reaction(
      () => this.selectedCoinID,
      coinID => {
        if (this.account instanceof HDAccount) {
          this.account.stashedTransferCoinID = coinID;
          this.account.stashedWalletID = this.wallet.id;
        }
      },
      {
        fireImmediately: true,
      }
    );
  };
  onScanCodePress = () => {
    this.props.navigator.push({
      title: i18n.t("wallet-title-scan"), //'选择联系人',
      screen: "ScanQRCodeScreen", //'ContactList',
      passProps: {
        coinType: this.props.coinType,
        onBarCodeRead: this.onScanQRCode,
      },
    });
  };
  @action onScanQRCode = ({ data }) => {
    const { address, amount } = this.wallet.decodePaymentScheme(data);
    if (address) {
      this.address = address;
      this.amount = `${amount >= 0 ? amount : this.amount}`;
    } else {
      this.address = data;
    }
    this.navigator.pop();
    setTimeout(() => {
      if (this.amount === "") {
        this.amountInput && this.amountInput.focus();
      }
    }, 700);
  };
  @action onSelectedCoin = coin => {
    if (this.selectedCoinID !== coin.id) {
      this.selectedCoinID = coin.id;
      this.address = "";
      this.amount = "";
      setTimeout(() => {
        this.props.onCoinChanged && this.props.onCoinChanged(this.coin);
      }, 300);
    }
    this.selector.dismiss();
  };
  onSelectorDismiss = () => {
    this.selector.dismiss();
  };
  @action onContactPress = () => {
    this.props.navigator.push({
      screen: "ContactScreen",
      title: i18n.t("wallet-title-contact"),
      passProps: {
        onSelectedContact: this.onSelectedContact,
      },
    });
  };
  @action onAddressChange = text => {
    if (text.length - this.address.length > 10 && this.amount === "") {
      this.amountInput && this.amountInput.focus();
    }
    this.address = text;
  };
  onAddressBlur = () => {
    if (this.amount !== "") {
      return;
    }
    this.amountInput && this.amountInput.focus();
  };
  @action onAmountChange = text => {
    this.amount = text;
    this.showHand = false;
  };
  @action onMaxPress = async () => {
    let balance = "";

    if (this.coin instanceof BTCCoin && !new BigNumber(this.wallet.USDT.balance).isZero()) {
      this.msgbox.showConfirm({
        content: i18n.t("wallet-send-reamin-usdt"),
        onOk: async () => {
          this.hud && this.hud.showLoading();
          balance = await this.wallet.calculateMaximumAmount(this.txPriority);
          this.hud && this.hud.dismiss();
          this.amount = toFixedString(balance, this.coin.decimals);
          this.showHand = true;
        },
      });
      return;
    }

    if (this.coin instanceof ERC20Coin || this.coin instanceof USDT) {
      balance = this.available;
    } else if (this.coin instanceof ETH || this.coin instanceof ETC) {
      balance = new BigNumber(this.available).minus(this.fee + "");
      if (balance < 0) {
        balance = "";
      }
    } else if (this.coin instanceof BTCCoin || this.coin instanceof BCH || this.coin instanceof BSV) {
      this.hud && this.hud.showLoading();
      balance = await this.wallet.calculateMaximumAmount(this.txPriority);
      this.hud && this.hud.dismiss();
    }
    this.amount = toFixedString(balance, this.coin.decimals);
    this.showHand = true;
  };
  onTitlePress = () => {
    this.selector.show();
  };
  @action onSelectedContact = contact => {
    if (contact.address) {
      this.address = contact.address;
    }
  };
  @action onFeeCheckboxPress = priority => {
    this.priority = priority;
    this.showHand = false;
  };
  @action onConfirmModalDismiss = () => {
    this.modalVisible = false;
  };
  onTransferSuccess = () => {
    if (!this.props.onTransferSuccess || !this.props.onTransferSuccess()) {
      if (this.wallet instanceof MultiSigWallet) {
        this.navigator.popToRoot();
        return;
      }
      this.navigator.pop();
    }
  };
  render() {
    return (
      <View style={{ flex: 1 }}>
        <Header
          leftButtons={TransferAssetsScreen.navigatorButtons.leftButtons}
          rightButtons={TransferAssetsScreen.navigatorButtons.rightButtons}
          renderTitleComponent={this.renderTitleComponent}
          navigator={this.navigator}
          style={styles.header}
        />
        <KeyboardAwareScrollView
          keyboardShouldPersistTaps="always"
          enableOnAndroid={true}
          key="scrollview"
          style={styles.main}
          keyboardDismissMode={Platform.select({ ios: "on-drag", android: "none" })}
          showsVerticalScrollIndicator={false}
          extraScrollHeight={Platform.select({ ios: 0, android: 50 })}>
          <View style={[styles.row, { height: 38 }]}>
            <Text style={styles.balance}>
              {i18n.t("wallet-send-balance")}：
              {toFixedString(this.available, this.coin instanceof BTCCoin || this.coin instanceof ETH ? 8 : 4, true)}{" "}
              {this.coin.name}
            </Text>
          </View>
          <View style={[styles.card, { marginTop: 0 }]}>
            <View style={[styles.row, styles.border]}>
              <Text style={styles.title}>{i18n.t("wallet-send-address")}</Text>
              <Button
                icon={require("@img/mine/contact.png")}
                iconStyle={[styles.icon, { marginRight: 16 }]}
                onPress={this.onContactPress}
              />
              <Button icon={require("@img/nav/nav_scan.png")} iconStyle={styles.icon} onPress={this.onScanCodePress} />
            </View>
            <View style={styles.inputWrap}>
              <GrowingTextInput
                ref={this.handleAddressRef}
                placeholder={i18n.t("wallet-send-address-placeholder")}
                autoCapitalize="none"
                underlineColorAndroid="transparent"
                onChangeText={this.onAddressChange}
                value={this.address}
                placeholderTextColor={theme.textColor.placeHolder}
                style={styles.input}
                returnKeyType="done"
                blurOnSubmit={true}
                onBlur={this.onAddressBlur}
                autoCorrect={false}
              />
            </View>
          </View>
          <View style={styles.card}>
            <View style={[styles.row, styles.border]}>
              <Text style={styles.title}>{i18n.t("wallet-send-amount")}</Text>
              <Button title={i18n.t("wallet-send-max")} titleStyle={styles.cloudText} onPress={this.onMaxPress} />
            </View>
            <View style={styles.inputWrap}>
              <GrowingTextInput
                ref={this.handleAmountRef}
                onChangeText={this.onAmountChange}
                underlineColorAndroid="transparent"
                keyboardType="decimal-pad"
                placeholder={i18n.t("wallet-send-amount-placeholder")}
                placeholderTextColor={theme.textColor.placeHolder}
                value={this.amount}
                style={styles.input}
                returnKeyType="done"
                blurOnSubmit={true}
              />
              <Text style={styles.price}>{this.price}</Text>
            </View>
          </View>

          <View style={styles.card}>
            <View style={[styles.row, styles.border]}>
              <Text style={styles.title}>{i18n.t("wallet-send-note")}</Text>
            </View>
            <View style={styles.inputWrap}>
              <GrowingTextInput
                underlineColorAndroid="transparent"
                onChangeText={text => (this.note = text)}
                style={styles.input}
                placeholder={i18n.t("wallet-send-note-placeholder")}
                placeholderTextColor={theme.textColor.placeHolder}
                returnKeyType="done"
                blurOnSubmit={true}
              />
            </View>
          </View>
          {this.renderFeeComponent()}
          <ProgressHUD position="absoluteFill" ref={ref => (this.hud = ref)} />
          <MessageBox ref={this.handleMsgBoxRef} />
        </KeyboardAwareScrollView>
        <Footer>
          <Button
            style={styles.button}
            containerStyle={styles.buttonContainer}
            titleStyle={styles.buttonTitle}
            title={i18n.t("common-confirm")}
            onPress={this.nextButtonOnPress}
          />
        </Footer>
        <TransferConfirmScreen
          ref={this.handleConfirmRef}
          visible={this.modalVisible}
          onDismiss={this.onConfirmModalDismiss}
          onSuccess={this.onTransferSuccess}
          navigator={this.navigator}
          tx={this.tx}
          wallet={this.wallet}
        />
        <SelectCoinScreen
          ref={this.handleSelectorRef}
          visible={this.modalVisible}
          onDismiss={this.onSelectorDismiss}
          onSelected={this.onSelectedCoin}
          account={this.account}
          walletID={this.wallet.id}
          coinID={this.coin.id}
          navigator={this.navigator}
        />
      </View>
    );
  }
  renderTitleComponent = () => (
    <Observer>{() => <Title coin={this.coin} onPress={this.onTitlePress} account={this.account} />}</Observer>
  );
  renderFeeComponent = () => {
    return (
      <View style={[styles.card, { marginTop: 10 }]}>
        <View style={styles.row}>
          <Text style={styles.title}>{i18n.t("wallet-send-fee")}</Text>
          <Text style={styles.fee}>{this.feeText}</Text>
        </View>
        {this.renderGasComponent()}
        {this.wallet.type == Wallet.WALLET_TYPE_ETH && (
          <View style={styles.switchContainer}>
            <Text style={styles.speedText}>{i18n.t("wallet-send-advance")}</Text>
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
            <TextInput
              underlineColorAndroid="transparent"
              value={this.manuallyTxPriority + ""}
              placeholder={i18n.t("wallet-send-advance-gasprice")}
              placeholderTextColor="#999999"
              onChangeText={text => (this.manuallyTxPriority = text)}
              autoCapitalize="none"
              clearButtonMode="while-editing"
              keyboardType="decimal-pad"
              style={[styles.gasInput, { flex: 2 }]}
              returnKeyType="done"></TextInput>
            <Text style={{ color: theme.textColor.patchTitle }}>gwei</Text>
          </View>
          <View style={styles.textContainer}>
            <TextInput
              underlineColorAndroid="transparent"
              value={this.manuallyGasLimit + ""}
              placeholder={i18n.t("wallet-send-advance-gas")}
              placeholderTextColor="#999999"
              onChangeText={text => (this.manuallyGasLimit = text)}
              autoCapitalize="none"
              clearButtonMode="while-editing"
              keyboardType="decimal-pad"
              style={[styles.gasInput, { flex: 2 }]}
              returnKeyType="done"></TextInput>
          </View>
        </View>
      );
    } else {
      let lowDesc, avgDesc, fastDesc;
      if (
        this.coin instanceof BTCCoin ||
        this.coin instanceof USDT ||
        this.coin instanceof BCH ||
        this.coin instanceof BSV
      ) {
        lowDesc = i18n.t("wallet-send-fee-time", { time: "60" });
        avgDesc = i18n.t("wallet-send-fee-time", { time: "30" });
        fastDesc = i18n.t("wallet-send-fee-time", { time: "15" });
      } else {
        lowDesc = i18n.t("wallet-send-fee-time", { time: "30" });
        avgDesc = i18n.t("wallet-send-fee-time", { time: "5" });
        fastDesc = i18n.t("wallet-send-fee-time", { time: "2" });
      }
      return [
        <FeeCheckBox
          checked={this.priority == 0}
          title={i18n.t("wallet-send-fee-slow")}
          desc={lowDesc}
          onPress={this.onFeeCheckboxPress}
          key={0}
          priority={0}
        />,
        <FeeCheckBox
          checked={this.priority == 1}
          title={i18n.t("wallet-send-fee-medium")}
          desc={avgDesc}
          onPress={this.onFeeCheckboxPress}
          key={1}
          priority={1}
        />,
        <FeeCheckBox
          checked={this.priority == 2}
          title={i18n.t("wallet-send-fee-fast")}
          desc={fastDesc}
          onPress={this.onFeeCheckboxPress}
          key={2}
          priority={2}
        />,
      ];
    }
  }
  nextButtonOnPress = () => {
    this.address = this.address && this.address.trim();
    this.amount = this.amount && this.amount.trim();
    if (!this.validation()) {
      return;
    }
    this.checkSimilarTx();
  };
  checkSimilarTx = () => {
    const stx = this.wallet.txStore.similarTx(this.address, this.coin.id, this.amount);
    if (stx) {
      Dialog.alert("提示", "链上有相同的交易还在确认中, 是否继续转账?", [
        {
          text: "继续",
          onPress: () => {
            this.checkUnconfirmedAmount();
          },
        },
        { text: "取消", onPress: () => {} },
      ]);
      return;
    }
    this.checkUnconfirmedAmount();
  };
  checkUnconfirmedAmount = () => {
    const unconfirmedAmount = this.wallet.txStore.unconfirmedAmount(this.coin.id);
    const vaildBalance = new BigNumber(this.available + "").plus(unconfirmedAmount).minus(this.amount + "");

    if (vaildBalance.isNegative()) {
      Dialog.alert("提示", "将未确认的交易金额计算在内后可用余额不足, 继续转账有可能会失败, 是否继续转账?", [
        {
          text: "继续",
          onPress: () => {
            this.modalVisible = true;
            this.confirm.show();
          },
        },
        { text: "取消", onPress: () => {} },
      ]);
      return;
    }

    this.modalVisible = true;
    this.confirm.show();
  };

  contactButtonOnPress() {
    this.props.navigator.push({
      screen: "ContactScreen",
      title: "联系人",
      passProps: {
        isFromSelect: 1,
      },
    });
  }

  validation = () => {
    let vaild = this.isVaildCommon();
    if (!vaild) {
      return false;
    }

    if (this.coin instanceof ERC20Coin) {
      vaild = this.isVaildERC20();
    } else if (this.coin instanceof ETH) {
      vaild = this.isVaildETH();
    } else if (this.coin instanceof USDT) {
      vaild = this.isVaildUSDT();
    } else if (this.coin instanceof BTCCoin) {
      vaild = this.isVaildBTC();
    }

    return vaild;
  };
  isVaildCommon = () => {
    if (!this.isNumber(this.amount)) {
      Dialog.alert("提示", "转账数量不合法, 必须为大于等于0的数字");
      return false;
    }

    const bignumer = new BigNumber(this.amount);
    const split = bignumer.toFixed().split(".");
    if (split.length == 2 && split[1].length > this.coin.decimals) {
      Dialog.alert(
        "提示",
        `${this.coin.name}的精度为${this.coin.decimals}位, 所以转账金额的小数位数不能大于${this.coin.decimals}`
      );
      return false;
    }

    if (this.coin instanceof USDT && new BigNumber(this.fee).isLessThanOrEqualTo(0)) {
      Dialog.alert("提示", "矿工费不足，请先往USDT收款地址转入BTC");
      return false;
    }
    if (
      new BigNumber(this.available + "").isLessThan(new BigNumber(this.amount)) ||
      new BigNumber(this.fee).isLessThanOrEqualTo(0)
    ) {
      Dialog.alert("提示", "余额不足");
      return false;
    }

    if (this.wallet.address === this.address) {
      Dialog.alert("提示", "付款地址与收款地址不能相同");
      return false;
    }

    if (this.note.length > 50) {
      Dialog.alert("提示", "备注需小于50个字");
      return false;
    }

    return true;
  };

  isVaildETH = () => {
    if (!this.isVaildETHAddress()) {
      return false;
    }

    if (!this.isVaildFormatGas()) {
      return false;
    }

    if (new BigNumber(this.amount).plus(this.fee).isGreaterThan(this.wallet.ETH.balance + "")) {
      Dialog.alert("提示", "转账数量 + 矿工费 > 可用余额");
      return false;
    }

    return true;
  };

  isVaildERC20 = () => {
    if (!this.isVaildETHAddress()) {
      return false;
    }

    if (!this.isVaildFormatGas()) {
      return false;
    }

    if (new BigNumber(this.fee).isGreaterThan(this.wallet.ETH.balance + "")) {
      Dialog.alert("提示", "矿工费 > 可用ETH余额");
      return false;
    }

    return true;
  };

  isVaildBTC = () => {
    if (!this.isVaildBTCAddress()) {
      return false;
    }

    if (!!this.wallet.addressesMap[this.address]) {
      Dialog.alert("提示", "不能转给自己");
      return false;
    }

    if (new BigNumber(this.amount).isLessThan(0.000001)) {
      Dialog.alert("提示", "为防止粉尘攻击, BTC转账数量不能小于0.000001BTC(100satoshi)");
      return false;
    }

    return true;
  };

  isVaildUSDT = () => {
    if (!this.isVaildBTCAddress()) {
      return false;
    }

    if (!!this.wallet.addressesMap[this.address]) {
      Dialog.alert("提示", "不能转给自己");
      return false;
    }

    return true;
  };

  isNumber = num => {
    if (!isString(num)) {
      num = num + "";
    }
    return /^[+]{0,1}(\d+)$|^[+]{0,1}(\d+\.\d+)$/.test(num);
  };

  isVaildETHAddress() {
    if (this.address.length != 42) {
      Dialog.alert("提示", "地址一般为0x开头的42位英文数字");
      return false;
    }
    return true;
  }

  isVaildBTCAddress() {
    if (this.address.length > 36 || this.address.length < 26) {
      Dialog.alert("提示", "BTC地址一般为26到36位");
      return false;
    }
    return true;
  }

  isVaildFormatGas = () => {
    if (this.manually) {
      let gasPrice = new Number(this.manuallyTxPriority);
      if (isNaN(gasPrice) || gasPrice <= 0) {
        Dialog.alert("提示", "Gas Price不合法, 必须为大于0的数字");
        return false;
      }

      let gasLimit = new Number(this.manuallyGasLimit);
      if (isNaN(gasLimit) || gasLimit <= 0) {
        Dialog.alert("提示", "Gas不合法, 必须为大于0的数字");
        return false;
      }
    }
    return true;
  };
}

const styles = StyleSheet.create({
  main: {
    flex: 1,
    backgroundColor: theme.backgroundColor,
  },
  header: {
    backgroundColor: "#FFFFFF",
  },
  card: {
    marginTop: 12,
    backgroundColor: "#FFFFFF",
  },

  row: {
    height: 48,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginHorizontal: 16,
    flex: 1,
  },
  border: {
    borderColor: "transparent",
    borderBottomColor: theme.borderColor,
    borderWidth: StyleSheet.hairlineWidth,
  },
  icon: {
    tintColor: "#000000",
  },
  coinName: {
    color: theme.textColor.mainTitle,
    fontSize: 14,
    fontWeight: "400",
  },
  balance: {
    color: theme.textColor.mainTitle,
    fontSize: 12,
  },
  price: {
    color: theme.textColor.mainTitle,
    fontSize: 12,
    maxWidth: "40%",
    position: "relative",
    top: 4,
  },
  noteRow: {
    // justifyContent: 'flex-start'
  },
  title: {
    flex: 1,
    color: theme.textColor.primary,
    textAlignVertical: "center",
    fontWeight: theme.fontWeight.medium,
    fontSize: 14,
  },
  note: {
    fontSize: 16,
    color: theme.textColor.primary,
    includeFontPadding: true,
    textAlignVertical: "center",
    paddingVertical: 0,
    flex: 1,
  },
  fee: {
    color: theme.textColor.primary,
    fontSize: 14,
  },
  speedText: {
    color: theme.linkColor,
    fontSize: 14,
  },
  switchContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    marginVertical: padding(16),
    marginRight: padding(16),
  },
  gasInput: {
    flex: 1,
    color: theme.textColor.primary,
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
    borderBottomColor: theme.borderColor,
    borderWidth: StyleSheet.hairlineWidth,
    marginLeft: 16,
    paddingRight: 16,
  },
  switch: {
    marginLeft: 12,
    ...Platform.select({
      ios: {
        transform: [{ scaleX: 0.9 }, { scaleY: 0.9 }],
      },
    }),
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
  buttonTitle: {
    fontSize: 18,
    color: "#FFFFFF",
  },
  input: {
    fontSize: 14,
    lineHeight: 16,
    color: theme.textColor.primary,
    includeFontPadding: true,
    textAlignVertical: "center",
    paddingVertical: 0,
    flex: 1,
    position: "relative",
    top: -1,
  },
  inputWrap: {
    flexDirection: "row",
    paddingTop: 12,
    paddingBottom: 15,
    marginHorizontal: 16,
  },
  maxButtonWrap: {
    justifyContent: "center",
  },
  cloudText: {
    color: theme.linkColor,
    fontSize: 14,
  },
});

@observer
class FeeCheckBox extends Component {
  @computed get icon() {
    return this.props.checked ? require("@img/wallet/round_check_fill.png") : require("@img/wallet/round_check.png");
  }
  onPress = () => {
    const { onPress, priority } = this.props;
    onPress(priority);
  };
  render() {
    const { title, desc, fee } = this.props;
    return (
      <TouchableWithoutFeedback onPress={this.onPress}>
        <View style={gcbStyles.main}>
          <Image source={this.icon} />
          <View style={gcbStyles.row}>
            <View style={gcbStyles.column}>
              <Text style={gcbStyles.title}>{title}</Text>
              <Text style={gcbStyles.desc}>{desc}</Text>
            </View>
            <Text style={gcbStyles.title}>{fee}</Text>
          </View>
        </View>
      </TouchableWithoutFeedback>
    );
  }
}

const gcbStyles = StyleSheet.create({
  main: {
    flex: 1,
    height: 67,
    backgroundColor: "#FFFFFF",
    flexDirection: "row",
    alignItems: "center",
    paddingLeft: 16,
  },
  row: {
    flex: 1,
    marginLeft: 12,
    flexDirection: "row",
    alignItems: "center",
    borderBottomColor: theme.borderColor,
    borderBottomWidth: StyleSheet.hairlineWidth,
    paddingRight: 16,
  },
  column: {
    flex: 1,
    paddingVertical: 15,
  },
  title: {
    color: theme.textColor.primary,
    fontSize: 14,
  },
  desc: {
    color: theme.textColor.mainTitle,
    fontSize: 12,
    marginTop: 7,
  },
});

@observer
class Title extends Component {
  @computed get coin() {
    return this.props.coin;
  }

  @computed get text() {
    return i18n.t("wallet-title-send", { coin: this.coin.name });
  }
  @computed get enabled() {
    return this.props.account instanceof HDAccount;
  }
  onPress = () => {
    this.props.onPress && this.props.onPress();
  };
  render = () => {
    return (
      <TouchableHighlight
        underlayColor={"transparent"}
        activeOpacity={0.7}
        onPress={this.enabled ? this.onPress : null}>
        <View style={tStyles.main}>
          <Text style={tStyles.text}>{this.text}</Text>
          {this.enabled && (
            <Image style={tStyles.icon} tintColor={"#000000"} source={require("@img/icon/arrow_down.png")} />
          )}
        </View>
      </TouchableHighlight>
    );
  };
}

const tStyles = StyleSheet.create({
  main: {
    flexDirection: "row",
    alignItems: "center",
  },
  text: {
    fontSize: 18,
    fontWeight: theme.fontWeight.medium,
  },
  icon: {
    marginLeft: 6,
    tintColor: "#000000",
  },
});
export default TransferAssetsScreen;
