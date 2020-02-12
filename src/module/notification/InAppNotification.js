import React, { Component, PureComponent } from "react";
import { View, StyleSheet, Text, TouchableWithoutFeedback, Image, Platform } from "react-native";
import device from "../../util/device";
import moment from "moment";
import theme from "../../util/Theme";
import { MSG_TYPE_ID } from "../msg-center/MessageCenter";
import { deepLinkIfNeed, markPayloadClicked } from "./notificationHandler";
import i18n from "../i18n/i18n";

class InAppNotification extends PureComponent {
  static get screenID() {
    return "InAppNotification";
  }
  get typeIcon() {
    switch (this.props.payload.bizType) {
      case MSG_TYPE_ID.wallet:
        return require("@img/mine/msg/msg_type_wallet.png");
      case MSG_TYPE_ID.borrow:
        return require("@img/mine/msg/msg_multisig.png");
    }
  }
  onPress = () => {
    let { link, payload } = this.props;
    payload = { ...payload };
    markPayloadClicked(payload);
    deepLinkIfNeed(link, payload);
    this.props.navigator.dismissInAppNotification();
  };
  render() {
    const { title, content, time } = this.props.payload;
    return (
      <TouchableWithoutFeedback onPress={this.onPress}>
        <View>
          <View style={styles.main}>
            <Image source={this.typeIcon} style={styles.iconWrap} />
            <View style={styles.container}>
              <Text style={styles.title} numberOfLines={2}>
                {title}
              </Text>
              <Text style={styles.content} numberOfLines={4}>
                {content}
              </Text>
              <View style={styles.row}>
                <Text style={styles.date}>{moment(time).format("MM/DD/YYYY HH:mm:ss")}</Text>
                <Text style={styles.detail}>{i18n.t("common-view-detail")}</Text>
              </View>
            </View>
          </View>
          <Image source={require("@img/mine/msg/notification_shadow.png")} style={styles.shadow} />
        </View>
      </TouchableWithoutFeedback>
    );
  }
}

const styles = StyleSheet.create({
  main: {
    backgroundColor: "#FFFFFF",
    paddingTop: Platform.select({
      ios: 24 + (device.isIPhoneX ? 24 : 0),
      android: 14,
    }),
    paddingBottom: 16,
    paddingHorizontal: 20,
    width: device.windowSize.width,
    flexDirection: "row",
  },
  container: {
    flex: 1,
    marginLeft: 7,
    marginTop: 3,
  },
  title: {
    fontSize: 16,
    color: theme.textColor.primary,
    fontWeight: theme.fontWeight.medium,
  },
  content: {
    marginTop: 6,
    fontSize: 14,
    lineHeight: 20,
    color: theme.textColor.primary,
  },
  date: {
    fontSize: 14,
    color: theme.textColor.mainTitle,
    fontFamily: theme.alphanumericFontFamily,
  },
  row: {
    marginTop: 6,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  detail: {
    color: theme.linkColor,
    fontSize: 12,
  },
  iconWrap: {
    height: 24,
    width: 24,
  },
  shadow: {
    width: "100%",
  },
});

export default InAppNotification;
