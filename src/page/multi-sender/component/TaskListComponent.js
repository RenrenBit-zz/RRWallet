import React, { Component } from "react";
import { StyleSheet, View, Text, Image, TouchableWithoutFeedback, Alert } from "react-native";
import Theme from "../../../util/Theme";
import Cell from "../../../component/common/Cell";
import ProgressBarComponent from "./ProgressBarComponent";
import Swipeout from "react-native-swipeout";
import i18n from "../../../module/i18n/i18n";

export default class TaskListComponent extends Component {
  constructor(props) {
    super(props);
    this.state = {
      taskList: [],
    };
  }

  async itemPress(item) {
    let passProps = {
      tokenName: item.token_name,
      tokenId: item.token_info_id,
      tokenAddress: item.token_address,
      recipientUUID: item.recipient_uuid,
      taskUUID: item.task_uuid,
      walletAddress: item.wallet_address,
    };

    if (item.recordCount > 0 && item.recordCount >= item.personCount) {
      this.props.navigator.push({
        screen: "MultiSenderTaskDetailScreen",
        title: item.token_name,
        passProps: passProps,
      });
    } else {
      this.props.navigator.push({
        screen: "MultiSenderTaskExecutorScreen",
        title: item.token_name,
        passProps: {
          coinID: item.token_info_id,
          recipientID: item.recipient_uuid,
          taskID: item.task_uuid,
        },
      });
    }
  }

  deleteRecordeConfirm(item, index) {
    Alert.alert("", i18n.t("qunfabao-confirm-del-record"), [
      {
        text: i18n.t("qunfabao-confirm-cancel"),
        onPress: () => {},
      },
      {
        text: i18n.t("qunfabao-confirm-ok"),
        onPress: () => {
          this.props.onDeleteItemPress && this.props.onDeleteItemPress(item, index);
        },
      },
    ]);
  }

  renderItemInner(item, index) {
    return (
      <TouchableWithoutFeedback
        activeOpacity={0.6}
        underlayColor="transparent"
        onPress={this.itemPress.bind(this, item)}>
        <View style={styles.inner}>
          <Cell
            title={item.token_name}
            titleStyle={{
              fontSize: 24,
              color: "#000",
              fontWeight: "500",
            }}
            hideRightArrow={true}
            rightNode={<Image source={require("@img/qunfabao/icon_arrow.png")} />}
            cellHeight={64}
          />
          <View style={styles.info1}>
            <View style={{ width: 114 }}>
              <Text style={styles.label}>{i18n.t("qunfabao-create-time")}</Text>
              <Text style={styles.value}>{item.creatDate}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.label}>{i18n.t("qunfabao-ready-send-amount")}</Text>
              <Text style={styles.value}>{item.totalAmount}</Text>
            </View>
          </View>
          <ProgressBarComponent data={item} />
        </View>
      </TouchableWithoutFeedback>
    );
  }

  renderItem(item, index) {
    return (
      <View style={{ backgroundColor: "#fff", marginTop: index === 0 ? 0 : 12 }} key={index}>
        <Swipeout
          style={styles.swipeWrap}
          autoClose={true}
          right={[
            {
              backgroundColor: "#eb4c3f",
              color: "#fff",
              text: i18n.t("qunfabao-del-task"),
              type: "delete",
              onPress: () => {
                this.deleteRecordeConfirm.call(this, item, index);
              },
            },
          ]}>
          {this.renderItemInner(item, index)}
        </Swipeout>
      </View>
    );
  }

  render() {
    let data = this.props.data;
    return (
      <View style={styles.listContainer}>
        {data.taskList.map((item, index) => {
          return this.renderItem(item, index);
        })}
      </View>
    );
  }
}

const styles = StyleSheet.create({
  listContainer: {},
  swipeWrap: {
    backgroundColor: "#fff",
  },
  inner: {
    backgroundColor: "#fff",
  },
  info1: {
    marginTop: -5,
    flexDirection: "row",
    paddingLeft: 16,
    paddingBottom: 16,
    borderBottomColor: "#eee",
    borderBottomWidth: 0.5,
  },
  label: {
    fontSize: 12,
    color: "#A7A7A7",
  },
  value: {
    fontSize: 14,
    color: "#000",
    paddingTop: 8,
    fontWeight: "500",
    fontFamily: Theme.alphanumericFontFamily,
  },
});
