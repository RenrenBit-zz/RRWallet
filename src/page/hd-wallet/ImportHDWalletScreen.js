import React from "react";
import Screen from "../Screen";
import {
  StyleSheet,
  View,
  Text,
  Image,
  TextInput,
  Dimensions,
  Platform,
  Alert,
  TouchableHighlight,
  InteractionManager,
} from "react-native";
import ProgressHUD from "../../component/common/ProgressHUD";
import { Button } from "react-native-elements";
import theme from "../../util/Theme";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import { observable, computed } from "mobx";
import { observer, Observer } from "mobx-react";
import PasswordUtil from "../../util/PasswordUtil";
import { MnemonicWordsEnglish, MnemonicWordsChinese } from "../../module/wallet/wallet/util/MnemonicWordMap";
import AccountStore from "../../module/wallet/account/AccountStore";
import HDAccount from "../../module/wallet/account/HDAccount";
import AccountStorage from "../../module/wallet/account/AccountStorage";
import { padding } from "../../util/UIAdapter";
import { ACCOUNT_TYPE_HD_IMPORT, ACCOUNT_DEFAULT_ID_HD, ACCOUNT_TYPE_HD } from "../../config/const";
import errorHandler from "../../util/ErrorHandler";
import Tip from "../../component/common/Tip";
import i18n from "../../module/i18n/i18n";
import ForumItem from "../../component/common/ForumItem";
import { BIZ_SCOPE } from "../../module/i18n/const";

@observer
class ImportHDWalletScreen extends Screen {
  static get screenID() {
    return "ImportHDWallet";
  }
  static get title() {
    return i18n.tt(BIZ_SCOPE.wallet, "title-recovery");
  }
  static navigatorButtons = {
    leftButtons: Screen.navigatorButtons.leftButtons,
    rightButtons: [
      {
        id: "scan_qrcode",
        icon: require("@img/nav/nav_scan.png"),
      },
    ],
  };
  get isImport() {
    return this.props.type === "import";
  }
  @observable word = "";
  @observable name = i18n.t("wallet-title-index");
  @observable pwd = "";
  @observable repwd = "";

  @computed get pwdLevel() {
    let pwd = this.pwd;
    let level = PasswordUtil.getLevel(pwd);

    return level;
  }
  @computed get pwdLevelTxt() {
    let pwd = this.pwd;
    if (!pwd) {
      return "";
    }
    let level = PasswordUtil.getLevel(pwd);
    if (level == 0) {
      return "弱";
    } else if (level == 1) {
      return "一般";
    } else if (level == 2) {
      return "强";
    } else {
      return "很强";
    }
  }

  @observable hackWidth = "99%";

  constructor(props) {
    super(props);
    this.props.navigator.addOnNavigatorEvent(this.onNavigatorEvent);
  }

  onNavigatorEvent = event => {
    if (event.type == "NavBarButtonPress") {
      // this is the event type for button presses
      if (event.id == "scan_qrcode") {
        // this is the same id field from the static navigatorButtons definition
        //   AlertIOS.alert('NavBar', 'Edit button pressed');
        this.props.navigator.push({
          title: i18n.t("wallet-title-scan"), //'选择联系人',
          screen: "ScanQRCodeScreen", //'ContactList',
          passProps: {
            onBarCodeRead: this.onScanQRCode,
          },
        });
      }
    }
  };
  onScanQRCode = result => {
    if (result.data) {
      this.word = result.data;
      this.navigator.pop();
    }
  };
  componentDidMount = () => {
    if (Platform.OS == "android") {
      setTimeout(() => {
        this.hackWidth = "100%";
      }, 100);
    }

    if (this.isImport) {
      setTimeout(() => {
        this.tip && this.tip.showInfo(i18n.t("wallet-recovery-override-warning"));
      }, 0);
    }
  };

