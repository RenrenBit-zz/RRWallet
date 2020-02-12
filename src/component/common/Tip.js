import React, { Component } from "react";
import { StyleSheet, Image, View, Text, TouchableHighlight } from "react-native";
import { Input, Button, Slider } from "react-native-elements";
import Theme from "../../util/Theme";
import Modal from "react-native-modal";
import { padding } from "../../util/UIAdapter";
import _ from "lodash";
import i18n from "../../module/i18n/i18n";

export default class Tip extends Component {
  defaultOption = {
    containerStyle: {}, // 最外层的样式
    hideTitle: true,
    title: i18n.t("common-notice"), // 最上面标题
    titleTextStyle: {}, // 最上面标题的样式
    message: "", // 传入的文案
    hideCloseButton: false, // 是否隐藏关闭按钮 true为隐藏
    iconSource: null, // messageType 支持 success/error/info...
    messageColor: "#333", //
    onClose: null, // 左上角关闭的回调
    onConfirm: null, // 最下面按钮的回调
    buttonText: i18n.t("common-ok"), // 最下面按钮的文字
    buttonContainerStyle: {}, // 最下面按钮
    buttonStyle: {}, // 最下面按钮的样式
    titleStyle: {}, // 最下面按钮的文字
    useSingleButton: false, // 是否使用单button的那种样式
    messageComponent: null, // 消息体，可替换message
    contentWrapStyle: {}, // 中间部分样式
    customComponent: null, // 除标题栏外，下面的全自定义
    bottomComponent: null, // 最底部按钮自定义
    buttons: null,
    // 支持2个button {title, containerStyle, buttonStyle, titleStyle, onPress, preventDefault, loadingProps, loadingStyle}
    // 其中 title默认左取消，右确认, onPress默认会关闭弹框，当preventDefault为真时, 会出同loading按钮, 需要关闭时调用hide方法
    // 可以通过 setButtonState 传入button表列改变button组的状态
  };
  constructor(props) {
    super(props);
    this.state = {};
    for (let n in this.defaultOption) {
      if (typeof this.props[n] != "undefined") {
        this.defaultOption = this.props[n];
        this.state[n] = this.props[n];
      }
    }
  }

  refreshState(param, cb) {
    this.setState(param, cb);
  }

  close() {
    this.hide();
    this.state.onClose && this.state.onClose();
  }

  onButtonPress = () => {
    this.hide();
    this.state.onConfirm && this.state.onConfirm();
  };

  hide() {
    this.setState({ visible: false });
  }

  ICONS = {
    SUCCESS: require("@img/qunfabao/alert-success.png"),
    WARNING: require("@img/qunfabao/alert-warning.png"),
    ERROR: require("@img/qunfabao/alert-error.png"),
  };

  show(opt) {
    if (typeof opt == "string") {
      opt = {
        message: opt,
      };
    }
    opt.visible = true;

    switch (opt.messageType) {
      case "info":
        opt.messageColor = "#fea900";
        opt.iconSource = this.ICONS.WARNING;
        break;
      case "success":
        opt.messageColor = "#7ED321";
        opt.iconSource = this.ICONS.SUCCESS;
        break;
      case "error":
        opt.messageColor = "#EB4E3D";
        opt.iconSource = this.ICONS.ERROR;
        break;
    }

    setTimeout(() => {
      this.setState({
        ...this.defaultOption,
        ...opt,
      });
    }, 16);
  }

  /**
   *
   * @param {Object} opt
   * @param {String} opt.message
   * @param {String} opt.okText
   * @param {String} opt.cancelText
   * @returns
   * @memberof Tip
   */
  confirm(opt = {}) {
    return new Promise((resolve, reject) => {
      if (typeof opt === "string") {
        opt = { message: opt };
      }
      opt.buttons = [
        {
          title: opt.cancelText || "",
          onPress: () => {
            resolve(false);
          },
        },
        {
          title: opt.okText || "",
          onPress: () => {
            resolve(true);
          },
        },
      ];
      this.show(opt);
    });
  }

