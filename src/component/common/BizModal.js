import React, { Component } from "react";
import PropTypes from "prop-types";
import { View, Text, StyleSheet, Image, TouchableOpacity, ViewPropTypes } from "react-native";
import Modal from "react-native-modal";
import { Icon, Button } from "react-native-elements";

import Theme from "../../util/Theme";

// 业务modal
class BizModal extends Component {
  constructor(props) {
    super(props);

    this.state = {
      openState: false,
    };
  }

  static propTypes = {
    containerStyle: ViewPropTypes.style, // 容器样式
    contentStyle: ViewPropTypes.style, // 内容区样式
    title: PropTypes.string, // 标题
    buttonTitle: PropTypes.string, // 按钮标题
    buttonStyle: ViewPropTypes.style,
    visible: PropTypes.bool, // 弹窗展示状态
    onPress: PropTypes.func,
    onClose: PropTypes.func,
  };

  render() {
    const {
      title = "Hello",
      buttonTitle,
      buttonStyle,
      children,
      onPress,
      containerStyle,
      contentStyle,
      onClose,
    } = this.props;
    return (
      <Modal
        isVisible={this.props.visible}
        animationIn="zoomIn"
        avoidKeyboard={true}
        style={{ flex: 1 }}
        animationOutTiming={250}
        animationOut="zoomOut">
        <View style={[styles.container, containerStyle]}>
          <View style={styles.titleContainer}>
            <TouchableOpacity onPress={onClose} style={styles.close}>
              <Image source={require("@img/icon/close.png")} />
            </TouchableOpacity>
            <Text style={styles.title}>{title}</Text>
          </View>

          <View style={[styles.body, contentStyle]}>{children}</View>

          {buttonTitle && (
            <Button
              title={buttonTitle}
              onPress={onPress}
              buttonStyle={[{ height: 50, borderRadius: 3, elevation: 0, backgroundColor: "#007AFF" }, buttonStyle]}
              containerStyle={{ marginBottom: 30, marginHorizontal: 16 }}
            />
          )}
        </View>
      </Modal>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#fff",
    borderRadius: 12,
    marginHorizontal: 20,
  },
  close: {
    paddingHorizontal: 16,
    height: "100%",
    justifyContent: "center",
  },
  titleContainer: {
    height: 52,
    flexDirection: "row",
    alignItems: "center",
    borderBottomColor: Theme.borderColor,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  title: {
    fontSize: 18,
    color: "#000",
    fontWeight: "500",
    flex: 1,
    textAlign: "center",
    marginRight: 44,
    marginVertical: 16,
  },
  body: {
    padding: 16,
  },
});

export default BizModal;
