import Screen from "../Screen";
import { StyleSheet, View, Text, TouchableHighlight, Image, ScrollView, RefreshControl } from "react-native";
import React, { Component } from "react";
import theme from "../../util/Theme";
import AccountStore from "../../module/wallet/account/AccountStore";
import {
  MultiSigTransaction,
  MULTISIG_PENDING_TX_STATUS_WAITING,
  MULTISIG_PENDING_TX_STATUS_APPROVAL,
  MULTISIG_PENDING_TX_STATUS_REJECT,
  BTCMultiSigTransaction,
  USDTMultiSigTransaction,
} from "../../module/wallet/wallet/MultiSigWallet";
import i18n from "../../module/i18n/i18n";
import Footer from "../../component/common/Footer";
import { observer } from "mobx-react";
import { Button } from "react-native-elements";
import { computed, observable } from "mobx";
import MultiSigTxTimeline from "../hd-wallet/component/MultiSigTxTimeline";
import ProgressHUD from "../../component/common/ProgressHUD";
import PasswordDialog from "../hd-wallet/component/PasswordDialog";
import _ from "lodash";
import EmptyView from "../../component/common/EmptyView";
import network, { HD_MULTISIG_API } from "../../module/common/network";
import { COIN_TYPE_BTC, COIN_TYPE_USDT } from "../../config/const";
import MessageBox from "@CC/MessageBox";
import { BIZ_SCOPE } from "../../module/i18n/const";

@observer
class MultiSigTxAuthorizationScreen extends Screen {
  static get screenID() {
    return "MultiSigTxAuthorizationScreen";
  }

  static get title() {
    return i18n.t("wallet-title-multisig-authorization");
  }
  account = AccountStore.defaultMultiSigAccount;
  /**
   * @type {MultiSigTransaction}
   * @memberof MultiSigTxAuthorizationScreen
   */
  @observable tx = AccountStore.defaultMultiSigAccount.pendingTxs.find(tx => tx.id == this.props.txId);

  wallet = AccountStore.defaultMultiSigAccount.findWallet(this.props.groupKey) || this.tx.wallet;

  @observable isRefreshing = false;

  @observable isLoading = false;

  @computed get hasNotFound() {
    return !this.wallet && !this.tx;
  }

  @computed get isNetworkError() {
    return this.wallet && !this.tx && !this.isLoading && !this.isRefreshing;
  }

  @observable isFinished = false;

  handleHUDRef = ref => (this.hud = ref);

  handleMsgBoxRef = ref => (this.msgbox = ref);

  handleDialogRef = ref => (this.pwdDialog = ref);

  constructor(props) {
    super(props);
    if (!this.tx && this.wallet) {
      this.isLoading = true;
    }
  }
  componentDidMount = () => {
    if (!this.isLoading) {
      this.onRefresh();
      return;
    }
    this.fetchTx();
  };
  fetchTx = async () => {
    this.isLoading && this.hud && this.hud.showLoading();
    await AccountStore.defaultMultiSigAccount.update();
    const tx = AccountStore.defaultMultiSigAccount.pendingTxs.find(tx => tx.id == this.props.txId);
    if (tx) {
      this.tx = tx;
      this.isLoading = false;
      return;
    }
    if (this.wallet) {
      //钱包存在, 交易已经完成
      this.isFinished = true;
      try {
        const { data } = await network.post(
          "tx/getTx",
          {
            groupKeys: [this.wallet.id],
            publicKey: AccountStore.defaultMultiSigAccount.HDWallet.extendedPublicKey.key,
            txId: this.props.txId,
          },
          HD_MULTISIG_API
        );

        const txs =
          _.compact(
            data.txDtoList &&
              data.txDtoList.map(tx => {
                const actors =
                  (data.txDetailDtoList && data.txDetailDtoList.filter(member => member.txId == tx.id)) || [];
                const wallet = AccountStore.defaultMultiSigAccount.findWallet(tx.groupKey);
                const obj = {
                  id: tx.id,
                  wallet,
                  creator: tx.createUserName,
                  from: (tx.input && tx.input[0].address) || wallet.address,
                  to: tx.toAddress,
                  rawData: tx.txContent,
                  inputs: tx.input,
                  fee: tx.fee,
                  txHash: tx.txHash,
                  actors,
                };

                switch (tx.tokenType) {
                  case COIN_TYPE_BTC:
                    return new BTCMultiSigTransaction(obj);
                  case COIN_TYPE_USDT:
                    return new USDTMultiSigTransaction(obj);
                }
              })
          ) || [];
        if (txs[0]) {
          this.tx = txs[0];
        }
        if (this.tx.authStatus === MULTISIG_PENDING_TX_STATUS_WAITING) {
          this.tx.cancel = true;
        }
      } catch (error) {}
    }

    this.isLoading = false;
  };
  onRefresh = async () => {
    this.isRefreshing = true;
    await this.fetchTx();
    setTimeout(() => {
      this.isRefreshing = false;
    }, 300);
  };

