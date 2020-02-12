import React, { Component, PureComponent } from "react";
import PropTypes from "prop-types";
import { observer } from "mobx-react";
import { StyleSheet, View, Text, TextInput, Image, TouchableWithoutFeedback } from "react-native";
import Screen from "../Screen";
import { Button } from "react-native-elements";
import i18n from "../../module/i18n/i18n";
import theme from "../../util/Theme";
import ActionSheet from "react-native-actionsheet";
import { action, observable, computed } from "mobx";
import BTCMultiSigWallet from "../../module/wallet/wallet/btc/BTCMultiSigWallet";
import AccountStore from "../../module/wallet/account/AccountStore";
import ProgressHUD from "../../component/common/ProgressHUD";
@observer
class MultiSigCreateScreen extends Screen {
  static get screenID() {
    return "MultiSigCreateScreen";
  }

  handleHUDRef = ref => (this.hud = ref);

  @computed get disabled() {
    if (this.forumData.title.trim().length == 0 || this.forumData.nick.trim().length == 0) {
      return true;
    }
    if (isNaN(parseInt(this.forumData.total)) || isNaN(parseInt(this.forumData.required))) {
      return true;
    }

    return false;
  }

  @observable forumData = {
    title: "",
    nick: "",
    total: "",
    required: "",
  };

  get totalOptions() {
    const min = 2;
    const max = 7;
    return [...Array(max - min + 1).keys()].map(el => el + min + "");
  }

  @computed get requiredOptions() {
    if (
      this.forumData.total === undefined ||
      isNaN(this.forumData.total) ||
      this.forumData.total == "" ||
      this.forumData.total == 0
    ) {
      return this.totalOptions;
    }
    const min = 1;
    const max = this.forumData.total;
    return [...Array(max - min + 1).keys()].map(el => el + min + "");
  }

  @action onChangeTitle = text => {
    this.forumData.title = text;
  };

  @action onChangeNick = text => {
    this.forumData.nick = text;
  };

  @action onChangeValueTotal = num => {
    this.forumData.total = num;
    if (this.forumData.required !== "") {
      this.forumData.required = Math.min(this.forumData.required, this.forumData.total);
    }
  };

  @action onChangeValueRequired = num => {
    this.forumData.required = num;
  };

  onCreatePress = async () => {
    const name = this.forumData.title.trim();
    const nick = this.forumData.nick.trim();

    const isVaildName = /^[\u0391-\uFFE5A-Za-z\d_-]{1,25}$/.test(name);
    if (!isVaildName) {
      this.hud && this.hud.showFailed(i18n.t("wallet-multisig-create-walletname-invaild"));
      return;
    }

    const isVaildNick = /^[\u0391-\uFFE5A-Za-z\d_-]{1,20}$/.test(nick);
    if (!isVaildNick) {
      this.hud && this.hud.showFailed(i18n.t("wallet-multisig-create-nick-invaild"));
      return;
    }

    try {
      this.hud && this.hud.showLoading();
      await BTCMultiSigWallet.create({
        walletName: name,
        nick,
        total: this.forumData.total,
        required: this.forumData.required,
        extendedPublicKey: AccountStore.defaultHDAccount.BTCWallet.extendedPublicKey,
      });
      this.hud && this.hud.showSuccess(i18n.t("wallet-create-success"));
      setTimeout(() => {
        this.navigator.popToRoot();
      }, 1000 * 1);
    } catch (error) {
      this.hud && this.hud.showFailed(error.message);
    }
  };
  render() {
    return (
      <View style={styles.main}>
        <View style={styles.card}>
          <ForumItemInput
            title={i18n.t("wallet-multisig-create-walletname")}
            placeholder={i18n.t("wallet-multisig-create-walletname-placeholder")}
            onChangeText={this.onChangeTitle}
          />
          <View style={styles.separator} />
          <ForumItemInput
            title={i18n.t("wallet-multisig-create-nick")}
            placeholder={i18n.t("wallet-multisig-create-nick-placeholder")}
            onChangeText={this.onChangeNick}
          />
          <View style={styles.separator} />
          <ForumItemSelect
            title={i18n.t("wallet-multisig-create-total")}
            placeholder={i18n.t("wallet-multisig-create-total-placeholder")}
            value={this.forumData.total}
            options={this.totalOptions}
            onChangeValue={this.onChangeValueTotal}
          />
          <View style={styles.separator} />
          <ForumItemSelect
            title={i18n.t("wallet-multisig-create-required")}
            placeholder={i18n.t("wallet-multisig-create-required-placeholder")}
            value={this.forumData.required}
            options={this.requiredOptions}
            onChangeValue={this.onChangeValueRequired}
          />
          <View style={styles.separator} />
          <ForumItemSelect
            title={i18n.t("wallet-multisig-create-coin")}
            placeholder={"BTC & USDT"}
            value={"BTC & USDT"}
          />
        </View>
        <Button
          title={i18n.t("wallet-multisig-create-button")}
          buttonStyle={styles.button}
          titleStyle={styles.buttonTitle}
          disabled={this.disabled}
          onPress={this.onCreatePress}
        />
        <ProgressHUD ref={this.handleHUDRef} />
      </View>
    );
  }
}

