import React, { Component } from "react";
import { View, StyleSheet, Image, Text, Animated } from "react-native";
import { observer } from "mobx-react";
import i18n from "../../../module/i18n/i18n";
import theme from "../../../util/Theme";
import { padding } from "../../../util/UIAdapter";
import Button from "../../../component/common/Button";

@observer
class BackupSection extends Component {
  render() {
    if (this.props.account.hasBackup || this.props.account.wallets.length == 0) {
      return null;
    }
    return (
      <View style={bsStyles.main}>
        <View style={bsStyles.descWrap}>
          <Text style={bsStyles.desc}>{i18n.t("wallet-hdindex-backupdesc")}</Text>
        </View>
        <Button
          icon={require("@img/wallet/wallet_backup.png")}
          title={i18n.t("wallet-hdindex-backup")}
          style={bsStyles.buttonStyle}
          titleStyle={bsStyles.titleStyle}
          onPress={this.props.onPress}
        />
      </View>
    );
  }
}

const AnimatedBackupSection = Animated.createAnimatedComponent(BackupSection);
const bsStyles = StyleSheet.create({
  main: {
    backgroundColor: "#FEF7EA",
    paddingHorizontal: 16,
    height: 48,
    flexDirection: "row",
    alignItems: "center",
  },
  descWrap: {
    flex: 1,
  },
  title: {
    color: theme.textColor.primary,
    fontWeight: theme.fontWeight.medium,
    fontSize: 12,
  },
  desc: {
    color: "#FEA900",
    fontSize: 14,
  },
  buttonStyle: {
    height: 26,
    width: 88,
    borderRadius: 13,
    backgroundColor: "#FEA900",
    elevation: 0,
  },
  titleStyle: {
    position: "relative",
    top: 1,
    marginLeft: 6,
    color: "#FFFFFF",
    fontSize: 12,
  },
});

export default BackupSection;
export { AnimatedBackupSection };
