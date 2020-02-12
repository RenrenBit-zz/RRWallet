import React from "react";
import { View, Text, StyleSheet, Dimensions, TouchableWithoutFeedback } from "react-native";
import Screen from "../Screen";
import Modal from "react-native-modal";
import device from "../../util/device";
import { Navigation } from "react-native-navigation";
import { padding } from "../../util/UIAdapter";
import theme from "../../util/Theme";

const { height, width } = Dimensions.get("window");

export default class PrintMnemonicWord extends Screen {
  componentWillMount() {
    this.getBrightness();
    this.keepScreenOn(true);
  }

  static get screenID() {
    return "PrintMnemonicWord";
  }

  async keepScreenOn(val) {
    device.keepScreenOn(val);
  }

  async getBrightness() {
    device.getScreenBrightness().then(val => {
      this.brightness = val;
      this.setBrightness(1);
    });
  }

  async setBrightness(val) {
    device.setScreenBrightness(val);
  }

  constructor(props) {
    super(props);
    this.brightness = 0.5;
  }

  render() {
    return (
      <Modal visible={true} style={styles.printModal} onBackdropPress={this.closePrintModal.bind(this)}>
        {this.props.words.map((word, index) => (
          <TouchableWithoutFeedback onPress={this.closePrintModal.bind(this)}>
            <View key={index} style={styles.printWordView}>
              <Text style={styles.printWord} numberOfLines={1}>
                {word}
              </Text>
              <Text style={styles.indexText}>
                {index < 9 ? "0" : ""}
                {index + 1}
              </Text>
            </View>
          </TouchableWithoutFeedback>
        ))}
      </Modal>
    );
  }

  closePrintModal() {
    this.setBrightness(this.brightness);
    this.keepScreenOn(false);
    Navigation.dismissAllModals({ animationType: "none" });
  }
}

const styles = StyleSheet.create({
  printModal: {
    //flex: 1,
    position: "absolute",
    left: -(height - width) / 2,
    top: (height - width) / 2,
    width: height,
    height: width,
    flexDirection: "row",
    backgroundColor: "#000",
    margin: 0,
    paddingLeft: device.isIPhoneX ? 40 : 0,
    justifyContent: "center",
    alignContent: "center",
    flexWrap: "wrap",
    transform: [{ rotateZ: "90deg" }],
  },
  printWordView: {
    width: "22%",
    height: 40,
    marginVertical: padding(28),
    flexDirection: "row",
    alignItems: "center",
  },
  printWord: {
    fontSize: 36,
    lineHeight: 36,
    fontWeight: theme.fontWeight.medium,
    color: "#fff",
  },
  indexText: {
    fontSize: 20,
    color: "#fff",
    alignSelf: "flex-start",
    // position:'relative',
    // top:-5,
    // left:8
  },
});
