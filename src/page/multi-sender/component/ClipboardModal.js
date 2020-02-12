import React, { Component } from "react";
import {
  StyleSheet,
  Image,
  View,
  Text,
  TouchableHighlight,
  TouchableWithoutFeedback,
  Dimensions,
  Clipboard,
  Keyboard,
} from "react-native";
import { Input, Button } from "react-native-elements";
import Theme from "../../../util/Theme";
import ProgressHUD from "../../../component/common/ProgressHUD";
import Modal from "react-native-modal";
import { padding } from "../../../util/UIAdapter";
import i18n from "../../../module/i18n/i18n";

const { height, width } = Dimensions.get("window");

export default class ClipboardModal extends Component {
  constructor(props) {
    super(props);
    this.state = {
      defaultValue: "",
      recipientList: [],
      errorText: "",
    };
  }

  placeholder = i18n.t("qunfabao-paste-place-holder");

  textChange = excelData => {
    if (excelData) {
      this.dealData(excelData);
    } else {
      this.setState({
        defaultValue: "",
        recipientList: [],
      });
    }
  };

  dealData(excelData) {
    let arr = excelData.split("\n");
    let reg = /(\-)?\d+\.\d+\,\s((\-)?)\d+\.\d+/g;
    let validData = [];

    let i = 0;
    let canNext = true; // 是否可以执行下一步

    try {
      for (let n of arr) {
        let str = n.replace(/\r|\n/g, "");
        let cell = str.split("\t");
        if (cell.length < 3) {
          cell = str.split(/\s+/);
        }

        let name = cell[0].trim();
        let address = cell[1].trim();
        let amount = cell[2].trim();
        let phone = (cell[3] || "").trim();

        if (name && /^[+]{0,1}(\d+)$|^[+]{0,1}(\d+\.\d+)$/.test(amount) && /^0x[a-fA-F0-9]{40}$/.test(address)) {
          validData.push(cell);
        } else {
          canNext = false;
          this.errorTip(i);
          break;
        }

        i++;
      }
    } catch (error) {
      canNext = false;

      this.errorTip(i);
      return;
    }
    if (canNext) {
      this.setState({
        recipientList: validData,
        errorText: "",
      });
    } else {
      this.setState({
        recipientList: [],
      });
    }
    // console.log('========excelData paste=======>', validData);
  }

  errorTip(i) {
    this.setState({
      recipientList: [],
      errorText: i18n.t("qunfabao-paste-error"),
    });
  }

  cancel() {
    this.props.onCancel();
  }

  async confirm() {
    let length = this.state.recipientList.length;
    if (length) {
      this.props.onDataParseSuccess && this.props.onDataParseSuccess(this.state.recipientList);
    } else {
      let text = await Clipboard.getString();
      this.setState({
        defaultValue: text,
      });
      this.textChange(text);
    }
  }

  render() {
    let errorText = this.state.errorText;
    return (
      <Modal {...this.props} visible={undefined} style={styles.modal} avoidKeyboard={true}>
        <TouchableWithoutFeedback
          onPress={() => {
            Keyboard.dismiss();
          }}>
          <View style={styles.container}>
            <ProgressHUD ref={ref => (this.hud = ref)} />
            <View style={styles.wrap}>
              <View style={styles.titleWrap}>
                <View>
                  <TouchableHighlight activeOpacity={0.6} underlayColor="transparent" onPress={this.cancel.bind(this)}>
                    <View style={styles.closeBtn}>
                      <Image source={require("@img/qunfabao/icon_x.png")}></Image>
                    </View>
                  </TouchableHighlight>
                </View>
                <Text style={styles.title}>{i18n.t("qunfabao-paste-title")}</Text>
                <View style={{ width: 56 }}></View>
              </View>
              <View
                style={{
                  paddingHorizontal: 16,
                  paddingTop: 20,
                }}>
                <Input
                  multiline={true}
                  placeholder={this.placeholder}
                  placeholderTextColor={"#cccc"}
                  autoCapitalize="none"
                  returnKeyType="done"
                  underlineColorAndroid="transparent"
                  containerStyle={styles.containerStyle}
                  inputContainerStyle={styles.inputContainerStyle}
                  inputStyle={[
                    styles.inputStyle,
                    {
                      textAlignVertical: "top",
                    },
                  ]}
                  onChangeText={this.textChange}></Input>
                <Text
                  style={{
                    color: errorText ? "#EB4E3D" : Theme.textColor.mainTitle,
                    fontSize: 14,
                    paddingTop: 20,
                    lineHeight: 20,
                  }}>
                  {errorText ? errorText : i18n.t("qunfabao-paste-notice")}
                </Text>
                <View style={styles.foot}>
                  <Button
                    title={
                      this.state.recipientList.length > 0
                        ? i18n.t("qunfabao-paste-btn-2")
                        : i18n.t("qunfabao-paste-btn-1")
                    }
                    containerStyle={styles.nextButtonContainer}
                    buttonStyle={styles.nextButton}
                    onPress={this.confirm.bind(this)}></Button>
                </View>
              </View>
            </View>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    );
  }
}

const styles = StyleSheet.create({
  modal: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.4)",
    margin: 0,
  },
  container: {
    // paddingHorizontal: 20,
    // position: 'absolute',
    // width: '100%',
    // height: height,
    // zIndex: 1,
    // top: 0,
  },
  wrap: {
    marginHorizontal: padding(width < 340 ? 20 : 36),
    backgroundColor: "#fff",
    borderRadius: 12,
    overflow: "hidden",
    shadowRadius: 10,
    shadowOpacity: 0.5,
    shadowColor: "#27347D",
    shadowOffset: {
      h: 2,
      w: 0,
    },
  },
  titleWrap: {
    borderColor: "#eee",
    borderBottomWidth: StyleSheet.hairlineWidth,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  closeBtn: { width: 56, height: 56, justifyContent: "center", alignItems: "center" },
  title: {
    fontSize: 18,
    color: "#000",
    textAlign: "center",
    // paddingTop: 12,
    // paddingBottom: 12,
    height: 56,
    lineHeight: 56,
    flex: 1,
    fontWeight: "500",
  },

  containerStyle: {
    backgroundColor: Theme.backgroundColor,
    borderRadius: 3,
    overflow: "hidden",
    height: 120,
    width: "100%",
    paddingTop: 6,
    paddingHorizontal: 2,
    paddingRight: 6,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Theme.borderColor,
  },
  inputContainerStyle: {},
  inputStyle: {
    height: 120,
    fontSize: 12,
  },

  foot: {
    // paddingBottom: padding(30),
    // paddingTop: padding(20),
    paddingBottom: 30,
    paddingTop: 16,
  },
  nextButtonContainer: {},
  nextButton: {
    height: 45,
    width: "100%",
    borderRadius: 6,
    backgroundColor: Theme.linkColor,
    elevation: 0,
  },
});
