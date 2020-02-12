import React, { Component } from "react";
import { StyleSheet, View } from "react-native";
import device from "../../util/device";

export default class Footer extends Component {
  render() {
    return (
      <View style={styles.footer}>
        <View style={[styles.container, this.props.containerStyle || {}]}>{this.props.children}</View>
        {device.isIPhoneX && <View style={styles.bottom} />}
      </View>
    );
  }
}

const styles = StyleSheet.create({
  footer: {
    width: "100%",
    backgroundColor: "#FFFFFF",
  },
  container: {
    paddingHorizontal: 0,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  bottom: {
    height: device.iPhoneXSafeArea.bottom,
  },
});
