import Screen from "../Screen";
import { StyleSheet, View, Image, Text, ScrollView } from "react-native";
import Theme from "../../util/Theme";
import React, { Component } from "react";
import i18n from "../../module/i18n/i18n";
import { BIZ_SCOPE } from "../../module/i18n/const";

class MultisigFAQScreen extends Screen {
  static get screenID() {
    return "MultisigFAQScreen";
  }
  static get title() {
    return i18n.tt(BIZ_SCOPE.wallet, "coindetail-header-faq");
  }
  data = [
    {
      question: "为什么冻结数量大于转账数量",
      answer:
        "比特币是基于UTXO(未花费的交易)模型, 类似现实世界的纸钞。例如, 张三收到了两笔转账, 1BTC和2BTC, 这样他钱包里就有两张钞票, 一张面值1BTC, 另一张2BTC。由于一张钞票是不能分开花费的, 所以当他想转账1.5BTC时, 就需要把面值为2BTC的钞票发送到BTC网络上, 发送成功后可以收到一张0.5BTC的找零钞票。\n而在多签的场景下, 当一个用户发起授权时, 由于签名还不完整无法上链, 这时候需要把这张钞票冻结住, 等待其他人授权完毕, 才解锁并获得找零钞票。\n所以冻结数量 = 转账数 + 找零数 + 手续费, 他一定是大于转账数量的",
    },
    {
      question: "为什么USDT余额更新的不及时",
      answer: "USDT是基于BTC网络, 他的节点有一定延迟, 余额和交易更新会比BTC滞后一些, 延迟大约在10分钟以内",
    },
  ];
  render() {
    return (
      <View style={styles.container}>
        <ScrollView style={{ backgroundColor: "#fff", flex: 1, marginTop: 12 }}>
          {this.data.map((item, index) => (
            <View key={index}>
              <View style={styles.qaItem}>
                <View style={[styles.cell, { marginBottom: 8 }]}>
                  <Image style={styles.icon} source={require("@img/icon/question-icon.png")} />
                  <Text style={styles.qtext}>{item.question}</Text>
                </View>
                <View style={[styles.cell, { paddingLeft: 22 }]}>
                  <Text style={styles.atext}>{item.answer}</Text>
                </View>
              </View>
              {index < this.data.length - 1 && (
                <View style={{ marginHorizontal: 20 }}>
                  <Image
                    style={{ width: "100%", resizeMode: "cover" }}
                    source={require("@img/icon/dotted-line-thin.png")}
                  />
                </View>
              )}
            </View>
          ))}
        </ScrollView>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Theme.backgroundColor,
  },
  borderBottom: {
    borderBottomColor: Theme.borderColor,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  qaItem: {
    paddingVertical: 30,
    marginHorizontal: 20,
  },
  cell: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  icon: {
    marginRight: 6,
    width: 16,
    height: 16,
  },
  qtext: {
    flex: 1,
    fontSize: 13,
    color: "#000",
  },
  atext: {
    flex: 1,
    lineHeight: 20,
    fontSize: 13,
    color: "#666666",
  },
});
export default MultisigFAQScreen;
