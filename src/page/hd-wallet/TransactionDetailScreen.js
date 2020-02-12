import React, { Component } from "react";
import {
  StyleSheet,
  View,
  Text,
  Image,
  TouchableHighlight,
  ScrollView,
  Clipboard,
  ActivityIndicator,
  Dimensions,
  Platform,
  RefreshControl,
} from "react-native";
import QRCode from "react-native-qrcode-svg";
import Screen from "../Screen";
import * as moment from "moment";
import WalletTxStore, {
  TX_STATUS_CONFIRMING,
  TX_STATUS_SUCCESS,
  TX_STATUS_FAILED,
  Transaction,
  TX_TYPE_IN,
  TX_TYPE_OUT,
  correctTx,
} from "../../module/wallet/wallet/WalletTxStore";
import Wallet from "../../module/wallet/wallet/Wallet";
import theme from "../../util/Theme";
import { observable, computed, autorun } from "mobx";
import { observer, Observer } from "mobx-react";
import ProgressHUD from "../../component/common/ProgressHUD";
import { toFixedLocaleString } from "../../util/NumberUtil";
import AccountStore from "../../module/wallet/account/AccountStore";
import i18n from "../../module/i18n/i18n";
import HDAccount from "../../module/wallet/account/HDAccount";
import MultiSigAccount from "../../module/wallet/account/MultiSigAccount";
import { HDACCOUNT_FIND_WALELT_TYPE_COINID } from "../../config/const";
import MultiSigTxTimeline from "./component/MultiSigTxTimeline";
import MultiSigWallet, { MultiSigTransaction } from "../../module/wallet/wallet/MultiSigWallet";
import Footer from "../../component/common/Footer";
import Button from "../../component/common/Button";
import BTCWallet from "../../module/wallet/wallet/BTCWallet";
import { BIZ_SCOPE } from "../../module/i18n/const";

const headerBgColor = theme.business.hd;
const headerTextColor = "#FFFFFF";
const { width, height } = Dimensions.get("window");

const TXSCREEN_SCENE_HD = 0;
const TXSCREEN_SCENE_MULTISIG = 1;
@observer
export default class TransactionDetailScreen extends Screen {
  static get screenID() {
    return "TransactionDetailScreen";
  }
  static get title() {
    return i18n.t("wallet-title-txdetail");
  }
  static navigatorStyle = {
    ...Screen.navigatorStyle,
    navBarTextColor: headerTextColor,
    navBarButtonColor: headerTextColor,
    navBarBackgroundColor: headerBgColor,
    statusBarTextColorSchemeSingleScreen: "light",
  };
  @observable scene = parseInt(this.props.source) || TXSCREEN_SCENE_HD;
  @computed get account() {
    if (this.props.accountID) {
      return AccountStore.match(this.props.accountID);
    }
    switch (this.scene) {
      case TXSCREEN_SCENE_HD:
        return AccountStore.defaultHDAccount;
      case TXSCREEN_SCENE_MULTISIG:
        return AccountStore.defaultMultiSigAccount;
    }
  }
  @computed get wallet() {
    if (this.account instanceof HDAccount) {
      // this.scene = TXSCREEN_SCENE_HD
      return this.account.findWallet(this.props.coinID, HDACCOUNT_FIND_WALELT_TYPE_COINID);
    } else if (this.account instanceof MultiSigAccount) {
      // this.scene = TXSCREEN_SCENE_MULTISIG
      return this.account.findWallet(this.props.walletID);
    }
  }
  @computed get froms() {
    if (!this.tx.froms || this.tx.froms.length === 0) {
      if (this.tx.from) {
        return [
          {
            address: this.tx.from,
          },
        ];
      }
      return [];
    }
    return this.tx.froms;
  }
  @computed get tos() {
    if (!this.tx.tos || this.tx.tos.length === 0) {
      if (this.tx.to) {
        return [
          {
            address: this.tx.to,
          },
        ];
      }
      return [];
    }
    return this.tx.tos;
  }

  @observable isRefreshing = false;

  handleHUDRef = ref => (this.hud = ref);

  getHud = () => this.hud;

