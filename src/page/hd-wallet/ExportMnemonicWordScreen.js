import React, { Component } from "react";
import { View, Text, StyleSheet, Image, Dimensions, Platform, BackHandler, ScrollView } from "react-native";
import { Button } from "react-native-elements";
import Screen from "../Screen";
import Footer from "../../component/common/Footer";
import theme from "../../util/Theme";
import { padding, manualPadding } from "../../util/UIAdapter";
import ScreenShotWarningModal from "./component/ScreenShotWarningModal";
import { Navigation } from "react-native-navigation";
import PrintMnemonicWord from "./print";
import _ from "lodash";
import { computed } from "mobx";

const { height, width } = Dimensions.get("window");
const spacing = padding(16);
const itemWidth = Math.floor((width - spacing * 4) / 3);
export default class ExportMnemonicWordScreen extends Screen {
  static get screenID() {
    return "ExportMnemonicWord";
  }
  @computed get isBackup() {
    return this.props.type != "display";
  }
  state = {
    words: [],
    warningModal: true,
  };

  constructor(props) {
    super(props);
    this.state = {
      words: (_.isString(props.mnemonicWord) && props.mnemonicWord.split(" ")) || props.mnemonicWord,
      warningModal: true,
    };
    this.props.navigator.addOnNavigatorEvent(this.onNavigatorEvent.bind(this));
  }

  componentDidMount() {
    BackHandler.addEventListener("hardwareBackPress", this.handleBackPress);
  }

  componentWillUnmount() {
    BackHandler.removeEventListener("hardwareBackPress", this.handleBackPress);
  }

  handleBackPress = () => {
    setTimeout(() => {
      if (this.props.enterFrom === "create") {
        this.props.navigator.popToRoot();
      } else {
        this.props.navigator.pop();
      }
    }, 0);

    return true;
  };

  onNavigatorEvent(event) {
    if (event.type == "NavBarButtonPress") {
      if (event.id == "backButton") {
        this.onBackButtonPress();
      }
      if (event.id == "skipButton") {
        this.onSkipButtonPress();
      }
      if (event.id == "print") {
        this.showPrintModal();
      }
    }
  }
  onBackButtonPress = () => {
    this.props.navigator.popToRoot();
  };
  onSkipButtonPress = () => {
    this.props.navigator.popToRoot();
  };
  showPrintModal = () => {
    Navigation.showModal({
      screen: PrintMnemonicWord.screenID,
      navigatorStyle: {
        navBarHidden: true,
        statusBarHidden: true,
      },
      passProps: {
        words: this.state.words,
      },
      animationType: "none",
    });
  };
  render() {
    return [
      <ScrollView key={0} style={styles.scroll} alignItems="center">
        <Text style={styles.title}>{this.isBackup ? "您的钱包助记词已生成" : "查看您的钱包助记词"}</Text>
        <Text style={[styles.text, { marginTop: padding(16), marginHorizontal: padding(30) }]}>
          请妥善备份好您的助记词，用于恢复您的数字钱包！RenrenBit不会在服务器上保存您的助记词
        </Text>
        <View style={styles.wordContainer}>
          {this.state.words.map((word, index) => (
            <View key={index} style={styles.wordwrap}>
              <Text style={styles.index}>{_.padStart(index + 1 + "", 2, "0")}</Text>
              <Text style={styles.word}>{word}</Text>
            </View>
          ))}
        </View>
        <Text style={styles.subTitle}>如何安全备份助记词?</Text>
        <View style={styles.blockContainer}>
          <View style={styles.blockView}>
            <Image
              style={{ width: 48, height: 48, marginBottom: 8 }}
              source={require("@img/wallet/mn_pic__photo.png")}
            />
            <Image
              style={{ position: "absolute", right: 16, top: 16, width: 28, height: 28 }}
              source={require("@img/wallet/mn_pic__forbidden.png")}
            />
            <Text style={styles.blockText}>请勿拍照/截屏</Text>
          </View>
          <View style={{ width: 9 }} />
          <View style={styles.blockView}>
            <Image
              style={{ width: 48, height: 48, marginBottom: 8 }}
              source={require("@img/wallet/mn_pic__wifi.png")}
            />
            <Image
              style={{ position: "absolute", right: 16, top: 16, width: 28, height: 28 }}
              source={require("@img/wallet/mn_pic__forbidden.png")}
            />
            <Text style={styles.blockText}>请勿网络传输/发送</Text>
          </View>
        </View>
        <View style={[styles.blockContainer, { marginBottom: 23 }]}>
          <View style={styles.blockView}>
            <Image
              style={{ width: 48, height: 48, marginBottom: 8 }}
              source={require("@img/wallet/mn_pic__record.png")}
            />
            <Image
              style={{ position: "absolute", right: 16, top: 16, width: 28, height: 28 }}
              source={require("@img/wallet/mn_pic__allow.png")}
            />
            <Text style={styles.blockText}>纸笔抄录下来</Text>
          </View>
          <View style={{ width: 9 }} />
          <View style={styles.blockView}>
            <Image
              style={{ width: 48, height: 48, marginBottom: 8 }}
              source={require("@img/wallet/mn_pic__copy.png")}
            />
            <Image
              style={{ position: "absolute", right: 16, top: 16, width: 28, height: 28 }}
              source={require("@img/wallet/mn_pic__allow.png")}
            />
            <Text style={styles.blockText}>全屏复印保存</Text>
          </View>
        </View>
      </ScrollView>,
      <Footer key={1}>
        <Button
          title={this.isBackup ? "下一步" : "完成"}
          onPress={this.nextButtonOnPress.bind(this)}
          containerStyle={styles.nextButtonContainer}
          buttonStyle={styles.nextButton}
        />
      </Footer>,
      <ScreenShotWarningModal
        key={2}
        visible={this.state.warningModal}
        onModalHide={() => {
          this.setState({ warningModal: false });
        }}
      />,
    ];
  }

