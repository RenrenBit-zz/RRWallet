import React from "react";
import { StyleSheet, ScrollView, View, Text, Image, TouchableHighlight } from "react-native";
import Screen from "../Screen";
import Theme from "../../util/Theme";

import ProgressHUD from "../../component/common/ProgressHUD";
import i18n from "../../module/i18n/i18n";
import { observer } from "mobx-react";
import { computed } from "mobx";
import MultiSender from "../../module/multi-sender";

@observer
export default class SelectCoinScreen extends Screen {
  @computed get coins() {
    return MultiSender.coins;
  }

  async onCoinPress(item) {
    if (item.balance <= 0) {
      this.hud && this.hud.showFailed(item.name + i18n.t("qunfabao-token-not-enough"));
      return;
    }
    try {
      this.hud && this.hud.showLoading();
      let r = await MultiSender.createTask(item.id);
      if (r && r.data && r.data.taskUUID) {
        let data = r.data;
        this.props.navigator.push({
          screen: "MultiSenderTaskExecutorScreen",
          passProps: {
            taskUUID: data.taskUUID,
            coinID: item.id,
          },
        });
        this.hud && this.hud.dismiss();
      } else {
        this.hud && this.hud.showFailed(i18n.t("qunfabao-task-create-error"));
      }
    } catch (error) {
      this.hud && this.hud.showFailed(i18n.t("qunfabao-task-create-error"));
    }
  }

  render() {
    return (
      <View style={styles.container}>
        <ProgressHUD ref={ref => (this.hud = ref)} />
        <ScrollView>
          <View
            style={{
              marginTop: 12,
              // paddingHorizontal: 16,
              backgroundColor: "#fff",
            }}>
            {this.coins.map((item, index) => {
              return (
                <TouchableHighlight underlayColor="#f4f4f4" onPress={this.onCoinPress.bind(this, item)} key={item.id}>
                  <View style={itemStyles.wrap}>
                    <View style={itemStyles.leftWrap}>
                      <Image
                        style={itemStyles.coin}
                        resizeMode={"cover"}
                        source={{
                          uri: item.icon || "https://resource.kanquanbu.com/dcash/coin/default.png",
                        }}></Image>
                    </View>
                    <View
                      style={[
                        itemStyles.switchWrap,
                        index == this.coins.length - 1 && {
                          borderBottomWidth: 0,
                        },
                      ]}>
                      <View style={{ flex: 1 }}>
                        <Text style={itemStyles.name}>{item.name}</Text>
                        <Text style={itemStyles.balance}>
                          {i18n.t("qunfabao-remain-balance")}：
                          <Text style={{ fontFamily: Theme.alphanumericFontFamily }}>{item.balance}</Text>
                        </Text>
                      </View>
                      <View style={{ paddingRight: 16 }}>
                        <Image source={require("@img/qunfabao/icon_arrow.png")}></Image>
                      </View>
                    </View>
                  </View>
                </TouchableHighlight>
              );
            })}
          </View>
        </ScrollView>
      </View>
    );
  }
}

const itemStyles = StyleSheet.create({
  wrap: {
    alignItems: "center",
    flexDirection: "row",
  },
  leftWrap: {
    alignItems: "center",
    flexDirection: "row",
    paddingLeft: 16,
    paddingRight: 12,
  },
  coin: {
    width: 36,
    height: 36,
  },
  name: {
    fontSize: 16,
    lineHeight: 16,
    color: "#000",
    fontWeight: "500",
  },
  switchWrap: {
    flex: 1,
    flexDirection: "row",
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: "#eee",
    paddingVertical: 20,
    alignItems: "center",
  },
  balance: {
    color: "#A7A7A7",
    fontSize: 12,
    lineHeight: 12,
    paddingTop: 6,
  },
});

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#f5f5f5",
    height: "100%",
  },
});
