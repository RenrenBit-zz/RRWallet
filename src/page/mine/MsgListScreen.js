import React, { Component } from "react";
import {
  StyleSheet,
  View,
  FlatList,
  Platform,
  Linking,
  AppState,
  Text,
  Image,
  TouchableHighlight,
  NativeModules,
  DeviceEventEmitter,
} from "react-native";

import EmptyView from "../../component/common/EmptyView";

import MessageCenter, { MSG_TYPE_ID } from "../../module/msg-center/MessageCenter";
import Screen from "../Screen";
import theme from "../../util/Theme";
import { PushEnabled, checkNotificationPermissions } from "../../module/notification/notification";
import Header from "../../component/common/Header";
import ActionSheet from "react-native-actionsheet";
import i18n from "../../module/i18n/i18n";
import { observer } from "mobx-react";
import { observable } from "mobx";
import { I18N_LANGUAGE_CHANGE_NOTIFICATION } from "../../config/const";
import ProgressHUD from "../../component/common/ProgressHUD";
import moment from "moment";

const msgTypes = [
  { type: MSG_TYPE_ID.all, title: i18n.t("mine-msg-type-all") },
  { type: MSG_TYPE_ID.wallet, title: i18n.t("mine-msg-type-hd") },
  { type: MSG_TYPE_ID.multiSig, title: i18n.t("mine-msg-type-multisig") },
];

DeviceEventEmitter.addListener(I18N_LANGUAGE_CHANGE_NOTIFICATION, () => {
  msgTypes.length = 0;
  msgTypes.push(
    ...[
      { type: MSG_TYPE_ID.all, title: i18n.t("mine-msg-type-all") },
      { type: MSG_TYPE_ID.wallet, title: i18n.t("mine-msg-type-hd") },
      { type: MSG_TYPE_ID.multiSig, title: i18n.t("mine-msg-type-multisig") },
    ]
  );
  titles.length = 0;
  titles.push(...msgTypes.map(el => el.title));
});

const titles = msgTypes.map(el => el.title);

@observer
export default class MsgListScreen extends Screen {
  static get screenID() {
    return "MsgListScreen";
  }
  static navigatorButtons = {
    leftButtons: Screen.navigatorButtons.leftButtons,
    rightButtons: [
      {
        title: `${i18n.t("common-allread")}  `,
        id: "setMessageReaded",
        testID: "setMessageReaded",
        buttonColor: theme.linkColor,
        buttonFontSize: 14,
      },
    ],
  };

  static navigatorStyle = {
    ...Screen.navigatorStyle,
    navBarHidden: true,
  };

  @observable page = 1;

  @observable isLoading = true;

  @observable hasMore = true;

  @observable msgTypeId = MSG_TYPE_ID.all;

  handleHUDRef = ref => (this.hud = ref);

  constructor(props) {
    super(props);

    this.state = {
      messageList: [],
      pushEnabled: PushEnabled,
      index: 0,
    };

    this.props.navigator.addOnNavigatorEvent(this.onNavigatorEvent.bind(this));
    AppState.addEventListener("change", nextAppState => {
      if (nextAppState == "active") {
        this.getNotoficationPermission();
      }
    });
    this.getNotoficationPermission();
  }

  async onNavigatorEvent(event) {
    if (event.type == "NavBarButtonPress") {
      if (event.id == "setMessageReaded") {
        this.setAllMessageReaded();
      }
    } else {
      switch (event.id) {
        case "willAppear":
          break;
        case "didAppear":
          break;
        case "willDisappear":
          break;
        case "didDisappear":
          break;
        case "willCommitPreview":
          break;
      }
    }
  }

  async componentWillMount() {
    await this.getMsgList();
  }

  async getMsgList() {
    this.isLoading = true;
    this.hud && this.hud.showLoading();
    const messageList = await MessageCenter.getMsgByType(this.msgTypeId, this.page);
    if (messageList.length === 0) {
      this.hasMore = false;
    }

    this.isLoading = false;
    this.hud && this.hud.dismiss();
    this.setState({
      messageList: [...this.state.messageList, ...messageList],
    });
  }

