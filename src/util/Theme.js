import { TouchableHighlight, Platform, Switch, StyleSheet, TextInput, Text, RefreshControl } from "react-native";
import React from "react";
import { Button } from "react-native-elements";
import { ActionSheetCustom as ActionSheet } from "react-native-actionsheet";
import i18n from "../module/i18n/i18n";
class Theme {
  primaryColor = "#005DBD";
  navigationBarBackgroundColor = "#FFFFFF";
  selectedTabIconColor = "#007AFF";
  tabIconColor = "#BCBFD1";
  mineIconColor = "#40D19E";
  backgroundColor = "#F5F5F5";
  underlayColor = "#F4F4F4";
  noticeColor = "#FEA900";
  disabledColor = "#CCCCCC";
  navigatorStyle = {
    ...defaultNavigatorStyle,
  };
  navigatorStyleNoShadow = {
    ...defaultNavigatorStyle,
  };
  highlightColor = "#F4F4F4";
  textColor = {
    primary: "#000000", // 主色           100%
    mainTitle: "#A7A7A7", // 正文         74%
    minorTitle1: "#9095B3", // 辅文案一    50%
    minorTitle2: "#AFB3C8", // 辅文案二    36%
    patchTitle: "#D7D9E4", // 暗提示       18%
    light: "#A0C0E6", //浅底色文字
    placeHolder: "#CCCCCC",
  };

  fontWeight = {
    regular: "400",
    medium: "500",
    semibold: "700",
  };
  brandColor = "#007AFF"; // 品牌色
  // linkColor = '#157CF8' // 链接颜色
  assistColor_red = "#EB4E3D"; // 辅文字|按钮颜色
  assistColor_green = "#3DC452"; // 辅文字|按钮颜色
  bgColor = "#F5F5F5"; // 底背景

  iconColor = "#BCBFD3"; // icon 颜色
  borderColor = "#EEEEEE"; // 边框颜色
  linkColor = "#007AFF";

  white = "#FFFFFF";
  shadow = {
    shadowRadius: 6,
    shadowOpacity: 0.05,
    shadowColor: "#27347D",
    shadowOffset: {
      h: 1,
      w: 0,
    },
    elevation: 1,
  };

  riseColor = "#3EB78A"; // 涨的颜色(绿)
  fallColor = "#EB4E3D"; // 跌的颜色(红)
  flatColor = "#C7C7C7"; // 平

  buyColor = "#3EB78A";
  sellColor = "#EB4E3D";

  creditTradeColor = "#FF801A"; // 借贷中用到的橘黄色色
  alphanumericFontFamily = Platform.select({
    ios: "Helvetica Neue",
    android: "Helvetica Neue",
  });
  bigNumberFontFamily = Platform.select({
    ios: "DIN Alternate",
    android: "DIN Alternate_bold",
  });
  business = {
    hd: "#343442",
    cloud: this.brandColor,
    multiSig: "#5050ff",
  };
}

const defaultNavigatorStyle = {
  navBarTextColor: "#000",
  navBarButtonColor: "#333333",
  navBarTextFontSize: 18,
  navBarBackgroundColor: "#FFFFFF",
  navBarTextFontFamily: "PingFangSC-Medium",
  statusBarTextColorScheme: Platform.select({
    ios: "dark",
    android: "light",
  }),
  navBarNoBorder: true,
  topBarElevationShadowEnabled: false,
  navBarTitleTextCentered: true,
  navBarSubTitleTextCentered: true,
  statusBarColor: "#000000",
  navBarTextFontBold: true,
  screenBackgroundColor: "#F5F5F5",
  modalPresentationStyle: "fullScreen",
};

const navigatorShadowStyle = {
  topBarElevationShadowEnabled: true,
  topBarShadowColor: "rgba(0, 0, 0, 0.3)",
  topBarShadowOffset: -2,
  topBarShadowRadius: 10,
};
const theme = new Theme();

if (!TouchableHighlight.defaultProps) {
  TouchableHighlight.defaultProps = {};
}
TouchableHighlight.defaultProps.activeOpacity = 1;
TouchableHighlight.defaultProps.underlayColor = theme.underlayColor;

if (!Button.defaultProps) {
  Button.defaultProps = {};
}
Button.defaultProps.disabledStyle = { backgroundColor: "#CCCCCC" };
Button.defaultProps.disabledTitleStyle = { color: "#fff" };
Button.defaultProps.buttonStyle = {
  height: 50,
  backgroundColor: theme.brandColor,
  borderRadius: 3,
  elevation: 0,
};

Button.defaultProps.titleStyle = {
  fontSize: 18,
  color: "#FFFFFF",
};
if (!Switch.defaultProps) {
  Switch.defaultProps = {};
}
Switch.defaultProps.trackColor = theme.borderColor;
Switch.defaultProps.style = Platform.select({
  ios: {
    transform: [{ scaleX: 0.9 }, { scaleY: 0.9 }],
  },
});

if (!ActionSheet.defaultProps) {
  ActionSheet.defaultProps = {};
}
ActionSheet.defaultProps.styles = {
  buttonBox: {
    height: 50,
    borderTopColor: theme.borderColor,
    borderTopWidth: StyleSheet.hairlineWidth,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff",
  },
  messageText: {
    fontSize: 28,
    color: "red",
  },
};

if (!TextInput.defaultProps) {
  TextInput.defaultProps = {};
}
// TextInput.defaultProps.underlineColorAndroid = 'transparent'
TextInput.defaultProps.placeholderTextColor = theme.textColor.placeHolder;
TextInput.defaultProps = Object.assign({}, TextInput.defaultProps, { allowFontScaling: false });

if (!Text.defaultProps) {
  Text.defaultProps = {};
}
Text.defaultProps = Object.assign({}, Text.defaultProps, { allowFontScaling: false });

if (Platform.OS === "android") {
  const defaultFontFamily = {
    ...Platform.select({
      android: { fontFamily: "Roboto" },
    }),
  };

  const oldRender = Text.render;
  Text.render = function(...args) {
    const origin = oldRender.call(this, ...args);
    return React.cloneElement(origin, {
      style: [defaultFontFamily, origin.props.style],
    });
  };
}

if (!RefreshControl.defaultProps) {
  RefreshControl.defaultProps = {};
}
RefreshControl.defaultProps.tintColor = "#FFFFFF";
RefreshControl.defaultProps.colors = ["#f00", "#0f0", "#00f"];
RefreshControl.defaultProps.progressBackgroundColor = "#FFFFFF";
RefreshControl.defaultProps.title = i18n.t("common-loading");
RefreshControl.defaultProps.titleColor = "#FFFFFF";

export default theme;