  constructor(props) {
    super(props);
    this.init();
    autorun(() => {
      this.props.navigator.setStyle({
        navBarBackgroundColor: this.backgroundColor,
      });
    });
  }
  componentDidMount() {}
  init = () => {
    if (this.wallet) {
      this.tx = this.wallet.txStore.txs.get(this.props.orderId).pop();
    }
    this.fetchData();
  };
  fetchData = async () => {
    if (this.wallet instanceof MultiSigWallet) {
      return;
    }
    try {
      if (this.wallet) {
        this.tx = (await this.wallet.txStore.fetchTx(this.props.orderId, this.wallet)).pop();
      } else {
        this.tx = (await WalletTxStore.fetchTx(this.props.orderId)).pop();
      }
      if (this.props.type) {
        const type = parseInt(this.props.type);
        switch (this.props.type) {
          case TX_TYPE_IN:
            this.tx.type = type;
            break;
          case TX_TYPE_OUT:
            this.tx.type = type;
        }
      }
      this.fuckMultiSigIfNeed();
    } catch (error) {}
  };
  fuckMultiSigIfNeed = () => {
    try {
      if (!(this.account instanceof MultiSigAccount)) {
        return;
      }
      let isOut = false;
      fromLoop: for (const wallet of this.account.wallets) {
        for (const from of this.tx.froms) {
          if (wallet.addressesMap[from.address]) {
            this.tx.type = TX_TYPE_OUT;
            correctTx(this.tx, wallet);
            isOut = true;
            break fromLoop;
          }
        }
      }
      if (!isOut) {
        this.tx.type = TX_TYPE_IN;
      }
    } catch (error) {}
  };
  onExplorerPress = () => {
    this.props.navigator.push({
      title: "查看详情",
      screen: "Webview",
      passProps: {
        url: this.tx.explorerURL,
      },
    });
  };
  _onRefresh = async () => {
    if (this.isRefreshing) {
      return;
    }

    if (!this.tx) {
      this.isRefreshing = false;
      return;
    }

    this.isRefreshing = true;

    await this.fetchData();
    setTimeout(() => {
      this.isRefreshing = false;
    }, 500);
  };
  //TODO: 初始值
  @observable.ref tx = null;

  @computed get backgroundColor() {
    if (this.account instanceof HDAccount) {
      return theme.business.hd;
    }
    if (this.account instanceof MultiSigAccount) {
      return theme.business.multiSig;
    }

    return this.props.backgroundColor || headerBgColor;
  }
  render() {
    if (!this.tx) {
      return (
        <View style={[styles.indicatorContainer, { backgroundColor: this.backgroundColor }]}>
          <View style={styles.indicatorWrap}>
            <ActivityIndicator size="large" color="#FFFFFF" opacity={0.4} />
          </View>
        </View>
      );
    }

    return (
      <ScrollView
        style={[styles.main]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            zIndex={999}
            refreshing={this.isRefreshing}
            onRefresh={this._onRefresh}
            tintColor={"#FFFFFF"}
            title={i18n.t("common-loading")}
            titleColor={"#FFFFFF"}
            colors={["#f00", "#0f0", "#00f"]}
          />
        }>
        <Header tx={this.tx} backgroundColor={this.backgroundColor} />
        <AddressList title={i18n.tt(BIZ_SCOPE.wallet, "txdetail-froms")} data={this.froms} hud={this.getHud} />
        <View style={styles.separator} />
        <AddressList title={i18n.tt(BIZ_SCOPE.wallet, "txdetail-tos")} data={this.tos} hud={this.getHud} />
        <View style={styles.separator} />
        <TimeLine tx={this.tx} />
        <TxStatusSection tx={this.tx} />
        <View style={styles.separator} />
        <TxBlockchainSection tx={this.tx} onTxHashPress={this.onExplorerPress} hud={this.getHud} />
        <Footer />
        <ProgressHUD ref={this.handleHUDRef} position={"absoluteFill"} />
      </ScrollView>
    );
  }
}

const fontColor = theme.textColor.primary;

