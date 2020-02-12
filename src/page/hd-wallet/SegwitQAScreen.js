import React, { Component } from "react";
import Screen from "../Screen";
import { StyleSheet, View, ScrollView, Text } from "react-native";
import theme from "../../util/Theme";
import i18n from "../../module/i18n/i18n";
import { BIZ_SCOPE } from "../../module/i18n/const";

class SegwitQAScreen extends Screen {
  static get screenID() {
    return "SegwitQAScreen";
  }
  render() {
    return (
      <ScrollView style={styles.main} bounces={false}>
        <View style={styles.barrier} />
        <View style={styles.titleWrap}>
          <View style={styles.tag} />
          <Text style={styles.title}>{i18n.tt(BIZ_SCOPE.wallet, "segwitqa-section1-title")}</Text>
        </View>
        <Text style={styles.desc}>{i18n.tt(BIZ_SCOPE.wallet, "segwitqa-section1-desc1")}</Text>
        <Text style={styles.desc}>{i18n.tt(BIZ_SCOPE.wallet, "segwitqa-section1-desc2")}</Text>
        <Text style={styles.desc}>{i18n.tt(BIZ_SCOPE.wallet, "segwitqa-section1-desc3")}</Text>
        <View style={styles.titleWrap}>
          <View style={styles.tag} />
          <Text style={styles.title}>{i18n.tt(BIZ_SCOPE.wallet, "segwitqa-section2-title")}</Text>
        </View>
        <Text style={styles.desc}>{i18n.tt(BIZ_SCOPE.wallet, "segwitqa-section2-desc1")}</Text>
        <View style={styles.titleWrap}>
          <View style={styles.tag} />
          <Text style={styles.title}>{i18n.tt(BIZ_SCOPE.wallet, "segwitqa-section3-title")}</Text>
        </View>
        <Text style={[styles.adv, { marginTop: 7 }]}>{i18n.tt(BIZ_SCOPE.wallet, "segwitqa-section3-desc1")}</Text>
        <Text style={styles.adv}>{i18n.tt(BIZ_SCOPE.wallet, "segwitqa-section3-desc2")}</Text>
        <Text style={styles.adv}>{i18n.tt(BIZ_SCOPE.wallet, "segwitqa-section3-desc3")}</Text>
      </ScrollView>
    );
  }
}

const styles = StyleSheet.create({
  main: {
    backgroundColor: "#FFFFFF",
  },
  barrier: {
    height: 13,
    backgroundColor: theme.backgroundColor,
  },
  titleWrap: {
    marginHorizontal: 20,
    marginTop: 30,
    flexDirection: "row",
    alignItems: "center",
    height: 18,
  },
  tag: {
    width: 3,
    borderRadius: 1.5,
    height: 15,
    backgroundColor: theme.linkColor,
  },
  title: {
    marginLeft: 6,
    fontSize: 16,
    fontWeight: theme.fontWeight.medium,
    color: theme.textColor.primary,
  },
  desc: {
    marginTop: 10,
    marginHorizontal: 20,
    fontSize: 13,
    lineHeight: 24,
    color: "#666666",
  },
  adv: {
    marginHorizontal: 20,
    fontSize: 14,
    lineHeight: 29,
    fontWeight: theme.fontWeight.medium,
  },
});

export default SegwitQAScreen;