  showSuccess(opt) {
    if (!_.isString(opt) && !_.isPlainObject(opt)) {
      if (__DEV__) {
        throw new Error("invaild opt");
      }
      return;
    }

    if (typeof opt == "string") {
      opt = {
        message: opt,
      };
    }

    opt.messageType = "success";
    this.show(opt);
  }
  showError(opt) {
    if (!_.isString(opt) && !_.isPlainObject(opt)) {
      if (__DEV__) {
        throw new Error("invaild opt");
      }
      return;
    }

    if (typeof opt == "string") {
      opt = {
        message: opt,
      };
    }
    opt.messageType = "error";
    this.show(opt);
  }
  showInfo(opt) {
    if (!_.isString(opt) && !_.isPlainObject(opt)) {
      if (__DEV__) {
        throw new Error("invaild opt");
      }
      return;
    }

    if (typeof opt == "string") {
      opt = {
        message: opt,
      };
    }

    opt.messageType = "info";
    this.show(opt);
  }

  renderDesc() {
    const {
      iconSource,
      message,
      messageColor,
      messageComponent,
      contentWrapStyle,
      messageTextStyle,
      imageContainerStyle = {},
    } = this.state;
    return (
      <View style={[styles.contentWrap, contentWrapStyle || {}]} key={"suc"}>
        {!!iconSource ? (
          <View style={[{ alignItems: "center", paddingTop: 30, marginBottom: -16 }, imageContainerStyle]}>
            <Image source={iconSource} style={{ width: 32, height: 32, resizeMode: "stretch" }} />
          </View>
        ) : null}
        {messageComponent ? (
          messageComponent
        ) : (
          <Text
            style={[
              styles.message,
              messageColor && { color: messageColor },
              {
                fontSize: 14,
                color: "#333333",
              },
              messageTextStyle || {},
            ]}>
            {message}
          </Text>
        )}
      </View>
    );
  }

  setButtonState(buttons) {
    this.setState({ buttons: buttons });
  }

  refresh(obj) {
    this.setState(obj);
  }

  renderCustomButtons() {
    let data = this.state;
    let buttons = data.buttons;
    return (
      <View style={{ flexDirection: "row", marginBottom: 0 }}>
        {buttons.map((item, index) => {
          return (
            <Button
              key={index}
              loading={!!item.loading}
              loadingProps={Object.assign({ size: 1, color: "rgba(0, 0, 0, 0.8)" }, item.loadingProps || {})}
              loadingStyle={[{}, item.loadingStyle]}
              title={item.title || (index == 0 ? i18n.t("common-cancel") : i18n.t("common-confirm"))}
              containerStyle={[
                {
                  flex: 1,
                  borderColor: "#eee",
                  borderTopWidth: StyleSheet.hairlineWidth,
                  borderRightWidth: index == 0 ? StyleSheet.hairlineWidth : 0,
                },
                item.containerStyle,
              ]}
              buttonStyle={[styles.buttonStyle, item.buttonStyle]}
              titleStyle={[styles.titleStyle, item.titleStyle]}
              onPress={() => {
                if (item.loading) {
                  return;
                }
                if (!item.preventDefault) {
                  this.hide();
                } else {
                  buttons[index].loading = true;
                  this.setButtonState(buttons);
                }
                setTimeout(() => {
                  _.isFunction(item.onPress) && item.onPress();
                }, 100);
              }}
            />
          );
        })}
      </View>
    );
  }

