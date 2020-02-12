import React, { Component } from "react";
import { StyleSheet, View, Image, Text, ImageBackground } from "react-native";
import PropTypes from "prop-types";
import * as Animatable from "react-native-animatable";
import { computed, observable, action } from "mobx";
import { observer } from "mobx-react";
import {
  HUD_TYPE_LOADING,
  HUD_TYPE_TOAST,
  HUD_STATUS_SUCCESS,
  HUD_STATUS_FAILED,
  HUD_STATUS_CUSTOM,
  HUD_TYPE_ALERT,
} from "../../config/const";
import Modal from "react-native-modal";
import MessageBox, { ICON_TYPE } from "@CC/MessageBox";

Animatable.initializeRegistryWithDefinitions({
  fadeInOut: {
    0: {
      opacity: 0,
    },
    0.1: {
      opacity: 1,
    },
    0.95: {
      opacity: 1,
    },
    1: {
      opacity: 0,
    },
  },
});

@observer
export default class ProgressHUD extends Component {
  handleViewRef = ref => (this.view = ref);

  static propTypes = {
    position: PropTypes.oneOf(["fill", "absoluteFill", "absolute", "modal"]),
  };

  static defaultProps = {
    position: "fill",
  };

  @observable isVisible = false;
  @observable type = HUD_TYPE_LOADING;

  //toast
  @observable status = HUD_STATUS_SUCCESS;
  @observable text;
  @observable icon;

  @computed get animation() {
    switch (this.type) {
      case HUD_TYPE_LOADING:
        return { animation: "fadeIn", duration: 250 };
      case HUD_TYPE_TOAST:
      default:
        return { animation: "fadeInOut", duration: 1300 };
    }
  }

  @action showLoading() {
    this.type = HUD_TYPE_LOADING;
    this.isVisible = true;
  }

  @action async hideLoading() {
    if (this.type == HUD_TYPE_LOADING) {
      return this.dismiss();
    }
  }

  @action showAlert(text) {
    this.type = HUD_TYPE_ALERT;
    this.text = text;
    this.isVisible = true;
  }

  /**
   * Toast提示框
   * 可传入text, icon做定制化
   *
   * @param { HUD_STATUS_SUCCESS | HUD_STATUS_FAILED | HUD_STATUS_CUSTOM } [status=HUD_STATUS_SUCCESS]
   * @param {*} text
   * @param {*} icon
   * @memberof ProgressHUD
   */
  @action show(status = HUD_STATUS_SUCCESS, text, icon) {
    this.type = HUD_TYPE_TOAST;
    this.status = status;
    this.text = text;
    this.icon = icon;
    this.isVisible = true;
  }

  showSuccess(text) {
    this.show(HUD_STATUS_SUCCESS, text);
  }

  showFailed(text) {
    if (text instanceof Error && text.message) {
      text = text.message;
    }
    this.show(HUD_STATUS_FAILED, text);
  }

  @action async dismiss() {
    this.view && (await this.view.animate("fadeOut", 200));
    this.isVisible = false;
  }

  onAnimationEnd = endState => {
    if (!endState.finished) {
      return;
    }
    if (this.type != HUD_TYPE_LOADING && this.type !== HUD_TYPE_ALERT) {
      this.isVisible = false;
    }
  };

  render() {
    const { position, isVisible } = this.props;
    if (!this.isVisible && !isVisible) {
      return null;
    }

    if (this.type === HUD_TYPE_ALERT) {
      return (
        <MessageBox
          iconType={ICON_TYPE.WARNING}
          onOk={_ => (this.isVisible = false)}
          content={this.text}
          visible={this.isVisible}
          model={this.props.position !== "absolute"}
        />
      );
    }

    return position == "absoluteFill" || position === "modal" ? (
      <Modal
        isVisible={true}
        transparent={true}
        animationInTiming={1}
        animationOutTiming={1}
        backdropColor="transparent"
        useNativeDriver={true}
        hideModalContentWhileAnimating={true}>
        <Animatable.View
          ref={this.handleViewRef}
          animation={this.animation.animation}
          duration={this.animation.duration}
          onAnimationEnd={this.onAnimationEnd}
          style={styles.absoluteFill}
          useNativeDriver>
          {this.renderHUD()}
        </Animatable.View>
      </Modal>
    ) : (
      <Animatable.View
        ref={this.handleViewRef}
        animation={this.animation.animation}
        duration={this.animation.duration}
        onAnimationEnd={this.onAnimationEnd}
        style={[styles.fill]}
        useNativeDriver>
        {this.renderHUD()}
      </Animatable.View>
    );
  }
  renderHUD() {
    switch (this.type) {
      case "toast":
        return <Toast status={this.status} text={this.text} icon={this.icon} />;
      case "loading":
      default:
        return <Loading />;
    }
  }
}

const styles = StyleSheet.create({
  fill: {
    // Loading居中
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 9999,
  },
  absoluteFill: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 999,
  },
});

@observer
class Loading extends Component {
  render() {
    return (
      <View style={loadingStyles.container}>
        <Animatable.Image
          animation={"rotate"}
          iterationCount="infinite"
          easing="linear"
          style={[styles.circle]}
          source={require("@img/icon/loading-circle.png")}
          useNativeDriver
        />
        <Image style={loadingStyles.icon} source={require("@img/icon/loading-icon.png")} />
      </View>
    );
  }
}

const loadingStyles = StyleSheet.create({
  container: {
    width: 64,
    height: 64,
    backgroundColor: "#5B5E70",
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  circle: {
    width: 46,
    height: 46,
  },
  icon: {
    width: 28,
    height: 22,
    left: 20,
    position: "absolute",
  },
});

@observer
class Toast extends Component {
  @computed get imageSource() {
    if (this.props.icon) {
      return this.props.icon;
    }

    switch (this.props.status) {
      case "failed":
        return require("@img/icon/progress_hud_toast_failed.png");
      case "success":
      default:
        return require("@img/icon/progress_hud_toast_success.png");
    }
  }
  @computed get text() {
    if (this.props.text) {
      return this.props.text;
    }
    switch (this.props.status) {
      case "failed":
        return "失败";
      case "success":
        return "成功";
      default:
        return "";
    }
  }
  render() {
    return (
      <View style={toastStyles.main}>
        <Image source={this.imageSource} />
        <Text style={toastStyles.text}>{this.text}</Text>
      </View>
    );
  }
}

const toastStyles = StyleSheet.create({
  main: {
    paddingVertical: 20,
    paddingHorizontal: 16,
    width: 186,
    alignItems: "center",
    backgroundColor: "#434343",
    borderRadius: 6,
  },
  text: {
    marginTop: 6,
    fontSize: 14,
    lineHeight: 20,
    color: "#FFFFFF",
  },
});
