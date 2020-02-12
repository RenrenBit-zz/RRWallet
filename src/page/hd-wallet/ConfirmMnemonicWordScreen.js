import React, { Component } from "react";
import { StyleSheet, View, Text, ScrollView, TouchableHighlight, Dimensions } from "react-native";
import { Button } from "react-native-elements";
import _ from "lodash";
import Theme from "../../util/Theme";
import Footer from "../../component/common/Footer";
import { observer } from "mobx-react";
import { observable } from "mobx";
import Screen from "../Screen";
import { padding } from "../../util/UIAdapter";
import theme from "../../util/Theme";
import AccountStore from "../../module/wallet/account/AccountStore";
import ProgressHUD from "../../component/common/ProgressHUD";
import i18n from "../../module/i18n/i18n";

const { height, width } = Dimensions.get("window");

const sampleSize = 3;
const margin = 16;
const spacing = 16;
const itemWidth = Math.ceil((width - margin * 2 - spacing * (sampleSize - 1)) / sampleSize);
@observer
export default class ConfirmMnemonicWordScreen extends Screen {
  static get screenID() {
    return "ConfirmMnemonicWord";
  }

  @observable shuffIndex = Array(12).fill(false);
  @observable sampleIndex = [];
  account = AccountStore.defaultHDAccount;
  sample = [];
  selectedIndex = new Set();
  testIDs = [];
  state = {
    words: [],
    shuffWords: [],
  };

  constructor(props) {
    super(props);
    var words = props.mnemonicWord;
    this.state = {
      shuffWords: _.shuffle(words),
      words: words,
    };
    this.sample = _.sampleSize(words, sampleSize);
    this.sampleIndex = this.sample.map(s => {
      return {
        index: words.indexOf(s),
        word: "",
      };
    });
    // alert(JSON.stringify(this.state.shuffleWords))
  }
  render() {
    return [
      <ScrollView style={styles.container} alignItems="center">
        <Text style={styles.desc}>让我们验证您备份的助记词</Text>
        <Text style={[styles.note, { marginTop: padding(16) }]}>请从下方列表中，选择每个位置的正确单词。</Text>
        <View style={styles.wordContainer}>
          {this.sampleIndex.map((word, index) => {
            return (
              <View>
                <TouchableHighlight
                  activeOpacity={0.6}
                  underlayColor="transparent"
                  onPress={() => this.selectedWordOnPress(this, index, word)}>
                  <View style={[styles.wordwrap, word.word && { backgroundColor: Theme.linkColor }]}>
                    <Text
                      key={index}
                      style={[styles.word, { color: "#FFFFFF" }]}
                      numberOfLines={1}
                      ellipsizeMode="middle">
                      {word.word}
                    </Text>
                  </View>
                </TouchableHighlight>
                <Text style={[styles.word, { marginTop: 14 }]}>第{word.index + 1}位</Text>
              </View>
            );
          })}
        </View>
        <View style={styles.shuffleContainer}>
          {this.state.shuffWords.map((word, index) => (
            <TouchableHighlight
              activeOpacity={0.6}
              underlayColor="transparent"
              onPress={() => this.shuffleWordOnPress(this, index)}>
              <View style={styles.shuffleWordWrap}>
                <Text key={index} style={styles.word}>
                  {word}
                </Text>
              </View>
            </TouchableHighlight>
          ))}
        </View>
        <ProgressHUD ref={ref => (this.hud = ref)} />
      </ScrollView>,
      <Footer>
        <Button
          title="确定"
          onPress={this.nextButtonOnPress.bind(this)}
          containerStyle={styles.nextButtonContainer}
          buttonStyle={styles.nextButton}
        />
      </Footer>,
    ];
  }
  shuffleWordOnPress(t, i) {
    const word = this.state.shuffWords[i];
    const sample = this.sampleIndex.find(s => s.word.length == 0);
    if (sample) {
      sample.word = word;
    }
  }
  selectedWordOnPress(t, i, sample) {
    sample.word = "";
  }

  nextButtonOnPress() {
    // if (this.selectedIndex.size != 12) {
    //     Alert.alert ('','助记词未填写完成')
    //     return
    // }

    let input = this.sampleIndex.map(s => s.word).join(" ");
    let sample = this.sample.join(" ");
    if (input != sample) {
      this.hud && this.hud.showFailed(i18n.t("wallet-backup-tip-failed"));
      return;
    }
    this.account.hasBackup = true;
    this.hud && this.hud.showSuccess(i18n.t("wallet-backup-tip-success"));
    setTimeout(() => {
      this.props.navigator.popToRoot();
    }, 1.5 * 1000);
  }
}

const wordwrap = {
  backgroundColor: "#FFFFFF",
  borderRadius: 3,
  paddingVertical: 10,
  width: itemWidth,
  height: 36,
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 16,
    backgroundColor: Theme.backgroundColor,
  },
  card: {
    marginTop: padding(20),
    padding: padding(16),
    backgroundColor: "#FFFFFF",
  },
  note: {
    fontSize: 12,
    color: "#A7A7A7",
    lineHeight: 17,
    textAlign: "center",
  },
  desc: {
    fontSize: 16,
    lineHeight: 22,
    letterSpacing: 0.47,
    color: Theme.textColor.primary,
    textAlign: "center",
    fontWeight: "500",
    marginTop: 40,
  },
  wordContainer: {
    marginTop: padding(16),
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  word: {
    fontSize: 14,
    textAlign: "center",
    fontWeight: theme.fontWeight.medium,
    color: Theme.textColor.primary,
    fontFamily: Theme.alphanumericFontFamily,
  },
  index: {},
  wordwrap: wordwrap,
  shuffleContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginTop: padding(68),
  },
  shuffleWordWrap: {
    ...wordwrap,
    paddingVertical: 10,
    marginVertical: 6,
  },
  nextButtonContainer: {
    flex: 1,
  },
  nextButton: {
    height: 50,
    backgroundColor: Theme.brandColor,
    elevation: 0,
  },
});