  // 设置所有消息已读
  async setAllMessageReaded() {
    this.hud && this.hud.showLoading();
    const setRes = await MessageCenter.setAllReaded();
    if (setRes) {
      this.setLocalAllMessageReaded();
    }
    this.hud && this.hud.dismiss();
  }
  getNotoficationPermission() {
    checkNotificationPermissions(pushEnabled => {
      this.setState({ pushEnabled });
    });
  }
  bindActionSheet = ref => (this.actionSheet = ref);
  // 设置本地消息全部已读
  setLocalAllMessageReaded() {
    this.state.messageList.forEach(item => {
      item.readStatus = 1;
    });
    this.setState({
      messageList: [...this.state.messageList],
    });
  }
  onTitlePress = () => {
    this.actionSheet.show();
  };
  onActionSheetItemPress = index => {
    if (index == msgTypes.length) {
      return;
    }

    if (this.state.index === index) {
      return;
    }

    this.msgTypeId = msgTypes[index].type;
    this.page = 1;
    this.hasMore = true;

    this.setState({
      index,
      messageList: [],
    });
    this.getMsgList();
  };
  _onEndReached = async () => {
    if (!this.hasMore) {
      return;
    }

    if (this.isLoading) {
      return;
    }

    this.page = this.page + 1;
    await this.getMsgList();
  };
  _renderSeparator = () => <View style={styles.separator} />;
  _renderEmptyComponent = () => (
    <EmptyView imageSource={require("@img/mine/empty_message.png")} title={i18n.t("mine-msg-nomsg")} />
  );
  _renderHeaderComponent = () => {
    <PushSwitchCard />;
  };
  _keyExtractor = item => item.id + "";
  render() {
    return (
      <View style={styles.container}>
        <Header
          leftButtons={MsgListScreen.navigatorButtons.leftButtons}
          rightButtons={MsgListScreen.navigatorButtons.rightButtons}
          navigator={this.props.navigator}
          style={styles.header}
          renderTitleComponent={() => (
            <TouchableHighlight activeOpacity={0.6} underlayColor="transparent" onPress={this.onTitlePress}>
              <View style={styles.titleWrap}>
                <Text style={styles.title}>{titles[this.state.index]}</Text>
                <Image source={require("@img/wallet/arrow_down.png")} style={styles.arrow} />
              </View>
            </TouchableHighlight>
          )}
        />
        <ProgressHUD ref={this.handleHUDRef} />
        <FlatList
          data={this.state.messageList}
          ListEmptyComponent={this._renderEmptyComponent}
          ItemSeparatorComponent={this._renderSeparator}
          keyExtractor={this._keyExtractor}
          renderItem={item => <MsgCell navigator={this.props.navigator} messageItem={item.item} />}
          contentContainerStyle={styles.listContainer}
          onEndReached={this._onEndReached}
          onEndReachedThreshold={0.2}
        />
        <ActionSheet
          onPress={this.onActionSheetItemPress}
          ref={this.bindActionSheet}
          cancelButtonIndex={msgTypes.length}
          options={[...titles, "取消"]}
        />
      </View>
    );
  }
}

class PushSwitchCard extends Component {
  toSystemSetting = () => {
    if (Platform.OS === "ios") {
      Linking.openURL("app-settings:");
    } else {
      NativeModules.RRRNDevice.openNotification();
    }
  };
  render() {
    return (
      <View style={pscStyles.remindNotifyCard}>
        <View>
          <Text style={pscStyles.remindTitle}>打开推送通知</Text>
          <Text style={pscStyles.remindSubTitle}>以免错过交易推送、空投福利信息等</Text>
        </View>
        <TouchableHighlight onPress={this.toSystemSetting} activeOpacity={0.6} underlayColor="transparent">
          <Text style={pscStyles.remindButton}>开启</Text>
        </TouchableHighlight>
      </View>
    );
  }
}