const styles = StyleSheet.create({
  indicatorContainer: {
    flex: 1,
    backgroundColor: headerBgColor,
    justifyContent: "center",
    alignItems: "center",
  },
  indicatorWrap: {
    width: 64,
    height: 64,
    backgroundColor: "#171B31",
    opacity: 0.7,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  main: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  separator: {
    width: "100%",
    height: 12,
    backgroundColor: theme.backgroundColor,
  },
});

@observer
class Header extends Component {
  @computed get tx() {
    return this.props.tx;
  }

  @computed get date() {
    return moment.unix(this.tx.timestamp).format("YYYY.MM.DD HH:mm:ss");
  }

  @computed get typeSymbol() {
    return this.tx.type === TX_TYPE_IN ? "+" : "-";
  }

  @computed get typeText() {
    return this.tx.type === TX_TYPE_IN ? i18n.t("wallet-txcell-type-receive") : i18n.t("wallet-txcell-type-send");
  }
  render() {
    return (
      <View style={hStyles.main}>
        <View style={[hStyles.cover, { backgroundColor: this.props.backgroundColor }]} />
        <Text style={hStyles.amount}>
          {this.typeSymbol}
          {this.tx.amount} {this.tx.tokenName}
        </Text>
        <Text style={hStyles.date}>
          {this.date} {this.typeText}
        </Text>
      </View>
    );
  }
}

const hStyles = StyleSheet.create({
  main: {
    height: 100,
    alignItems: "center",
  },
  cover: {
    position: "absolute",
    width: width,
    height: height,
    bottom: 0,
  },
  amount: {
    marginTop: 12,
    height: 36,
    fontSize: 30,
    fontWeight: theme.fontWeight.medium,
    color: "#FFFFFF",
  },
  date: {
    marginTop: 6,
    height: 17,
    fontSize: 12,
    color: "#FFFFFF",
  },
});

@observer
class AddressList extends Component {
  @observable isExpand = false;

  @computed get title() {
    return this.props.title;
  }

  @computed get hud() {
    return this.props.hud;
  }

  @computed get data() {
    const data = this.props.data;
    if (data.length <= 3 || this.isExpand) {
      return data;
    }
    return data.slice(0, 3);
  }

  @computed get showExpand() {
    return this.props.data.length > 3;
  }

  @computed get expandText() {
    return this.isExpand
      ? i18n.tt(BIZ_SCOPE.wallet, "txdetail-collapse")
      : i18n.tt(BIZ_SCOPE.wallet, "txdetail-expand", { count: this.data.length });
  }
  onExpandPress = () => {
    this.isExpand = !this.isExpand;
  };
  render() {
    return (
      <View style={alStyles.main}>
        <Text style={alStyles.title}>{this.title}</Text>
        <View style={alStyles.separator} />
        <Observer>
          {() => this.data.map((item, index) => <AddressCell key={index + ""} data={item} hud={this.hud} />)}
        </Observer>
        {this.showExpand && [
          <View key="1" style={alStyles.separator} />,
          <Button
            key="2"
            containerStyle={alStyles.buttonContainer}
            title={this.expandText}
            titleStyle={alStyles.expand}
            onPress={this.onExpandPress}
          />,
        ]}
      </View>
    );
  }
}

const alStyles = StyleSheet.create({
  main: {
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 16,
  },
  title: {
    marginVertical: 16,
    color: theme.textColor.primary,
    fontSize: 14,
    fontWeight: theme.fontWeight.medium,
  },
  separator: {
    marginBottom: 6,
    height: StyleSheet.hairlineWidth,
    backgroundColor: theme.borderColor,
  },
  buttonContainer: {
    width: "100%",
    height: 44,
  },
  expand: {
    fontSize: 12,
    color: theme.linkColor,
  },
});

const addressWidth = width - 32 - 14 - 16;
@observer
class AddressCell extends Component {
  @computed get address() {
    return this.props.data.address;
  }

  @computed get hud() {
    return this.props.hud();
  }

  onPress = () => {
    Clipboard.setString(this.address || "");
    this.hud && this.hud.showSuccess("已复制");
  };

  render() {
    return (
      <TouchableHighlight underlayColor="transparent" activeOpacity={0.7} onPress={this.onPress}>
        <View style={acStyles.main}>
          <Text style={acStyles.address} numberOfLines={1} ellipsizeMode="middle">
            {this.address}
          </Text>
          <View style={acStyles.iconWrap}>
            <Image source={require("@img/icon/copy.png")} />
          </View>
        </View>
      </TouchableHighlight>
    );
  }
}

const acStyles = StyleSheet.create({
  main: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    height: 38,
  },
  address: {
    color: theme.textColor.primary,
    width: addressWidth,
    fontSize: 14,
  },
  iconWrap: {
    flex: 1,
    alignItems: "flex-end",
  },
});

@observer
class TxStatusSection extends Component {
  @computed get statusText() {
    switch (this.tx.status) {
      case TX_STATUS_CONFIRMING:
        return this.tx.confirmations > 0 ? i18n.t("wallet-tx-status-success") : i18n.t("wallet-tx-status-pending");
      case TX_STATUS_SUCCESS:
        return i18n.t("wallet-tx-status-success");
      case TX_STATUS_FAILED:
        return i18n.t("wallet-tx-status-failed");
      default:
        return i18n.t("wallet-tx-status-pending");
    }
  }
  /**
   *
   * @type {Transaction}
   * @readonly
   * @memberof TxStatusSection
   */
  @computed get tx() {
    return this.props.tx;
  }

