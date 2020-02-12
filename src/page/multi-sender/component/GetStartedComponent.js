import React, { Component } from "react";
import { StyleSheet, View, Text, Image, TouchableHighlight, Alert, Clipboard } from "react-native";
import { observer } from "mobx-react";
import i18n from "../../../module/i18n/i18n";
import Button from "../../../component/common/Button";
import theme from "../../../util/Theme";
import ProgressHUD from "../../../component/common/ProgressHUD";
import ClipboardModal from "./ClipboardModal";
import MultiSender from "../../../module/multi-sender";
import { observable } from "mobx";

const BATCH_SEND_URL = "https://www.renrenbit.com/index.html#/coin/batchSend";
@observer
export default class GetStartedComponent extends Component {
  @observable clipboardModalVisible = false;
  onQRCodeDetected = async result => {
    const { onTaskReady, taskID } = this.props;
    let recipientID;

    try {
      const json = JSON.parse(decodeURIComponent(result.data));
      if (json.recipientUUID) {
        recipientID = json.recipientUUID;
      }
    } catch (error) {}

    if (!recipientID) {
      this.hud && this.hud.showFailed(i18n.t("qunfabao-scan-error"));
      return;
    }

    try {
      this.hud && this.hud.showLoading();
      const recipients = await MultiSender.getRecipients(recipientID, taskID);
      this.hud && this.hud.dismiss();

      recipients.forEach(recipient => (recipient.selected = !recipient.txhash));

      onTaskReady && onTaskReady(recipients);
    } catch (error) {
      alert(error);
      this.hud && this.hud.showFailed(i18n.t("qunfabao-fetch-none"));
    }
  };

  onDataParseSuccess = async recipients => {
    const { onTaskReady, taskID } = this.props;

    this.clipboardModalVisible = false;
    this.dismissPasteModal();
    try {
      this.hud && this.hud.showLoading();
      const result = await MultiSender.postRecipients(recipients, taskID);
      this.hud && this.hud.dismiss();

      onTaskReady && onTaskReady(result);
    } catch (error) {
      alert(error);
      this.hud && this.hud.showFailed(error.message);
    }
  };

  showPasteModal = () => {
    this.clipboardModalVisible = true;
  };

  dismissPasteModal = () => {
    this.clipboardModalVisible = false;
  };

  goToScanCode = () => {
    this.props.navigator.push({
      title: i18n.t("qunfabao-scan-code"),
      screen: "ScanQRCodeScreen",
      passProps: {
        onBarCodeRead: result => {
          this.props.navigator.pop();
          setTimeout(() => {
            this.onQRCodeDetected(result);
          }, 180);
        },
      },
    });
  };

  onScanPress = () => {
    Alert.alert("", i18n.t("qunfabao-import-data"), [
      {
        text: i18n.t("qunfabao-confirm-cancel"),
        onPress: () => {},
      },
      {
        text: i18n.t("qunfabao-confirm-ok"),
        onPress: this.goToScanCode(),
      },
    ]);
  };

  onUrlPress = () => {
    Clipboard.setString(BATCH_SEND_URL);
    this.hud && this.hud.showSuccess(i18n.t("qunfabao-copy-success"));
  };

  render() {
    return (
      <View style={{ flex: 1 }}>
        <View style={styles.methodContainer}>
          <View style={styles.methodWrap}>
            <Text style={styles.methodTitle}>创建方式一</Text>
            <View style={styles.separator} />
            <Text style={styles.methodDesc}>在电脑上打开下方群发宝Web端网址，按说明创建群发任务，然后扫码导入地址</Text>
            <TouchableHighlight activeOpacity={0.6} underlayColor="transparent" onPress={this.onUrlPress}>
              <View style={styles.urlWrap}>
                <Text style={styles.url}> {BATCH_SEND_URL} &nbsp;&nbsp;&nbsp;&nbsp;</Text>
                <Image source={require("@img/qunfabao/icon_cp.png")} />
              </View>
            </TouchableHighlight>
            <Button
              title={i18n.t("qunfabao-scan-import-address")}
              style={styles.button}
              titleStyle={styles.buttonTitle}
              onPress={this.onScanPress}
            />
          </View>
          <View style={styles.methodSeparator} />
          <View style={styles.methodWrap}>
            <Text style={styles.methodTitle}>创建方式二</Text>
            <View style={styles.separator} />
            <Text style={styles.methodDesc}>直接粘贴发币地址，创建群发任务</Text>
            <Button
              title={i18n.t("qunfabao-copy-address")}
              style={styles.button}
              titleStyle={styles.buttonTitle}
              onPress={this.showPasteModal}
            />
          </View>
        </View>
        <ProgressHUD ref={ref => (this.hud = ref)} />
        {this.clipboardModalVisible && (
          <ClipboardModal onCancel={this.dismissPasteModal} onDataParseSuccess={this.onDataParseSuccess} />
        )}
      </View>
    );
  }
}

const styles = StyleSheet.create({
  btn: {
    paddingBottom: 15,
    paddingTop: 15,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  methodContainer: {},
  methodWrap: {
    paddingHorizontal: 16,
    paddingVertical: 20,
    backgroundColor: "#fff",
  },
  methodTitle: {
    marginBottom: 16,
    fontSize: 14,
    fontWeight: theme.fontWeight.medium,
    color: theme.textColor.primary,
  },
  methodDesc: {
    marginVertical: 20,
    fontSize: 12,
    lineHeight: 18,
    color: theme.textColor.primary,
  },
  methodSeparator: {
    height: 12,
    backgroundColor: theme.backgroundColor,
  },
  separator: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: theme.borderColor,
  },
  button: {
    backgroundColor: theme.brandColor,
    height: 50,
    borderRadius: 3,
  },
  buttonTitle: {
    color: "#fff",
    fontSize: 18,
  },
  urlWrap: {
    backgroundColor: "#fff",
    borderRadius: 6,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "#D0D4E8",
    borderStyle: "dashed",
    flexDirection: "row",
    marginBottom: 20,
  },
  url: {
    color: "#157CF8",
    fontSize: 16,
    paddingVertical: 14,
    paddingLeft: 3,
    textAlign: "center",
  },
});