  onCancelPress = async () => {
    this.msgbox.showConfirm({
      content: i18n.tt(BIZ_SCOPE.wallet, "multisig-authorization-tx-cancel-desc"),
      onOk: async () => {
        try {
          this.hud && this.hud.showLoading();
          await this.tx.wallet.cancelTransaction(this.tx);
          const pendingTxs = this.account.pendingTxs.slice();
          _.remove(pendingTxs, pendingTx => pendingTx === this.tx);
          this.account.pendingTxs = pendingTxs;
          try {
            await this.account.update();
          } catch (error) {}
          this.hud && this.hud.showSuccess(i18n.t("wallet-multisig-authorization-tx-cancel-success"));
          setTimeout(() => {
            this.navigator.pop();
          }, 400);
        } catch (error) {
          this.hud && this.hud.showFailed(error.message);
        }
      },
    });
  };
  onBroadcastPress = async () => {
    const pwd = await this.pwdDialog.show();
    const isValid = await this.tx.wallet.isVaildPassword(pwd);
    if (!isValid) {
      this.hud && this.hud.showFailed(i18n.t("common-password-incorrect"));
      return;
    }
    try {
      this.hud && this.hud.showLoading();
      await this.tx.wallet.approvalTransaction(this.tx, this.tx.rawData, this.tx.inputs, pwd);
      this.hud && this.hud.showSuccess(i18n.t("wallet-multisig-authorization-tx-broadcast-success"));
      setTimeout(() => {
        this.navigator.pop();
      }, 400);
    } catch (error) {
      this.hud && this.hud.showFailed(error.message);
    }
  };
  onApprovePress = async () => {
    const pwd = await this.pwdDialog.show();
    const isValid = await this.tx.wallet.isVaildPassword(pwd);
    if (!isValid) {
      this.hud && this.hud.showFailed(i18n.t("common-password-incorrect"));
      return;
    }
    try {
      this.hud && this.hud.showLoading();
      await this.tx.wallet.approvalTransaction(this.tx, this.tx.rawData, this.tx.inputs, pwd);
      this.hud && this.hud.showSuccess(i18n.t("wallet-multisig-authorization-tx-approve-success"));
      setTimeout(() => {
        this.navigator.pop();
      }, 400);
    } catch (error) {
      this.hud && this.hud.showFailed(error.message);
    }
  };
  onRejectPress = async () => {
    this.msgbox.showConfirm({
      content: i18n.tt(BIZ_SCOPE.wallet, "multisig-authorization-tx-reject-desc"),
      onOk: async () => {
        try {
          this.hud && this.hud.showLoading();
          await this.tx.wallet.rejectTransaction(this.tx);
          this.hud && this.hud.showSuccess(i18n.t("wallet-multisig-authorization-tx-reject-success"));
          setTimeout(() => {
            this.navigator.pop();
          }, 400);
        } catch (error) {
          this.hud && this.hud.showFailed(error.message);
        }
      },
    });
  };
  render() {
    if (this.hasNotFound) {
      return this.renderNotFound();
    }
    if (this.isLoading) {
      return this.renderLoading();
    }
    if (this.isNetworkError) {
      return this.renderNetworkError();
    }
    return (
      <View style={styles.main}>
        <ScrollView
          keyboardShouldPersistTaps={"always"}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={this.isRefreshing}
              onRefresh={this.onRefresh}
              tintColor={theme.textColor.mainTitle}
              titleColor={theme.textColor.mainTitle}
            />
          }>
          <View style={styles.card}>
            <Text style={styles.title}>{i18n.t("wallet-multisig-authorization-tx-amount")}</Text>
            <Text style={styles.amount}>
              {this.tx.amount} {this.tx.tokenName}
            </Text>
            <Text style={styles.title}>{i18n.t("wallet-multisig-authorization-tx-from")}</Text>
            <View>
              <Text style={styles.detail}>{this.tx.from}</Text>
              <TouchableHighlight>
                <Image />
              </TouchableHighlight>
            </View>
            <Text style={styles.title}>{i18n.t("wallet-multisig-authorization-tx-to")}</Text>
            <View>
              <Text style={styles.detail}>{this.tx.to}</Text>
              <TouchableHighlight>
                <Image />
              </TouchableHighlight>
            </View>
            <Text style={styles.title}>{i18n.t("wallet-multisig-authorization-tx-fee")}</Text>
            <Text style={styles.detail}>
              {this.tx.fee} {this.tx.feeCoin.name}
            </Text>
          </View>
          <AuthorizationProgress tx={this.tx} />
        </ScrollView>
        {!this.isFinished && (
          <AuthorizationButtonGroup
            tx={this.tx}
            onBroadcastPress={this.onBroadcastPress}
            onApprovePress={this.onApprovePress}
            onRejectPress={this.onRejectPress}
            onCancelPress={this.onCancelPress}
          />
        )}
        <ProgressHUD ref={this.handleHUDRef} />
        <MessageBox ref={this.handleMsgBoxRef} />
        <PasswordDialog ref={this.handleDialogRef} />
      </View>
    );
  }
  renderNotFound = () => (
    <View style={styles.main}>
      <EmptyView title={i18n.t("wallet-multisig-authorization-tx-notfound")} />
    </View>
  );
  renderLoading = () => (
    <View style={styles.main}>
      <ProgressHUD ref={this.handleHUDRef} />
    </View>
  );
  renderNetworkError = () => (
    <View style={styles.main}>
      <EmptyView title={i18n.t("common-network-unavailable")} />
    </View>
  );
}

