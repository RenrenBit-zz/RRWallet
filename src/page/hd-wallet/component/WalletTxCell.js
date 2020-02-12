import React, { Component } from "react";
import { StyleSheet, View, TouchableHighlight, Image, Text } from "react-native";
import {
  Transaction,
  TX_STATUS_PENDING,
  TX_STATUS_CONFIRMING,
  TX_STATUS_SUCCESS,
  TX_STATUS_FAILED,
  TX_TYPE_IN,
} from "../../../module/wallet/wallet/WalletTxStore";
import theme from "../../../util/Theme";
import { observer } from "mobx-react";
import { computed } from "mobx";
import { toFixedLocaleString } from "../../../util/NumberUtil";
import i18n from "../../../module/i18n/i18n";
import { BIZ_SCOPE } from "../../../module/i18n/const";

const moment = require("moment");
const statusColor = "#F5A623";
@observer
export default class WalletTxCell extends Component {
  /**
   *
   * @type {Transaction}
   * @memberof WalletTxCell
   */
  @computed get tx() {
    return this.props.tx;
  }

  @computed get typeText() {
    return this.tx.type == TX_TYPE_IN ? i18n.t("wallet-txcell-type-receive") : i18n.t("wallet-txcell-type-send");
  }
  @computed get typeSymbol() {
    return this.tx.type == TX_TYPE_IN ? "+" : "-";
  }
  @computed get addressDesc() {
    let orientation = "";
    let address = "";
    let multi = "";
    if (this.tx.type === TX_TYPE_IN) {
      orientation = i18n.t("wallet-txcell-type-receive-desc");
      address = this.tx.from;
      multi =
        this.tx.froms.length > 1
          ? i18n.tt(BIZ_SCOPE.wallet, "txcell-multi-address", { amount: this.tx.froms.length })
          : "";
    } else {
      orientation = i18n.t("wallet-txcell-type-send-desc");
      address = this.tx.to;
      multi =
        this.tx.tos.length > 1 ? i18n.tt(BIZ_SCOPE.wallet, "txcell-multi-address", { amount: this.tx.tos.length }) : "";
    }
    return `${orientation} ${address} ${multi}`;
    // return `${this.tx.type == 1? i18n.t("wallet-txcell-type-receive-desc"): i18n.t("wallet-txcell-type-send-desc")} ${this.tx.type == 1? this.tx.from: this.tx.to}${multi}`
  }
  @computed get statusIcon() {
    return this.tx.type == 1 ? require("@img/wallet/tx_in.png") : require("@img/wallet/tx_out.png");
  }
  @computed get date() {
    return moment.unix(this.tx.timestamp).format("YYYY.MM.DD HH:mm:ss");
  }
  @computed get statusText() {
    switch (this.tx.status) {
      case 0:
      case TX_STATUS_PENDING:
        return i18n.t("wallet-tx-status-pending");
      case TX_STATUS_CONFIRMING:
        return this.tx.confirmations > 0 ? i18n.t("wallet-tx-status-success") : i18n.t("wallet-tx-status-pending");
      case TX_STATUS_SUCCESS:
        return i18n.t("wallet-tx-status-success");
      case TX_STATUS_FAILED:
        return i18n.t("wallet-tx-status-failed");
      default:
        return "";
    }
  }
  _onPress = () => {
    const { onPress } = this.props;
    onPress && onPress(this.tx);
  };
  render() {
    return (
      <TouchableHighlight style={styles.highlight} onPress={this._onPress}>
        <View style={styles.item}>
          <Image source={this.statusIcon} style={styles.icon} />
          <View style={styles.container}>
            <View style={styles.row}>
              <Text style={styles.name}>{this.typeText}</Text>
              <Text style={styles.amount}>
                {this.typeSymbol}
                {toFixedLocaleString(this.tx.amount, 18)} {this.tx.tokenName}
              </Text>
            </View>
            <Text numberOfLines={1} ellipsizeMode={"middle"} style={styles.address}>
              {this.addressDesc}
            </Text>
            {!!this.tx.note && this.tx.note.length > 0 && <Text style={styles.note}>{this.tx.note}</Text>}
            <View style={styles.row}>
              <Text style={styles.date}>{this.date}</Text>
              <Text style={[styles.date, { color: statusColor }]}>{this.statusText}</Text>
            </View>
          </View>
        </View>
      </TouchableHighlight>
    );
  }
}

const styles = StyleSheet.create({
  highlight: {
    backgroundColor: "#FFFFFF",
  },
  item: {
    paddingHorizontal: 16,
    paddingVertical: 18,
    flexDirection: "row",
  },
  container: {
    marginLeft: 12,
    flex: 1,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  icon: {
    width: 24,
    height: 24,
    marginTop: 8,
  },
  name: {
    height: 20,
    color: theme.textColor.primary,
    fontSize: 16,
    fontWeight: theme.fontWeight.medium,
  },
  address: {
    marginTop: 4,
    height: 16,
    width: 220,
    color: theme.textColor.primary,
    fontSize: 12,
    flexShrink: 1,
  },
  amount: {
    height: 20,
    color: theme.textColor.primary,
    fontSize: 16,
    fontWeight: theme.fontWeight.medium,
    fontFamily: theme.alphanumericFontFamily,
  },
  date: {
    marginTop: 8,
    height: 16,
    color: theme.textColor.mainTitle,
    fontSize: 12,
    fontFamily: theme.alphanumericFontFamily,
  },
  note: {
    fontSize: 12,
    lineHeight: 16,
    color: theme.textColor.mainTitle,
    marginTop: 3,
    marginBottom: 2,
  },
});