  nextButtonOnPress() {
    if (this.isBackup) {
      this.props.navigator.push({
        screen: "ConfirmMnemonicWord",
        title: "验证助记词",
        passProps: {
          mnemonicWord: this.state.words,
        },
      });
    } else {
      this.props.navigator.popToRoot();
    }
  }
}

const styles = StyleSheet.create({
  scroll: {
    flexDirection: "column",
    paddingHorizontal: 16,
    flex: 1,
    backgroundColor: theme.backgroundColor,
  },
  text: {
    fontSize: 12,
    color: "#A7A7A7",
    lineHeight: 17,
    textAlign: "center",
  },
  title: {
    fontSize: 16,
    lineHeight: 22,
    letterSpacing: 0.47,
    color: theme.textColor.primary,
    textAlign: "center",
    fontWeight: theme.fontWeight.medium,
    marginTop: 40,
  },
  blodText: {
    fontWeight: "600",
    color: "#000000",
  },
  wordContainer: {
    marginTop: padding(16),
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    // paddingHorizontal: padding(32),
    marginBottom: 30,
  },
  word: {
    fontSize: 14,
    color: theme.textColor.primary,
    fontWeight: theme.fontWeight.medium,
  },
  wordwrap: {
    backgroundColor: "#FFFFFF",
    borderRadius: 3,
    marginVertical: 6,
    height: 36,
    width: itemWidth,
    alignItems: "center",
    justifyContent: "center",
  },
  index: {
    position: "absolute",
    top: 4,
    left: 3,
    fontSize: 10,
    color: theme.textColor.mainTitle,
    fontFamily: theme.alphanumericFontFamily,
  },
  subTitle: {
    fontSize: 14,
    lineHeight: 20,
    color: theme.textColor.primary,
    textAlign: "center",
    fontWeight: "400",
    marginBottom: 16,
  },
  hintText: {
    fontSize: 12,
    color: "#A7A7A7",
    lineHeight: 18,
    textAlign: "left",
  },
  nextButtonContainer: {
    flex: 1,
  },
  blockContainer: {
    marginTop: 9,
    flexDirection: "row",
  },
  blockView: {
    backgroundColor: "#fff",
    borderRadius: 3,
    flex: 2,
    flexDirection: "column",
    alignItems: "center",
    paddingTop: 20,
    paddingBottom: 9,
  },
  blockText: {
    fontSize: 14,
    lineHeight: 20,
    textAlign: "center",
    color: "#BCBFD1",
  },
  nextButton: {
    width: "100%",
    height: 50,
    borderRadius: 4,
    backgroundColor: theme.brandColor,
    ...Platform.select({
      android: { elevation: 0 },
    }),
  },
});
