import React, { Component } from "react";
import { StyleSheet, View, Image, Text, TouchableHighlight, Animated } from "react-native";
import theme from "../../util/Theme";
import { padding } from "../../util/UIAdapter";
import AppInfo from "./AppInfo";
import ProgressHUD from "../../component/common/ProgressHUD";
import logger from "../../util/logger";
import { Navigation } from "react-native-navigation";
import i18n from "../i18n/i18n";
import LinearGradient from "react-native-linear-gradient";
import device from "../../util/device";
import { observer } from "mobx-react";
import { computed, observable } from "mobx";
import _ from "lodash";

const CARD_WIDTH = 330;
const STATUS_START = 0;
const STATUS_UPDATING = 1;
@observer
export default class AppUpdateModal extends Component {
  progress = new Animated.Value(0);
  @observable status = STATUS_START;
  @computed get showProgress() {
    // return true
    return device.isAndroid && this.status == STATUS_UPDATING;
  }
  constructor(props) {
    super(props);
  }

  render() {
    const { force } = this.props;
    return (
      <View style={styles.main}>
        <Image style={styles.rocket} source={require("@img/mine/app_update.png")} />
        <View style={styles.card}>
          <Text style={styles.version}>
            {i18n.common("update-new-version")} {this.props.version}
          </Text>
          <Text style={styles.content}>{this.props.content}</Text>
          {this.renderButton()}
          <ProgressHUD ref={ref => (this.hud = ref)} />
        </View>
        {!force && (
          <TouchableHighlight activeOpacity={0.6} underlayColor="transparent" onPress={this.onCancelButtonPress}>
            <Image style={styles.close} source={require("@img/mine/icon_pic_close.png")} />
          </TouchableHighlight>
        )}
      </View>
    );
  }
  renderButton = () => {
    if (this.showProgress) {
      const width = this.progress.interpolate({
        inputRange: [0, 1],
        outputRange: ["0%", "100%"],
      });
      return (
        <View style={styles.progressContainer}>
          <View style={styles.progressPlaceholder}>
            <Animated.View style={[styles.progress, { width }]}>
              <LinearGradient
                colors={["#3957FF", "#00B7FF"]}
                start={{ x: 0, y: 1 }}
                style={styles.progressLinear}
                end={{ x: 1, y: 0 }}
              />
            </Animated.View>
          </View>
          <Text style={styles.progressText}>{i18n.common("update-downloading")}</Text>
        </View>
      );
    }
    return (
      <TouchableHighlight activeOpacity={0.6} underlayColor="transparent" onPress={this.onUpdateButtonPress}>
        <LinearGradient
          colors={["#3957FF", "#00B7FF"]}
          start={{ x: 0, y: 0 }}
          style={styles.update}
          end={{ x: 1, y: 1 }}>
          <View style={styles.buttonWrap}>
            <Text style={styles.buttonTitle}>{i18n.common("update-start")}</Text>
          </View>
        </LinearGradient>
      </TouchableHighlight>
    );
  };

  onProgressChange = _.throttle(progress => {
    if (this.status !== STATUS_UPDATING) {
      return;
    }
    Animated.timing(this.progress, {
      toValue: Math.max(Math.min(progress, 1), 0),
      duration: 550,
    }).start();
  }, 400);

  onCancelButtonPress = async () => {
    Navigation.dismissLightBox();
  };
  onUpdateButtonPress = async () => {
    this.status = STATUS_UPDATING;
    try {
      device.isIOS && this.hud && this.hud.showLoading();
      await AppInfo.install(this.props.downloadUrl, this.onProgressChange);
    } catch (error) {
      this.reset();
      logger.error(error);
      this.hud && this.hud.showFailed(error.message);
    }
  };
  reset = () => {
    this.progress.setValue(0);
    this.status = STATUS_START;
  };
}

const styles = StyleSheet.create({
  main: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "transparent",
  },
  card: {
    position: "relative",
    top: -2,
    width: CARD_WIDTH,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderBottomLeftRadius: 10,
    borderBottomRightRadius: 10,
    overflow: "hidden",
    paddingBottom: 30,
  },
  wave: {
    position: "absolute",
    top: 0,
  },
  rocket: {
    marginTop: 20,
  },
  version: {
    marginTop: padding(14),
    color: theme.textColor.primary,
    fontWeight: theme.fontWeight.medium,
    fontSize: 18,
  },
  content: {
    paddingHorizontal: padding(20),
    marginTop: padding(16),
    width: "100%",
    color: "#333333",
    fontSize: 13,
    lineHeight: 20,
  },
  update: {
    marginTop: 20,
    width: 160,
    height: 46,
    borderRadius: 23,
  },
  buttonContainer: {
    flex: 1,
  },
  buttonStyle: {
    height: 50,
    backgroundColor: "transparent",
    elevation: 0,
  },
  buttonTitle: {
    fontSize: 17,
    color: "#FFFFFF",
  },
  buttonWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  group: {
    flexDirection: "row",
  },
  separator: {
    height: "100%",
    width: StyleSheet.hairlineWidth,
    backgroundColor: theme.borderColor,
  },
  topSeparator: {
    marginTop: padding(11),
    width: "100%",
    height: StyleSheet.hairlineWidth,
    backgroundColor: theme.borderColor,
  },
  close: {
    marginTop: 30,
  },
  progressContainer: {
    marginTop: 28,
    width: "100%",
    alignItems: "center",
  },
  progressPlaceholder: {
    width: CARD_WIDTH - 40,
    marginHorizontal: 20,
    height: 12,
    borderRadius: 22,
    backgroundColor: "#F1F2F7",
  },
  progressText: {
    marginTop: 13,
    fontSize: 13,
    color: theme.textColor.mainTitle,
  },
  progressLinear: {
    height: 12,
    width: device.windowSize.width,
  },
  progress: {
    height: 12,
    borderRadius: 22,
    width: "100%",
    overflow: "hidden",
  },
});
