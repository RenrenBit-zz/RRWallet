import React from "react";
import { StyleSheet, View, Alert, TextInput } from "react-native";
import Theme from "../../util/Theme";

import Contact from "../../module/contact";
import ActionSheetCell from "../../component/common/ActionSheetCell";
import BTCWallet from "../../module/wallet/wallet/BTCWallet";
import ETHWallet from "../../module/wallet/wallet/ETHWallet";
import { SCHEMA_BTC, SCHEMA_ETH } from "../../config/const";
import Screen from "../Screen";
import i18n from "../../module/i18n/i18n";
import Footer from "../../component/common/Footer";
import Button from "../../component/common/Button";
import { BIZ_SCOPE } from "../../module/i18n/const";

const WALLET_TYPES = ["BTC", "USDT", "ETH", "ETC", "EOS", "BCH", "BSV"];

export default class AddContactScreen extends Screen {
  static get screenID() {
    return "AddContactScreen";
  }
  constructor(props) {
    super(props);

    const updatedContact = props.contact || {};

    this.state = {
      isLoading: true,
      id: updatedContact.id,
      defaultName: updatedContact.name || "",
      name: updatedContact.name || "",
      type: updatedContact.type || "",
      defaultAddress: updatedContact.address || "",
      address: updatedContact.address || "",
    };
    this.props.navigator.addOnNavigatorEvent(this.onNavigatorEvent.bind(this));
  }
  onNavigatorEvent(event) {
    if (event.type == "NavBarButtonPress") {
      // this is the event type for button presses
      if (event.id == "scan_qrcode") {
        // this is the same id field from the static navigatorButtons definition
        this.scanQrcode();
      }
    }
  }
  onNameChange(name) {
    this.setState({ name });
  }

  onWalletTypeChange(type) {
    this.setState({ type });
  }

  onAddressChange(address) {
    this.setState({
      address,
      defaultAddress: address,
    });
  }

  validInput() {
    const { name, type, address } = this.state;
    if (!name || name.length === 0) {
      Alert.alert("", "联系人名称不能为空");
      return false;
    }
    if (name.length > 30) {
      Alert.alert("", "联系人名称不能超过30个字");
      return false;
    }
    if (!type || type.length === 0) {
      Alert.alert("", "请选择一种币类型");
      return false;
    }
    if (!address || address.length === 0) {
      Alert.alert("", "联系人地址不能为空");
      return false;
    }
    return true;
  }

  isValidBTCAddress(addr) {
    let flag = false;
    if (addr) {
      let len = addr.length;

      if (len > 25 && len < 35) {
        // 1和3开头
        // if(addr.startsWith('1') || addr.startsWith('3')){
        return true;
        // }
      }
    }
    return flag;
  }
  isValidETHAddress(addr) {
    let flag = 0;
    if (addr && (addr.startsWith("0x") || addr.startsWith("0X"))) {
      let len = addr.length;
      if (len == 42) {
        return true;
      }
    }
    return flag;
  }
  isVaildEOSAddress(addr) {
    return /^[a-z1-5]{12}$/.test(addr);
  }
  isValidAddress(addr, tokenName) {
    switch (tokenName) {
      case "USDT":
        return this.isValidBTCAddress(addr) || this.isValidETHAddress(addr);
      case "BTC":
      case "BCH":
      case "BSV":
        return this.isValidBTCAddress(addr);
      case "ETH":
      case "ETC":
        return this.isValidETHAddress(addr);
      case "EOS":
        return this.isVaildEOSAddress(addr);
      default:
        return true;
    }
  }

  async saveWallet() {
    console.log("保存操作", this.state);

    if (this.validInput()) {
      let tokenName = this.state.type;
      let checkAddress = this.isValidAddress(this.state.address, tokenName);
      if (!checkAddress) {
        Alert.alert("", "钱包地址不合法");
        return;
      }

      await Contact.save({
        id: this.state.id,
        name: this.state.name,
        type: this.state.type,
        address: this.state.address,
      });

      this.props.navigator.pop({
        animated: true,
        animationType: "slide-horizontal",
      });
    }
  }

  // 扫描二维码
  scanQrcode = () => {
    this.setState({
      defaultAddress: this.state.address,
    });
    const btcWalletInstance = new BTCWallet();
    const ethWalletInstance = new ETHWallet();

    const self = this;
    this.props.navigator.push({
      title: "扫码", //'选择联系人',
      screen: "ScanQRCodeScreen", //'ContactList',
      passProps: {
        coinType: this.props.coinType,
        onBarCodeRead: result => {
          console.log("扫码结果===>>", result.data);
          let addr = result.data;
          if (addr.indexOf(SCHEMA_BTC) === 0) {
            addr = btcWalletInstance.decodePaymentScheme(addr).address;
          }
          if (addr.indexOf(SCHEMA_ETH) === 0) {
            addr = ethWalletInstance.decodePaymentScheme(addr).address;
          }

          self.setState({
            address: addr,
            defaultAddress: addr,
          });
          this.navigator.pop();
        },
      },
    });
  };

  render() {
    return (
      <View style={styles.container}>
        <View style={styles.formContainer}>
          <ActionSheetCell
            containerStyle={styles.inputContainer}
            placeholder={i18n.t("mine-contact-type-placeholder")}
            borderBottom={true}
            options={WALLET_TYPES}
            value={this.state.type}
            onChange={this.onWalletTypeChange.bind(this)}
          />
          <View style={styles.row}>
            <TextInput
              style={styles.input}
              defaultValue={this.state.defaultName}
              placeholder={i18n.t("mine-contact-name-placeholder")}
              maxLength={30}
              borderBottom={true}
              onChangeText={this.onNameChange.bind(this)}
              returnKeyType="done"
            />
          </View>
          <View style={styles.row}>
            <TextInput
              autoCapitalize={"none"}
              autoCorrect={false}
              style={styles.input}
              placeholder={i18n.tt(BIZ_SCOPE.mine, "contact-address-placeholder")}
              value={this.state.address}
              onChangeText={this.onAddressChange.bind(this)}
            />
            <Button icon={require("@img/nav/nav_scan.png")} iconStyle={styles.iconStyle} onPress={this.scanQrcode} />
          </View>
        </View>
        <Footer>
          <Button
            title={i18n.t("common-save")}
            onPress={this.saveWallet.bind(this)}
            titleStyle={styles.buttonTextStyle}
            style={styles.buttonStyle}
            containerStyle={styles.buttonContainer}
          />
        </Footer>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 12,
    backgroundColor: Theme.backgroundColor,
  },

  formContainer: {
    flex: 1,
    backgroundColor: "#ffffff",
    paddingHorizontal: 16,
  },
  input: {
    flex: 1,
    fontSize: 16,
  },
  iconStyle: {
    tintColor: "#000000",
    marginLeft: 8,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    height: 50,
    borderColor: Theme.borderColor,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  buttonStyle: {
    backgroundColor: Theme.linkColor,
    marginTop: 30,
    height: 50,
    elevation: 0,
  },
  buttonContainer: {
    flex: 1,
  },
  buttonTextStyle: {
    fontSize: 18,
    color: "#ffffff",
  },
});
