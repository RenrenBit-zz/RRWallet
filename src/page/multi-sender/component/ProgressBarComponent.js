import React, { Component } from "react";
import { StyleSheet, View, Text } from "react-native";
import Theme from "../../../util/Theme";
import i18n from "../../../module/i18n/i18n";

export default class ProgressBarComponent extends Component {
  calcProgress() {
    let item = this.props.data;
    let recordCount = item.recordCount;
    let personCount = item.personCount;
    if (recordCount == 0) {
      return 0;
    } else if (personCount) {
      return recordCount / personCount;
    }
    return 0;
  }

  getTextColor() {
    let textColor = "#FEA900";
    let progress = this.calcProgress();
    if (progress >= 1) {
      textColor = "#7ED321";
    }
    return textColor;
  }

  getStatusTpl(item) {
    let text = i18n.t("qunfabao-task-status-txt-1");
    let textColor = this.getTextColor();
    if (item.recordCount) {
      if (item.personCount <= item.recordCount) {
        text = i18n.t("qunfabao-task-status-txt-2");
      } else if (item.recordCount < item.personCount) {
        text = i18n.t("qunfabao-task-status-txt-3");
      }
    }
    return (
      <Text
        style={[
          styles.statusText,
          {
            color: textColor,
          },
        ]}>
        {text}
      </Text>
    );
  }

  render() {
    let item = this.props.data;
    let textColor = this.getTextColor();
    let progress = this.calcProgress();

    return (
      <View style={styles.progressContainer}>
        <Text
          style={{
            fontSize: 14,
            color: textColor,
          }}>
          {i18n.t("qunfabao-has-send-amount")}:{" "}
          <Text style={{ fontFamily: Theme.alphanumericFontFamily }}>{item.sendedAmount || 0}</Text>
        </Text>
        <View
          style={{
            paddingVertical: 8,
          }}>
          <View style={styles.progressBarContainer}>
            <View style={[styles.progressBar, { width: progress * 100 + "%", backgroundColor: textColor }]} />
          </View>
        </View>
        <View
          style={{
            flexDirection: "row",
            paddingTop: 6,
          }}>
          <Text
            style={{
              fontSize: 12,
              color: Theme.textColor.mainTitle,
            }}>
            <Text style={{ fontFamily: Theme.alphanumericFontFamily, color: textColor }}>{item.recordCount || 0}/</Text>
            <Text style={{ fontFamily: Theme.alphanumericFontFamily }}>
              {item.personCount || 0}
              {i18n.t("qunfabao-recipient-unit")}
            </Text>
          </Text>
          <Text style={styles.statusText}>{this.getStatusTpl(item)}</Text>
        </View>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  progressContainer: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    paddingBottom: 20,
  },
  progressBarContainer: {
    width: "100%",
    height: 8,
    borderRadius: 4,
    backgroundColor: "#F5F5F5",
    overflow: "hidden",
  },
  progressBar: {
    height: 8,
  },
  statusText: {
    flex: 1,
    textAlign: "right",
    color: "#FEA900",
    fontSize: 12,
  },
});