const styles = StyleSheet.create({
  main: {
    flex: 1,
    paddingTop: 12,
  },
  card: {
    backgroundColor: "#FFFFFF",
  },
  button: {
    height: 50,
    borderRadius: 3,
    marginHorizontal: 16,
    marginTop: 30,
    backgroundColor: theme.linkColor,
    elevation: 0,
  },
  buttonTitle: {
    fontSize: 18,
  },
  separator: {
    backgroundColor: theme.borderColor,
    height: StyleSheet.hairlineWidth,
    marginHorizontal: 16,
  },
});

class ForumItemInput extends PureComponent {
  onChangeText = text => {
    const { onChangeText } = this.props;
    onChangeText && onChangeText(text);
  };
  render() {
    const { title, placeholder } = this.props;
    return (
      <View style={fiiStyles.main}>
        <Text style={fiiStyles.title}>{title}</Text>
        <TextInput
          style={fiiStyles.input}
          placeholder={placeholder}
          placeholderTextColor={theme.textColor.placeHolder}
          onChangeText={this.onChangeText}
        />
      </View>
    );
  }
}

const fiiStyles = StyleSheet.create({
  main: {
    flexDirection: "row",
    alignItems: "center",
    height: 48,
    paddingHorizontal: 16,
    backgroundColor: "#FFFFFF",
  },
  title: {
    fontSize: 16,
    lineHeight: 16,
    color: theme.textColor.primary,
  },
  input: {
    flex: 1,
    fontSize: 16,
    lineHeight: 16,
    color: theme.textColor.primary,
    textAlign: "right",
  },
});
@observer
class ForumItemSelect extends Component {
  static defaultProps = {
    options: [],
  };
  static propTypes = {
    options: PropTypes.array,
  };
  @computed get display() {
    const { placeholder, value } = this.props;
    if (value === undefined || isNaN(value) || (value + "").length === 0) {
      return placeholder;
    }
    return value;
  }
  handleActionSheetRef = ref => (this.actionsheet = ref);
  onPressItem = () => {
    if (this.props.options.length == 0) {
      return;
    }
    this.actionsheet.show();
  };
  onSelectedItem = index => {
    const { options, onChangeValue } = this.props;

    if (index === options.length) {
      return;
    }
    const value = options[index];
    onChangeValue && onChangeValue(value);
  };
  render() {
    const { title, placeholder, options } = this.props;
    return (
      <TouchableWithoutFeedback onPress={this.onPressItem}>
        <View style={fisStyles.main}>
          <Text style={fisStyles.title}>{title}</Text>
          <Text style={[fisStyles.desc, this.display !== placeholder && { color: theme.textColor.primary }]}>
            {this.display}
          </Text>
          {options.length != 0 && (
            <Image style={fisStyles.arrow} resizeMode="center" source={require("@img/icon/arrow-right.png")} />
          )}
          <ActionSheet
            options={[...options, i18n.t("common-cancel")]}
            cancelButtonIndex={options.length}
            onPress={this.onSelectedItem}
            ref={this.handleActionSheetRef}
          />
        </View>
      </TouchableWithoutFeedback>
    );
  }
}

const fisStyles = StyleSheet.create({
  main: {
    flexDirection: "row",
    alignItems: "center",
    height: 48,
    paddingHorizontal: 16,
    backgroundColor: "#FFFFFF",
  },
  title: {
    fontSize: 16,
    lineHeight: 16,
    color: theme.textColor.primary.main,
  },
  desc: {
    flex: 1,
    fontSize: 16,
    lineHeight: 16,
    color: theme.textColor.placeHolder,
    textAlign: "right",
  },
  arrow: {
    height: 16,
    width: 16,
    marginLeft: 6,
  },
});
export default MultiSigCreateScreen;
