import React, { Component } from "react";
import Modal from "react-native-modal";
import { StyleSheet, View, TouchableHighlight, Image, Text } from "react-native";
import theme from "../../../util/Theme";
import PropTypes from "prop-types";

export default class ScreenShotWarningModal extends Component {
  static propTypes = {
    visible: PropTypes.bool,
  };

  state = {
    visible: false,
  };

  constructor(props) {
    super(props);
    this.state = {
      visible: props.visible,
    };
  }
  render() {
    return (
      <Modal {...this.props} visible={this.state.visible} style={styles.modal}>
        <View style={styles.container}>
          <View style={styles.header}>
            <Image source={require("@img/wallet/wallet_screenshot_warning.png")} />
          </View>
          <Text style={styles.title}>请勿拍照截图</Text>
          <Text style={styles.desc}>如果有人获取你的助记词将直接获取你的资产！请抄写下助记词并存放在安全的地方</Text>
          <TouchableHighlight
            activeOpacity={0.6}
            underlayColor="transparent"
            onPress={this.onKnowButtonPress}
            style={styles.buttonWrap}>
            <Text style={styles.button}>我知道了</Text>
          </TouchableHighlight>
        </View>
      </Modal>
    );
  }
  onKnowButtonPress = () => {
    this.setState({
      visible: false,
    });
  };
}

const styles = StyleSheet.create({
  modal: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.4)",
    margin: 0,
  },
  container: {
    marginHorizontal: 36,
    alignItems: "center",
    borderRadius: 12,
    overflow: "hidden",
    backgroundColor: "#FFFFFF",
  },
  header: {
    width: "100%",
    height: 142,
    backgroundColor: "#FEA900",
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    marginTop: 30,
    color: theme.textColor.primary,
    fontSize: 17,
  },
  desc: {
    marginTop: 16,
    marginHorizontal: 32,
    color: "#A7A7A7",
    fontSize: 14,
    lineHeight: 19,
    textAlign: "center",
  },
  buttonWrap: {
    marginTop: 30,
    height: 44,
    width: "100%",
    borderTopColor: theme.borderColor,
    borderTopWidth: StyleSheet.hairlineWidth,
    alignItems: "center",
    justifyContent: "center",
  },
  button: {
    color: "#007AFF",
    fontSize: 18,
  },
});