const styles = StyleSheet.create({
  main: {
    flex: 1,
  },
  card: {
    marginTop: 12,
    marginBottom: 12,
    paddingHorizontal: 16,
    paddingTop: 4,
    paddingBottom: 20,
    backgroundColor: "#FFFFFF",
  },
  amount: {
    marginTop: 6,
    fontSize: 24,
    fontWeight: theme.fontWeight.medium,
    color: theme.textColor.primary,
  },
  title: {
    marginTop: 16,
    height: 17,
    fontSize: 12,
    color: theme.textColor.mainTitle,
  },
  detail: {
    marginTop: 5,
    height: 16,
    fontSize: 12,
    color: theme.textColor.primary,
  },
});

@observer
class AuthorizationProgress extends Component {
  render() {
    return (
      <View style={apStyles.main}>
        <Text style={apStyles.title}>{i18n.t("wallet-multisig-authorization-tx-progress")}</Text>
        <View style={apStyles.separator} />
        <MultiSigTxTimeline tx={this.props.tx} />
      </View>
    );
  }
}

const apStyles = StyleSheet.create({
  main: {
    paddingHorizontal: 16,
    backgroundColor: "#FFFFFF",
  },
  title: {
    marginTop: 16,
    marginBottom: 18,
    fontSize: 14,
    color: theme.textColor.primary,
  },
  separator: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: theme.borderColor,
    marginBottom: 20,
  },
});
@observer
class AuthorizationButtonGroup extends Component {
  /**
   *
   * @type {MultiSigTransaction}
   * @readonly
   * @memberof AuthorizationButtonGroup
   */
  @computed get tx() {
    return this.props.tx;
  }