  importButtonOnPress = () => {
    this.import();
  };
  renderInputRightView = () => {
    let levelImgArr = [
      require("@img/icon/pwd_lv0.png"),
      require("@img/icon/pwd_lv2.png"),
      require("@img/icon/pwd_lv3.png"),
      require("@img/icon/pwd_lv4.png"),
    ];
    return (
      <Observer>
        {() =>
          this.pwdLevelTxt.length > 0 && (
            <View style={{ width: 36, flexDirection: "row", alignItems: "center", justifyContent: "center" }}>
              <Text style={styles.title}>{this.pwdLevelTxt}&nbsp;</Text>
              <Image source={levelImgArr[this.pwdLevel]} />
            </View>
          )
        }
      </Observer>
    );
  };
  render() {
    return (
      <View style={styles.main}>
        <KeyboardAwareScrollView
          enableOnAndroid={true}
          keyboardDismissMode="interactive"
          keyboardShouldPersistTaps="always">
          {this.isImport && <Text style={[styles.note, { marginTop: 16 }]}>◎ {i18n.t("wallet-recovery-desc1")}</Text>}
          <Text style={[styles.note, !this.isImport && { marginTop: 16 }]}>◎ {i18n.t("wallet-recovery-desc2")}</Text>
          <Text style={styles.note}>◎ {i18n.t("wallet-recovery-desc3")}</Text>
          <View style={[styles.card, { marginTop: 16 }]}>
            <View style={{ flex: 1 }}>
              <TextInput
                placeholder={i18n.t("wallet-recovery-word-placeholder")}
                underlineColorAndroid="transparent"
                onChangeText={text => (this.word = text)}
                value={this.word}
                autoCapitalize="none"
                multiline={true}
                clearButtonMode="while-editing"
                style={[styles.mnemonicInput, { width: this.hackWidth }]}
                autoCorrect={false}
                spellCheck={false}></TextInput>
            </View>
          </View>
          <ForumItem
            style={styles.input}
            title={i18n.t("wallet-recovery-setpwd")}
            onChangeText={text => (this.pwd = text)}
            placeholder={i18n.t("wallet-recovery-setpwd-placeholder")}
            value={this.pwd}
            secureTextEntry={true}
            renderInputRightView={this.renderInputRightView}
          />
          <ForumItem
            style={styles.input}
            title={i18n.t("wallet-recovery-confirmpwd")}
            onChangeText={text => (this.repwd = text)}
            placeholder={i18n.t("wallet-recovery-confirmpwd-placeholder")}
            value={this.repwd}
            secureTextEntry={true}
          />
          <Button
            title={this.isImport ? i18n.t("wallet-recovery-recovery") : i18n.t("wallet-recovery-import")}
            onPress={this.importButtonOnPress}
            backgroundColor={theme.brandColor}
            containerStyle={styles.importButtonContainer}
            buttonStyle={styles.importButton}
          />
          <ProgressHUD ref={ref => (this.hud = ref)} />
          <Tip ref={ref => (this.tip = ref)} />
        </KeyboardAwareScrollView>
      </View>
    );
  }
  import = async () => {
    const operating = async () => {
      this.hud && this.hud.showLoading();
      try {
        const account = await HDAccount.recovery(this.word, this.name, this.pwd, ACCOUNT_TYPE_HD_IMPORT, true);
        AccountStore.currentAccount = account;
        this.hud &&
          this.hud.showSuccess(
            this.isImport ? i18n.t("wallet-recovery-import-success") : i18n.t("wallet-recovery-recovery-success")
          );
        setTimeout(() => {
          this.navigator.popToRoot();
        }, 400);
      } catch (error) {
        this.hud && this.hud.dismiss();
        errorHandler(error, i18n.t("wallet-recovery-invaild"));
      }
    };

    this.word = (this.word && this.word.trim()) || "";
    if (this.isVaildInput()) {
      if (this.isImport) {
        this.tip &&
          this.tip.showInfo({
            title: i18n.t("wallet-recovery-warning"),
            message: i18n.t("wallet-recovery-warning-desc"),
            buttons: [
              { title: i18n.t("wallet-recovery-warning-reject") },
              {
                title: i18n.t("wallet-recovery-warning-confirm"),
                onPress: () => {
                  setTimeout(() => {
                    operating();
                  }, 500);
                },
              },
            ],
          });
      } else {
        operating();
      }
    }
  };
  isVaildInput() {
    this.name = this.name.trim();

    let isEnglish = false;
    let isChinese = false;
    const str = this.word.split(" ").join(""); //去除空格
    for (let i = 0; i < str.length; i++) {
      const charCode = str.charCodeAt(i);
      if (charCode >= 0x4e00 && charCode <= 0x9fef) {
        isChinese = true;
      } else if (charCode >= 97 && charCode <= 122) {
        isEnglish = true;
      } else {
        Alert.alert("", `${String.fromCharCode(charCode)}是非法字符`);
        return false;
      }
      if (isEnglish && isChinese) {
        Alert.alert("", i18n.t("wallet-recovery-invaild"));
        return false;
      }
      if (!isEnglish && !isChinese) {
        Alert.alert("", i18n.t("wallet-recovery-invaild"));
        return false;
      }
    }

    const words = isEnglish
      ? this.word.split(" ")
      : this.word
          .split(" ")
          .join("")
          .split("");
    if (words.length != 12 && words.length != 15) {
      Alert.alert("", i18n.t("wallet-recovery-invaild"));
      return false;
    }

    for (let i = 0; i < words.length; i++) {
      const word = words[i];
      if (!MnemonicWordsEnglish.hasOwnProperty(word) && !MnemonicWordsChinese.hasOwnProperty(word)) {
        Alert.alert("", `${word}${i18n.t("wallet-recovery-word-invaild")}`);
        return false;
      }
    }

    this.word = words.join(" ");
    if (!this.name || !this.name.length) {
      Alert.alert("", "钱包名称不能为空");
      return false;
    }
    if (this.name.length > 20) {
      Alert.alert("", "钱包名称不能大于20个字");
      return false;
    }
    // if (this.isImport && AccountStore.accounts.find(account => account.name == this.name)) {
    //     Alert.alert('','已存在相同名称的钱包')
    //     return false
    // }

    let flag = PasswordUtil.checkPasswordWithTip(this.pwd, this.repwd);
    return flag;
  }
}

const styles = StyleSheet.create({
  main: {
    flex: 1,
  },
  importButtonContainer: {
    marginLeft: 10,
    marginRight: 10,
    marginTop: 30,
  },
  importButton: {
    height: 50,
    borderRadius: 4,
    backgroundColor: theme.brandColor,
    elevation: 0,
  },
  card: {
    marginTop: 12,
    // paddingHorizontal: 16,
    backgroundColor: "#FFFFFF",
  },
  input: {
    marginTop: 10,
  },
  mnemonicInput: {
    textAlignVertical: "top",
    paddingTop: 20,
    paddingBottom: 20,
    paddingLeft: 16,
    paddingRight: 16,
    height: 88,
    fontSize: 16,
    color: theme.textColor.primary,
  },
  title: {
    fontSize: 14,
    color: theme.textColor.minorTitle2,
  },
  note: {
    fontSize: 12,
    lineHeight: 19,
    color: theme.textColor.mainTitle,
    marginLeft: 16,
  },
});

export default ImportHDWalletScreen;
