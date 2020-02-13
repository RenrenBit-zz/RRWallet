import React from "react";
import { StyleSheet, View, Text, Image, ScrollView, Linking, Clipboard, TouchableOpacity } from "react-native";

import Screen from "../Screen";
import Cell from "../../component/common/Cell";

import AppInfo from "../../module/app/AppInfo";
import device, { installID } from "../../util/device";
import { observer } from "mobx-react";
import theme from "../../util/Theme";
import i18n from "../../module/i18n/i18n";
import ProgressHUD from "../../component/common/ProgressHUD";
import { pushToken } from "../../module/notification/notification";
@observer
export default class AboutScreen extends Screen {
  static get screenID() {
    return "AboutScreen";
  }

  updateVersion = async () => {
    this.hud.showLoading();
    const res = await AppInfo.checkUpdate();
    this.hud.hideLoading();

    if (!res) {
      this.hud.showSuccess(i18n.t("mine-already-upgrade"));
    }
  };

  copy(data) {
    Clipboard.setString(data);
    this.hud.showSuccess(i18n.t("common-copy-success"));
  }

  goPolicy = () => {
    this.goPlicyOrDisclaimer({
      title: "RenrenBit用户服务协议",
      path: "#/policy",
    });
  };

  goDisclaimer = () => {
    this.goPlicyOrDisclaimer({
      title: "RenrenBit隐私协议",
      path: "#/disclaimer",
    });
  };

  goPlicyOrDisclaimer = param => {
    let { path = "", title = "" } = param;
    this.props.navigator.push({
      screen: "Webview",
      title: title,
      passProps: {
        url: "https://resource.kanquanbu.com/tfs/renrenbit-pc/index.html" + path,
      },
    });
  };

  render() {
    return (
      <View style={{ flex: 1, backgroundColor: "#fff" }}>
        <ScrollView style={styles.container}>
          <View style={styles.wrap}>
            <View style={styles.titleWrap}>
              <View>
                <Image style={styles.logo} source={require("@img/icon/rrwallet-logo.png")} />
                <Text style={styles.title}>RRWallet</Text>
              </View>
            </View>

            <View style={styles.contentWrap}>
              <Cell
                title="设备号"
                detail={installID}
                onPress={this.copy.bind(this, installID)}
                hideRightArrow={false}
                bottomBorder={true}
              />
              <Cell
                title="Push Token"
                detail={pushToken}
                onPress={this.copy.bind(this, pushToken)}
                hideRightArrow={false}
                bottomBorder={true}
              />
              <Cell title="Commit ID" detail={AppInfo.commitId} onPress={this.copy.bind(this, AppInfo.commitId)} />
              <Cell
                title={i18n.t("mine-version-update")}
                rightNode={
                  <View style={{ flexDirection: "row", alignItems: "center" }}>
                    {AppInfo.hasNewerVersion && <View style={styles.redDot} />}
                    <Text style={styles.grayText}>
                      {AppInfo.version}({AppInfo.jsVersion})
                    </Text>
                  </View>
                }
                onPress={this.updateVersion}
              />
            </View>
            <ProgressHUD ref={ref => (this.hud = ref)} />
          </View>
        </ScrollView>
        <View style={{ alignItems: "center", paddingBottom: device.safeArea.bottom }}>
          <View style={{ flexDirection: "row" }}>
            <TouchableOpacity hitSlop={{ left: 10, top: 20, bottom: 20, right: 10 }} onPress={this.goPolicy}>
              <Text style={{ fontSize: 11, color: theme.linkColor }}>{i18n.t("mine-policy")}</Text>
            </TouchableOpacity>
            <Text style={{ fontSize: 11, color: "#000" }}>&nbsp;{i18n.t("mine-and")}&nbsp;</Text>
            <TouchableOpacity hitSlop={{ left: 10, top: 20, bottom: 20, right: 10 }} onPress={this.goDisclaimer}>
              <Text style={{ fontSize: 11, color: theme.linkColor }}>{i18n.t("mine-disclaimer")}</Text>
            </TouchableOpacity>
          </View>
          <Text style={{ fontSize: 9, color: "#A7A7A7", marginTop: 11 }}>© 2019 RENRENBIT PTE. LTD.</Text>
        </View>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    borderTopColor: theme.borderColor,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  wrap: {},
  titleWrap: {
    paddingHorizontal: 16,
  },
  logo: {
    marginTop: 47,
    alignSelf: "center",
    borderRadius: 13,
  },
  title: {
    marginTop: 16,
    marginBottom: 30,
    fontSize: 30,
    color: theme.textColor.primary,
    textAlign: "center",
    fontWeight: theme.fontWeight.medium,
  },
  grayText: {
    color: theme.textColor.mainTitle,
    fontSize: 16,
  },
  redDot: {
    backgroundColor: theme.assistColor_red,
    borderRadius: 4,
    width: 8,
    height: 8,
    marginRight: 8,
  },
});
