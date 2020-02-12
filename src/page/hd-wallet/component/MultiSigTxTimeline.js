import React, { Component } from "react";
import { observable, computed } from "mobx";
import { StyleSheet, Image, View, Text } from "react-native";
import { observer } from "mobx-react";
import {
  MultiSigTransaction,
  MULTISIG_PENDING_TX_STATUS_REJECT,
  MULTISIG_PENDING_TX_STATUS_APPROVAL,
  MULTISIG_PENDING_TX_STATUS_WAITING,
  MULTISIG_PENDING_TX_STATUS_CANCEL,
} from "../../../module/wallet/wallet/MultiSigWallet";
import i18n from "../../../module/i18n/i18n";
import moment from "moment";
import _ from "lodash";
import theme from "../../../util/Theme";
import Svg, { Line } from "react-native-svg";

@observer
class MultiSigTxTimeline extends Component {
  /**
   *
   * @type {MultiSigTransaction}
   * @readonly
   * @memberof MultiSigTxTimeline
   */
  @computed get tx() {
    return this.props.tx;
  }
  @computed get nodes() {
    const tintColor = "#C7C7CD";
    const checkIcon = require("@img/wallet/tx_progress_unreach.png");
    const authorIcon = require("@img/wallet/multisig_tx_author.png");
    const failIcon = require("@img/wallet/multisig_tx_fail.png");

    const broadcast = {
      icon: checkIcon,
      desc: i18n.t("wallet-multisig-tx-timeline-broadcast"),
      timestamp: 0,
    };
    const waitings = this.tx.wallet.members
      .filter(member => !this.tx.actors.find(actor => actor.nick === member.nick))
      .map(member => ({
        icon: checkIcon,
        desc: `${member.nick} ${i18n.t("wallet-multisig-tx-timeline-waiting")}`,
        timestamp: 0,
        tintColor,
      }))
      .sort((a, b) => (a.nick === this.tx.wallet.self.nick ? 0 : 1));

    const approval = this.tx.actors.filter(actor => actor.status === MULTISIG_PENDING_TX_STATUS_APPROVAL).length;
    if (this.tx.wallet.required - approval <= 0 || this.tx.cancel) {
      waitings.length = 0;
    }

    const joins = this.tx.actors
      .slice()
      .sort((a, b) => a.timestamp - b.timestamp)
      .map(actor => ({
        icon: checkIcon,
        desc: `${actor.nick} ${
          actor.status === MULTISIG_PENDING_TX_STATUS_REJECT
            ? i18n.t("wallet-multisig-pending-tx-reject")
            : i18n.t("wallet-multisig-pending-tx-approval")
        }`,
        timestamp: actor.timestamp,
        tintColor,
        actor,
      }));

    if (joins.length > 0) {
      joins[0].icon = authorIcon;
      joins[0].desc = `${joins[0].actor.nick} ${i18n.t("wallet-multisig-tx-timeline-author")}`;
    }

    const nodes = _.compact([...joins, ...waitings, broadcast]);
    nodes[nodes.length - 1].first = true;

    joins.forEach(join => {
      join.solidLine = true;
      join.highlight = true;
      join.tintColor = theme.linkColor;
    });
    if (this.tx.authStatus === MULTISIG_PENDING_TX_STATUS_WAITING) {
      joins[joins.length - 1].solidLine = false;
    } else if (this.tx.authStatus === MULTISIG_PENDING_TX_STATUS_APPROVAL && !_.isNil(this.tx.hash)) {
      broadcast.highlight = true;
      broadcast.tintColor = "#7ED321";
      broadcast.timestamp = joins[joins.length - 1].timestamp;
    } else if (this.tx.authStatus === MULTISIG_PENDING_TX_STATUS_REJECT) {
      broadcast.highlight = true;
      broadcast.icon = failIcon;
      broadcast.desc = i18n.t("wallet-multisig-tx-timeline-reject");
      broadcast.timestamp = joins[joins.length - 1].timestamp;
    } else if (this.tx.authStatus === MULTISIG_PENDING_TX_STATUS_CANCEL) {
      broadcast.highlight = true;
      broadcast.icon = failIcon;
      broadcast.desc = `${this.tx.wallet.founder.nick} ${i18n.t("wallet-multisig-tx-timeline-cancel")}`;
    }

    return nodes;
  }
  render() {
    return (
      <View style={styles.main}>
        {this.nodes.map(node => (
          <Node key={node.desc} node={node} />
        ))}
      </View>
    );
  }
}

const styles = StyleSheet.create({
  main: {
    flex: 1,
    width: "100%",
  },
});

@observer
class Node extends Component {
  /**
   *
   * @memberof MultiSigTxTimelineNode
   */
  node = this.props.node;

  @computed get date() {
    return moment(this.node.timestamp * 1000).format("YYYY-MM-DD HH:mm:ss");
  }

  @computed get lineProps() {
    const props = {};
    if (!this.node.solidLine) {
      props.strokeDasharray = [3];
    }

    return props;
  }
  render() {
    return (
      <View style={nStyles.main}>
        {!this.node.first && (
          <Svg style={{ position: "absolute" }} height="100%" width={"10"}>
            <Line x1="8" y1="0" x2="8" y2="100%" stroke={theme.borderColor} strokeWidth={1} {...this.lineProps} />
          </Svg>
        )}
        <Image
          style={[nStyles.icon, { tintColor: this.node.tintColor }]}
          tintColor={this.node.tintColor}
          source={this.node.icon}
        />
        <View style={nStyles.wrap}>
          <Text style={[nStyles.desc, this.node.highlight && nStyles.latestText]}>{this.node.desc}</Text>
          {this.node.timestamp != 0 && (
            <Text style={[nStyles.date, this.node.highlight && nStyles.latestText]}>{this.date}</Text>
          )}
        </View>
      </View>
    );
  }
}

const nStyles = StyleSheet.create({
  main: {
    height: 76,
    flexDirection: "row",
  },
  wrap: {
    marginLeft: 6,
  },
  icon: {
    backgroundColor: "#FFFFFF",
  },
  desc: {
    fontSize: 14,
    color: theme.textColor.mainTitle,
  },
  latestText: {
    color: theme.textColor.primary,
  },
  date: {
    marginTop: 9,
    fontSize: 14,
    color: theme.textColor.mainTitle,
  },
});

export default MultiSigTxTimeline;