const pscStyles = StyleSheet.create({
  remindNotifyCard: {
    height: 80,
    flexDirection: "row",
    alignItems: "center",
    marginTop: 14,
    justifyContent: "space-between",
    marginHorizontal: 16,
    paddingHorizontal: 16,
    marginBottom: 2,
    backgroundColor: theme.white,
    borderRadius: 3,
  },
  remindTitle: {
    color: theme.textColor.primary,
    fontSize: 16,
    marginBottom: 8,
  },
  remindSubTitle: {
    fontSize: 12,
    color: theme.textColor.mainTitle,
  },
  remindButton: {
    fontSize: 16,
    color: theme.linkColor,
  },
});

const styles = StyleSheet.create({
  container: {
    backgroundColor: theme.backgroundColor,
    flex: 1,
  },
  header: {
    backgroundColor: "#FFFFFF",
  },
  titleWrap: {
    flexDirection: "row",
    alignItems: "center",
  },
  title: {
    fontSize: 18,
    fontWeight: theme.fontWeight.medium,
    color: theme.textColor.primary,
  },
  arrow: {
    marginLeft: 6,
  },
  listContainer: {
    paddingTop: 12,
  },
  msgTitleContainer: {
    padding: 15,
    paddingTop: 12,
    paddingBottom: 12,
  },
  msgTitle: {
    color: "#CCCCCC",
    fontSize: 10,
  },
  separator: {
    height: 12,
    backgroundColor: theme.backgroundColor,
  },
});

class MsgCell extends Component {
  get typeIcon() {
    switch (this.state.messageItem.type) {
      case MSG_TYPE_ID.wallet:
        return require("@img/mine/msg/msg_type_wallet.png");
      case MSG_TYPE_ID.multiSig:
        return require("@img/mine/msg/msg_multisig.png");
    }
  }
  constructor(props) {
    super(props);
    const { messageItem, messageIndex } = props;
    this.state = {
      messageItem,
      messageIndex,
    };
  }

  // 跳消息详情
  toMsgDetail = () => {
    const { messageItem } = this.state;
    console.log("设置消息已读", messageItem);

    if (messageItem.readStatus === 0) {
      messageItem.readStatus = 1;
      this.setState({ messageItem });
      MessageCenter.setSingleReaded(messageItem.id);
    }

    // 跳消息详情
    messageItem.readStatus = 1;
    URLRouter.open(messageItem.param, this.props.navigator);
  };

  render() {
    const { messageItem } = this.state;
    return (
      <TouchableHighlight onPress={this.toMsgDetail} style={msStyles.wrap}>
        <View style={msStyles.main}>
          <View style={msStyles.iconWrap}>
            <View style={[msStyles.dot, messageItem.readStatus !== 0 && msStyles.readDot]} />
            <Image source={this.typeIcon} />
          </View>
          <View style={msStyles.msgContainer}>
            <Text style={msStyles.msgTitle}>{messageItem.title}</Text>
            <Text style={msStyles.msgContent}>{messageItem.content}</Text>
            <Text style={msStyles.date}>{moment(parseInt(messageItem.gmtCreate)).format("MM/DD/YYYY HH:mm:ss")}</Text>
          </View>
        </View>
      </TouchableHighlight>
    );
  }
}

const msStyles = StyleSheet.create({
  wrap: {
    backgroundColor: "#FFFFFF",
  },
  main: {
    padding: 16,
    flexDirection: "row",
  },
  msgContainer: {
    flex: 1,
    marginLeft: 12,
  },
  msgContent: {
    marginBottom: 9,
    fontSize: 12,
    lineHeight: 16,
    color: theme.textColor.primary,
  },
  msgTitle: {
    marginBottom: 6,
    fontSize: 16,
    color: theme.textColor.primary,
    fontWeight: theme.fontWeight.medium,
  },
  date: {
    fontSize: 12,
    color: theme.textColor.mainTitle,
    fontFamily: theme.alphanumericFontFamily,
  },
  readStatus: {
    position: "absolute",
    right: 0,
    bottom: 0,
  },
  iconWrap: {
    flexDirection: "row",
    alignItems: "center",
    height: 36,
  },
  dot: {
    marginRight: 6,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: theme.assistColor_red,
  },
  readDot: {
    opacity: 0,
  },
});

export { PushSwitchCard };
