import Screen from "../Screen";
import React, { Component } from "react";
import { StyleSheet, View, FlatList, TouchableHighlight, Text } from "react-native";
import { observer } from "mobx-react";
import theme from "../../util/Theme";
import i18n from "../../module/i18n/i18n";
import { observable } from "mobx";
import ProgressHUD from "../../component/common/ProgressHUD";
import network, { HD_MULTISIG_API } from "../../module/common/network";
import AccountStore from "../../module/wallet/account/AccountStore";
import _ from "lodash";
import BTCMultiSigWallet from "../../module/wallet/wallet/btc/BTCMultiSigWallet";
import PasswordDialog from "../hd-wallet/component/PasswordDialog";
import EmptyView from "../../component/common/EmptyView";

@observer
class MultiSigRecoveryScreen extends Screen {
  static get screenID() {
    return "MultiSigRecoveryScreen";
  }

  @observable wallets = [];

  handleHUDRef = ref => (this.hud = ref);

  handleDialogRef = ref => (this.pwdDialog = ref);

  @observable loading = true;
  constructor(props) {
    super(props);
  }

  componentDidMount = () => {
    this.fetchWalletList();
  };
  fetchWalletList = async () => {
    const account = AccountStore.defaultMultiSigAccount;
    this.hud && this.hud.showLoading();
    try {
      const { data } = await network.post(
        "multisigner/getMultisignerList",
        {
          pageNum: 1,
          publicKey: account.HDWallet.extendedPublicKey.key,
        },
        HD_MULTISIG_API
      );

      const walletList =
        (data &&
          data.groupDtoList.map(wallet => {
            return { id: wallet.groupKey, name: wallet.groupName };
          })) ||
        [];

      this.wallets = _.xorWith(walletList, account.wallets, (w1, w2) => w1.id == w2.id);

      this.hud && this.hud.dismiss();
    } catch (error) {
      this.hud && this.hud.showFailed(error.message);
    }

    this.loading = false;
  };
  onWalletPress = async wallet => {
    const pwd = await this.pwdDialog.show();
    const isValid = await AccountStore.defaultMultiSigAccount.HDWallet.isVaildPassword(pwd);
    if (!isValid) {
      this.hud && this.hud.showFailed(i18n.t("common-password-incorrect"));
      return;
    }

    const walletID = wallet.id;
    this.hud && this.hud.showLoading();
    try {
      await BTCMultiSigWallet.recover({ walletID });
      const wallets = this.wallets.slice();
      _.remove(wallets, wallet => wallet.id === walletID);
      this.wallets = wallets;
      try {
        await AccountStore.defaultMultiSigAccount.update();
      } catch (error) {}
      this.hud && this.hud.showSuccess(i18n.t("wallet-recovery-recovery-success"));
    } catch (error) {
      this.hud && this.hud.showFailed(error.message);
    }
  };
  _renderItem = ({ item }) => <WalletCell wallet={item} onPress={this.onWalletPress} />;
  _renderSeparator = () => (
    <View style={styles.separatorWrap}>
      <View style={styles.separator} />
    </View>
  );
  _renderEmptyComponent = () => !this.loading && <EmptyView title={i18n.t("common-empty-data_2")} />;
  render() {
    return (
      <View style={styles.main}>
        <FlatList
          contentContainerStyle={styles.container}
          data={this.wallets}
          renderItem={this._renderItem}
          ItemSeparatorComponent={this._renderSeparator}
          ListEmptyComponent={this._renderEmptyComponent}
          extraData={this.loading}
          keyboardShouldPersistTaps={"always"}
        />
        <ProgressHUD ref={this.handleHUDRef} />
        <PasswordDialog ref={this.handleDialogRef} />
      </View>
    );
  }
}

const styles = StyleSheet.create({
  main: {
    flex: 1,
  },
  container: {
    flexGrow: 1,
    paddingTop: 12,
  },
  separatorWrap: {
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 16,
  },
  separator: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: theme.borderColor,
  },
});

class WalletCell extends Component {
  onPress = () => {
    const { onPress, wallet } = this.props;
    onPress && onPress(wallet);
  };
  render() {
    const { wallet } = this.props;
    return (
      <TouchableHighlight activeOpacity={0.6} onPress={this.onPress}>
        <View style={wcStyles.main}>
          <Text style={wcStyles.title}>{wallet.name}</Text>
          <Text style={wcStyles.recover}>{i18n.t("wallet-multisig-recovery-recover")}</Text>
        </View>
      </TouchableHighlight>
    );
  }
}

const wcStyles = StyleSheet.create({
  main: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 16,
    paddingVertical: 20,
  },
  title: {
    flex: 1,
    fontSize: 16,
    color: theme.textColor.primary,
  },
  recover: {
    fontSize: 16,
    color: theme.linkColor,
  },
});
export default MultiSigRecoveryScreen;
