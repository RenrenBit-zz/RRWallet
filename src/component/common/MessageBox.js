import React, { Component } from "react";
import PropTypes from "prop-types";
import { StyleSheet, View, Text, Image, TouchableHighlight } from "react-native";
import Modal from "react-native-modal";
import Theme from "@theme";
import i18n from "@i18n";

const ICON_TYPE = { SUCCESS: "SUCCESS", WARNING: "WARNING", ERROR: "ERROR" };

class MessageBox extends Component {
  static propTypes = {
    iconType: PropTypes.oneOf(ICON_TYPE),
    title: PropTypes.string,
    content: PropTypes.string,
    onOk: PropTypes.func,
    onCancel: PropTypes.string,
    okText: PropTypes.string,
    cancelText: PropTypes.string,
    autoClose: PropTypes.bool,
    type: PropTypes.oneOf(["alert", "confirm"]),
    contentStyle: Text.propTypes.style,
    model: PropTypes.bool,
  };

  static defaultProps = {
    autoClose: false,
    type: "alert",
    model: true,
  };

  constructor(props) {
    super(props);
    this.state.visible = props.visible || false;
  }

  /**
   *
   * @param {Object} args
   * @param {ICON_TYPE.WARNING|ICON_TYPE.SUCCESS|ICON_TYPE.ERROR} iconType
   * @param {String} args.content
   * @param {String} args.okText
   * @param {String} args.cancelText
   * @param {Function} args.onOk
   * @param {Function} args.onCancel
   * @memberof MessageBox
   */
  show(args) {
    let props = {
      title: "",
      content: "",
      okText: i18n.t("common-confirm"),
      cancelText: i18n.t("common-cancel"),
      onOk: null,
      onCancel: null,
      type: "",
    };
    if (args) {
      if (typeof args === "string") {
        props.content = args;
      } else if (typeof args === "object") {
        props = Object.assign(props, args);
      } else {
        console.error("invalid arguments, must be string or object", args);
      }
    }

    this.setState({
      visible: true,
      ...props,
    });
  }

  close() {
    this.setState({
      visible: false,
    });
  }

  state = {
    visible: false,
    title: "",
    content: "",
    okText: i18n.t("common-confirm"),
    cancelText: i18n.t("common-cancel"),
  };

  ICONS = {
    SUCCESS: require("@img/icon/alert-success.png"),
    WARNING: require("@img/icon/alert-warning.png"),
    ERROR: require("@img/icon/alert-error.png"),
  };

  onOkPress() {
    const onOk = this.state.onOk || this.props.onOk;
    this.close();
    setTimeout(_ => {
      onOk && onOk();
    }, 400);
  }

  onCancelPress() {
    const onCancel = this.state.onCancel || this.props.onCancel;
    this.close();
    setTimeout(_ => {
      onCancel && onCancel();
    }, 300);
  }

  /**
   * @function showConfirm
   * @param {Object} args
   * @param {ICON_TYPE.WARNING|ICON_TYPE.SUCCESS|ICON_TYPE.ERROR} args.iconType
   * @param {String} args.content
   * @param {String} args.okText
   * @param {String} args.cancelText
   * @param {Function} args.onOk
   * @param {Function} args.onCancel
   * @memberof MessageBox
   */
  showConfirm = args => {
    let props = {
      type: "confirm",
      iconType: ICON_TYPE.WARNING,
    };
    if (typeof args === "string") {
      props.content = args;
    } else if (typeof args === "object") {
      props = Object.assign(props, args);
    } else {
      console.error("invalid arguments, must be string or object", args);
    }

    let promise = new Promise((resolve, reject) => {
      props.onOk = () => {
        resolve(true);
        args && args.onOk && args.onOk();
      };
      props.onCancel = () => {
        resolve(false);
        args && args.onCancel && args.onCancel();
      };

      this.show(props);
    });

    return promise;
  };
  renderContent = () => {
    let { title, iconType, okText, cancelText, content, contentStyle } = this.props;

    const newTitle = this.state.title || title;
    const newOkText = this.state.okText || okText;
    const newCancelText = this.state.cancelText || cancelText;
    const type = this.state.type || this.props.type;
    content = this.state.content || content;

    if (!iconType) {
      iconType = this.state.iconType;
    }
    const image = this.ICONS[iconType];
    return (
      <View style={styles.container}>
        <View style={styles.body}>
          {typeof newTitle === "string" && <Text style={styles.title}>{newTitle}</Text>}
          {image !== undefined && <Image style={styles.icon} source={image} />}
          {typeof content === "string" && (
            <Text numberOfLines={12} style={[styles.content, contentStyle]}>
              {content}
            </Text>
          )}
        </View>

        <View style={styles.footer}>
          {type === "alert" && (
            <TouchableHighlight onPress={this.onOkPress.bind(this)}>
              <View
                style={{
                  alignItems: "center",
                  paddingVertical: 13,
                }}>
                <Text style={styles.okText}>{i18n.t("common-iKnow")}</Text>
              </View>
            </TouchableHighlight>
          )}
          {type === "confirm" && (
            <View style={styles.confirmWrap}>
              <TouchableHighlight
                onPress={this.onCancelPress.bind(this)}
                style={{
                  flex: 1,
                  paddingVertical: 13,
                  borderRightColor: Theme.borderColor,
                  borderRightWidth: StyleSheet.hairlineWidth,
                }}>
                <Text style={styles.okText}>{newCancelText}</Text>
              </TouchableHighlight>
              <TouchableHighlight style={{ flex: 1, paddingVertical: 13 }} onPress={this.onOkPress.bind(this)}>
                <Text style={styles.okText}>{newOkText}</Text>
              </TouchableHighlight>
            </View>
          )}
        </View>
      </View>
    );
  };
  render() {
    if (this.props.model) {
      return (
        <Modal
          isVisible={this.state.visible}
          animationIn="zoomIn"
          animationOut="zoomOut"
          animationOutTiming={250}
          style={{
            ...StyleSheet.absoluteFillObject,
            marginHorizontal: 36,
          }}
          useNativeDriver={true}
          hideModalContentWhileAnimating={true}>
          {this.renderContent()}
        </Modal>
      );
    }
    if (!this.state.visible) {
      return null;
    }
    return <View style={styles.absolute}>{this.renderContent()}</View>;
  }
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#fff",
    borderRadius: 3,
  },
  absolute: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "#000000B4",
    paddingHorizontal: 36,
    justifyContent: "center",
  },
  body: {
    paddingHorizontal: 16,
    paddingTop: 30,
    paddingBottom: 20,
    alignItems: "center",
    borderBottomColor: Theme.borderColor,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  icon: {
    marginBottom: 16,
    width: 32,
    height: 32,
    resizeMode: "stretch",
  },
  title: {
    marginBottom: 16,
    fontSize: 18,
    color: "#000",
    fontWeight: "500",
  },
  content: {
    fontSize: 14,
    color: "#333333",
    lineHeight: 18,
    textAlign: "center",
  },
  footer: {
    borderBottomRightRadius: 3,
    borderBottomLeftRadius: 3,
  },
  okText: {
    fontSize: 18,
    textAlign: "center",
    color: "#007AFF",
  },
  confirmWrap: {
    flexDirection: "row",
  },
});

export default MessageBox;
export { ICON_TYPE };
