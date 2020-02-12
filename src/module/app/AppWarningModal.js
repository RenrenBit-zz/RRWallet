import React, { Component } from "react";
import { StyleSheet, View, Text, DeviceEventEmitter } from "react-native";
import { Button } from "react-native-elements";
import theme from "../../util/Theme";
import { Navigation } from "react-native-navigation";
import { NOTIFICATION_WARNING_FINISH } from "../../config/const";
import i18n from "../i18n/i18n";

class AppWarningModal extends Component {
  static get screenID() {
    return "AppWarningModal";
  }
  get title() {
    return i18n.select(this.props.title);
  }
  get content() {
    return i18n.select(this.props.content);
  }
  get buttonTitle() {
    return i18n.select({ zh: "知道了", en: "Got it" });
  }
  onConfirmPress = () => {
    Navigation.dismissLightBox();
    DeviceEventEmitter.emit(NOTIFICATION_WARNING_FINISH);
  };
  render() {
    return (
      <View style={styles.main}>
        <View style={styles.alert}>
          <Text style={styles.title}>{this.title}</Text>
          <Text style={styles.desc}>{this.content}</Text>
          <Button
            buttonStyle={styles.button}
            titleStyle={styles.buttonText}
            title={this.buttonTitle}
            onPress={this.onConfirmPress}
          />
        </View>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  main: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  alert: {
    width: 303,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 20,
    backgroundColor: "#FFFFFF",
  },
  title: {
    marginTop: 10,
    fontSize: 18,
    fontWeight: theme.fontWeight.medium,
    color: theme.textColor.primary,
    textAlign: "center",
  },
  desc: {
    marginTop: 16,
    marginHorizontal: 3,
    fontSize: 14,
    lineHeight: 25,
    color: "#666666",
    marginBottom: 20,
    textAlign: "center",
  },
  button: {
    height: 50,
    borderRadius: 3,
    backgroundColor: theme.linkColor,
    elevation: 0,
  },
  buttonText: {
    fontSize: 18,
  },
});

export default AppWarningModal;