  get isOwn() {
    return this.tx.creator == this.tx.wallet.self.nick;
  }
  renderNotice = () => {
    if (
      this.tx.authStatus === MULTISIG_PENDING_TX_STATUS_REJECT ||
      (this.tx.authStatus === MULTISIG_PENDING_TX_STATUS_APPROVAL && !_.isNil(this.tx.hash))
    ) {
      return null;
    }

    const approval = this.tx.actors.filter(actor => actor.status === MULTISIG_PENDING_TX_STATUS_APPROVAL).length;

    const amount = this.tx.wallet.required - approval;
    return (
      <View style={abgStyles.notice}>
        <Image source={require("@img/wallet/tip_round.png")} />
        <Text style={abgStyles.noticeText}>
          {amount <= 0
            ? i18n.t("wallet-multisig-authorization-tx-broadcast-failed-tip")
            : i18n.t("wallet-multisig-authorization-tx-vacancy", { amount })}
        </Text>
      </View>
    );
  };
  renderButton = () => {
    const { onBroadcastPress, onApprovePress, onRejectPress, onCancelPress } = this.props;
    if (this.tx.authStatus === MULTISIG_PENDING_TX_STATUS_APPROVAL && _.isNil(this.tx.hash)) {
      return (
        <Button
          title={i18n.t("wallet-multisig-authorization-tx-broadcast")}
          containerStyle={abgStyles.buttonContainer}
          buttonStyle={abgStyles.approveButton}
          onPress={onBroadcastPress}
        />
      );
    }

    if (this.isOwn) {
      return (
        <Button
          title={i18n.t("wallet-multisig-authorization-tx-cancel")}
          containerStyle={abgStyles.buttonContainer}
          buttonStyle={abgStyles.cancelButton}
          onPress={onCancelPress}
        />
      );
    }

    if (this.tx.ownAuthStatus == MULTISIG_PENDING_TX_STATUS_WAITING) {
      return [
        <Button
          key="reject"
          title={i18n.t("wallet-multisig-authorization-tx-reject")}
          containerStyle={abgStyles.buttonContainer}
          buttonStyle={abgStyles.rejectButton}
          titleStyle={abgStyles.rejectTitle}
          onPress={onRejectPress}
        />,
        <Button
          key="approve"
          title={i18n.t("wallet-multisig-authorization-tx-approve")}
          containerStyle={abgStyles.buttonContainer}
          buttonStyle={abgStyles.approveButton}
          onPress={onApprovePress}
        />,
      ];
    }

    return [];
  };
  render() {
    return [this.renderNotice(), <Footer>{this.renderButton()}</Footer>];
  }
}

const abgStyles = StyleSheet.create({
  notice: {
    height: 26,
    backgroundColor: theme.noticeColor,
    paddingLeft: 10,
    flexDirection: "row",
    alignItems: "center",
  },
  noticeText: {
    fontSize: 12,
    color: "#FFFFFF",
    marginLeft: 5,
  },
  buttonContainer: {
    flex: 1,
  },
  cancelButton: {
    height: 50,
    backgroundColor: theme.assistColor_red,
    borderRadius: 0,
    elevation: 0,
  },
  rejectButton: {
    height: 50,
    backgroundColor: "#FFFFFF",
    borderRadius: 0,
    elevation: 0,
  },
  rejectTitle: {
    fontSize: 18,
    color: theme.linkColor,
  },
  approveButton: {
    height: 50,
    backgroundColor: theme.linkColor,
    borderRadius: 0,
    elevation: 0,
  },
});
export default MultiSigTxAuthorizationScreen;