  @computed get showNote() {
    return !!this.tx.note && this.tx.note.length > 0;
  }
  render() {
    return (
      <View style={tssStyles.main}>
        <View style={tssStyles.row}>
          <Text style={tssStyles.key}>{i18n.tt(BIZ_SCOPE.wallet, "txdetail-status")}</Text>
          <Text style={[tssStyles.value, { color: theme.noticeColor }]}>{this.statusText}</Text>
        </View>
        <View style={tssStyles.row}>
          <Text style={tssStyles.key}>{i18n.tt(BIZ_SCOPE.wallet, "txdetail-fee")}</Text>
          <Text style={tssStyles.value}>
            {this.tx.fee} {this.tx.feeCoin.name}
          </Text>
        </View>
        {this.showNote && (
          <View style={tssStyles.row}>
            <Text style={tssStyles.key}>{i18n.tt(BIZ_SCOPE.wallet, "txdetail-note")}</Text>
            <Text style={tssStyles.value}>{this.tx.note}</Text>
          </View>
        )}
      </View>
    );
  }
}

const tssStyles = StyleSheet.create({
  main: {
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 16,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    height: 48,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: theme.borderColor,
  },
  key: {
    fontSize: 14,
    color: theme.textColor.primary,
  },
  value: {
    fontSize: 14,
    color: theme.textColor.placeHolder,
  },
});
@observer
class TxBlockchainSection extends Component {
  /**
   *
   * @type {Transaction}
   * @readonly
   * @memberof TxBlockchainSection
   */
  @computed get tx() {
    return this.props.tx;
  }

  @computed get hud() {
    return this.props.hud();
  }

  onTxHashPress = () => {
    this.props.onTxHashPress && this.props.onTxHashPress();
  };

  onCopyPress = () => {
    Clipboard.setString(this.tx.hash);
    this.hud && this.hud.showSuccess("已复制");
  };

  render() {
    return (
      <View style={txbsStyles.main}>
        <Text style={txbsStyles.key}>TxHash</Text>
        <View style={txbsStyles.txhashRow}>
          <View style={txbsStyles.txhashWrap}>
            <TouchableHighlight
              onPress={this.onTxHashPress}
              underlayColor="transparent"
              activeOpacity={0.7}
              hitSlop={{ top: 10, left: 10, right: 10, bottom: 10 }}>
              <Text style={txbsStyles.txhash} numberOfLines={1} ellipsizeMode={"middle"}>
                {this.tx.hash}
              </Text>
            </TouchableHighlight>
          </View>
          <Button icon={require("@img/icon/copy.png")} onPress={this.onCopyPress} />
        </View>
        <View style={txbsStyles.qrcodeContainer}>
          <View style={txbsStyles.blockContainer}>
            <Text style={[txbsStyles.key, { marginTop: 0 }]}>{i18n.tt(BIZ_SCOPE.wallet, "txdetail-confirmation")}</Text>
            <Text style={txbsStyles.value}>{this.tx.confirmations}</Text>
            <Text style={txbsStyles.key}>{i18n.tt(BIZ_SCOPE.wallet, "txdetail-height")}</Text>
            <Text style={txbsStyles.value}>{this.tx.blockHeight}</Text>
          </View>
          <QRCode value={this.tx.explorerURL} size={85} ecl="Q" />
        </View>
      </View>
    );
  }
}

const txbsStyles = StyleSheet.create({
  main: {
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  txhashRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    marginTop: 6,
    height: 16,
  },
  txhashWrap: {
    flex: 1,
    flexDirection: "row",
    marginRight: 20,
  },
  txhash: {
    fontSize: 12,
    color: theme.linkColor,
  },
  qrcodeContainer: {
    flex: 1,
    flexDirection: "row",
    marginTop: 16,
  },
  blockContainer: {
    flex: 1,
  },
  key: {
    marginTop: 16,
    fontSize: 12,
    height: 16,
    color: theme.textColor.mainTitle,
  },
  value: {
    marginTop: 6,
    fontSize: 12,
    height: 16,
    color: theme.textColor.primary,
  },
});
@observer
class TimeLine extends Component {
  render() {
    const { tx } = this.props;
    if (!(tx instanceof MultiSigTransaction)) {
      return null;
    }
    return [
      <View style={tlStyles.main} key="1">
        <Text style={tlStyles.title}>{i18n.t("wallet-tx-timeline")}</Text>
        <View style={tlStyles.separator} />
        <MultiSigTxTimeline tx={tx} />
      </View>,
      <View style={styles.separator} key="2" />,
    ];
  }
}

const tlStyles = StyleSheet.create({
  main: {
    paddingHorizontal: 16,
    backgroundColor: "#FFFFFF",
  },
  title: {
    marginVertical: 16,
    color: theme.textColor.primary,
    fontSize: 14,
    fontWeight: theme.fontWeight.medium,
  },
  separator: {
    marginBottom: 20,
    height: StyleSheet.hairlineWidth,
    backgroundColor: theme.borderColor,
  },
});
