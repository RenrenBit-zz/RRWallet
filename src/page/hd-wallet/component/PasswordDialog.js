import React, { Component } from "react";
import Modal from "react-native-modal";
import { StyleSheet, View, Text, Image, TextInput, TouchableHighlight } from "react-native";
import { Button } from "react-native-elements";
import theme from "../../../util/Theme";
import { observer } from "mobx-react";
import { observable, computed } from "mobx";
import i18n from "../../../module/i18n/i18n";
import { sleep } from "../../../util/Timer";

@observer
class PasswordDialog extends Component {
  @observable visible = false;
  @observable password = "";
  @computed get disabled() {
    return this.password.length < 8;
  }
  show = () => {
    this.visible = true;
    return new Promise((resolve, reject) => {
      this.resolve = resolve;
      this.reject = reject;
    });
  };
  dismiss = () => {
    this.password = "";
    this.visible = false;
    this.onCompletion = null;
  };
  onClosePress = () => {
    this.dismiss();
  };
  onConfirmPress = async () => {
    const pwd = this.password;
    this.dismiss();
    await sleep(120);
    this.resolve && this.resolve(pwd);
    this.resolve = null;
  };
  onChangePassword = text => {
    this.password = text;
  };
  render() {
    return (
      <Modal
        avoidKeyboard={true}
        isVisible={this.visible}
        style={sdStyles.modal}
        animationIn="fadeIn"
        animationOut="fadeOut"
        animationOutTiming={100}
        backdropOpacity={0.4}
        hideModalContentWhileAnimating={true}
        useNativeDriver={true}>
        <View style={sdStyles.main}>
          <View style={sdStyles.titleWrap}>
            <Text style={sdStyles.title}>{i18n.t("wallet-create-confirmpwd")}</Text>
            <TouchableHighlight
              style={sdStyles.close}
              onPress={this.dismiss}
              underlayColor="transparent"
              activeOpacity={0.6}
              hitSlop={{ top: 20, left: 10, bottom: 16, right: 16 }}>
              <Image source={require("@img/wallet/close_icon.png")} />
            </TouchableHighlight>
          </View>
          <TextInput
            style={[sdStyles.input, { marginTop: 30 }]}
            placeholder={i18n.t("wallet-multisig-password-placeholder")}
            onChangeText={this.onChangePassword}
            secureTextEntry={true}
            clearButtonMode="while-editing"
            autoFocus={true}
          />
          <Button
            title={i18n.t("wallet-receive-settings-confirm")}
            containerStyle={sdStyles.buttonContainerStyle}
            onPress={this.onConfirmPress}
            disabled={this.disabled}
          />
        </View>
      </Modal>
    );
  }
}

const sdStyles = StyleSheet.create({
  modal: {
    margin: 0,
    alignItems: "center",
  },
  main: {
    borderRadius: 12,
    backgroundColor: "#FFFFFF",
    padding: 16,
    paddingTop: 0,
    width: 300,
  },
  titleWrap: {
    alignItems: "center",
    borderBottomColor: theme.borderColor,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  title: {
    marginVertical: 16,
    fontSize: 18,
    fontWeight: theme.fontWeight.medium,
    color: theme.textColor.primary,
  },
  close: {
    position: "absolute",
    left: 4,
    top: 20,
  },
  input: {
    borderRadius: 3,
    height: 50,
    paddingHorizontal: 16,
    fontSize: 14,
    backgroundColor: theme.backgroundColor,
    borderColor: theme.borderColor,
    borderWidth: StyleSheet.hairlineWidth,
  },
  price: {
    height: 20,
    color: "#F5A623",
    fontSize: 14,
    lineHeight: 20,
    marginTop: 9,
  },
  buttonContainerStyle: {
    marginTop: 20,
    marginBottom: 14,
  },
  buttonStyle: {
    borderRadius: 3,
    height: 50,
    backgroundColor: theme.brandColor,
  },
});

export default PasswordDialog;