  renderBtn() {
    let data = this.state;

    if (data.bottomComponent) {
      return data.bottomComponent;
    }
    if (data.buttons && data.buttons.length == 2) {
      return this.renderCustomButtons();
    }

    let buttonText = data.buttonText;
    let buttonContainerStyle = data.buttonContainerStyle || {};
    let buttonStyle = data.buttonStyle || {};
    let titleStyle = data.titleStyle || {};
    if (!!data.useSingleButton) {
      return (
        <View style={{ paddingBottom: 30, paddingHorizontal: 16, paddingTop: 20 }} key={"btn"}>
          <Button
            title={buttonText}
            containerStyle={[styles.nextButtonContainer, buttonContainerStyle]}
            buttonStyle={[styles.nextButton, buttonStyle]}
            titleStyle={[{ color: "#fff", fontSize: 18 }, titleStyle]}
            onPress={this.onButtonPress}
          />
        </View>
      );
    } else {
      return (
        <View style={styles.foot} key={"btn"}>
          <Button
            title={buttonText}
            containerStyle={[{ borderColor: "#eee", borderTopWidth: StyleSheet.hairlineWidth }, buttonContainerStyle]}
            buttonStyle={[styles.buttonStyle, buttonStyle]}
            titleStyle={[styles.titleStyle, titleStyle]}
            onPress={this.onButtonPress}
          />
        </View>
      );
    }
  }

  renderTpl() {
    let data = this.state;

    if (data.customComponent) {
      return data.customComponent;
    }

    return [this.renderTitle(), this.renderDesc(), this.renderBtn()];
  }

  getCloseTpl() {
    return !this.state.hideCloseButton ? (
      <TouchableHighlight activeOpacity={0.6} underlayColor="transparent" onPress={this.close.bind(this)}>
        <View style={styles.closeBtn}>
          <Image source={require("@img/qunfabao/icon_x.png")}></Image>
        </View>
      </TouchableHighlight>
    ) : null;
  }

  renderTitle() {
    if (this.state.hideTitle) {
      return null;
    } else {
      return (
        <View style={styles.titleWrap} key={0}>
          <View>{this.getCloseTpl()}</View>
          <Text style={[styles.title, this.state.titleTextStyle]}>{this.state.title}</Text>
          {!this.state.hideCloseButton ? <View style={{ width: 56 }}></View> : null}
        </View>
      );
    }
  }

  render() {
    let data = this.state;
    // if(!data.visible){
    //     return null;
    // }
    return (
      <Modal
        isVisible={this.state.visible}
        animationIn="fadeIn"
        animationOut="fadeOut"
        animationOutTiming={100}
        style={styles.modal}
        useNativeDriver={true}
        hideModalContentWhileAnimating={true}>
        <View style={[styles.container, data.containerStyle || {}]}>
          <View style={[styles.wrap, data.wrapStyle || {}]}>{this.renderTpl()}</View>
        </View>
      </Modal>
    );
  }
}

const styles = StyleSheet.create({
  contentWrap: {
    // paddingTop: 42,
    paddingHorizontal: 16,
    alignItems: "center",
    // paddingBottom: 90
    // justifyContent: 'center'
  },

  modal: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.4)",
    margin: 0,
  },
  container: {},

  wrap: {
    marginHorizontal: padding(52),
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
  closeBtn: { width: 56, height: 56, justifyContent: "center", alignItems: "center" },
  title: {
    fontSize: 18,
    color: Theme.textColor.primary,
    textAlign: "center",
    fontWeight: "500",
    // paddingTop: 12,
    // paddingBottom: 12,
    // height: 56,
    // lineHeight: 56,
    flex: 1,
  },
  message: {
    color: "#EB4E3D",
    fontSize: 16,
    lineHeight: 20,
    paddingTop: 30,
    paddingBottom: 20,
    paddingHorizontal: 0,
    textAlign: "center",
  },
  titleStyle: { color: Theme.linkColor, fontSize: 18 },
  buttonStyle: { borderRadius: 0, backgroundColor: "#fff", height: 50, elevation: 0 },
  foot: {},
  nextButtonContainer: {},
  nextButton: {
    width: "100%",
    height: 50,
    borderRadius: 3,
    backgroundColor: Theme.brandColor,
    elevation: 0,
  },
});
