import React, { Component } from "react";
import { StyleSheet, View, DeviceEventEmitter, Text, FlatList, TouchableWithoutFeedback, Image } from "react-native";

import EmptyView from "../../component/common/EmptyView";
import { Icon } from "react-native-elements";
import Contact from "../../module/contact";
import SwipeView from "react-native-swipeout";
import Screen from "../Screen";
import Device from "../../util/device";
import theme from "../../util/Theme";
import i18n from "../../module/i18n/i18n";
import { BIZ_SCOPE } from "../../module/i18n/const";

export default class ContactScreen extends Screen {
  static get screenID() {
    return "ContactScreen";
  }
  // 右上角button
  static navigatorButtons = {
    leftButtons: Screen.navigatorButtons.leftButtons,
    rightButtons: [
      {
        // title: '+',
        icon: require("@img/icon/icon_nav_add.png"),
        id: "addContact",
        testID: "addContact",
        buttonFontSize: 32,
        buttonFontWeight: "100",
      },
    ],
  };

  constructor(props) {
    super(props);

    this.state = {
      isAllowScroll: true,
      isLoading: true,
      page: 1,
      contactList: [],
      activeRowKey: null,
    };

    this.props.navigator.addOnNavigatorEvent(this.onNavigatorEvent.bind(this));

    DeviceEventEmitter.addListener("newContactAdded", p => {
      this.refreshLoacalAddedContact(p);
    });
  }

  deleteContact(contact) {
    console.log("删除联系人", contact);
    Contact.delete(contact.id);
    this.getContactList();
  }

  async getContactList() {
    const contactList = await Contact.getContactList();
    console.info("当前钱包联系人列表===>>", contactList);
    this.setState({
      contactList,
      isLoading: false,
    });
  }

  // 导航栏事件
  onNavigatorEvent(event) {
    console.log("联系人事件===>>", event);
    if (event.type == "NavBarButtonPress") {
      if (event.id == "addContact") {
        this.props.navigator.push({
          screen: "AddContactScreen",
          title: i18n.tt(BIZ_SCOPE.mine, "contact-add"),
        });
      }
    } else {
      switch (event.id) {
        case "willAppear":
          break;
        case "didAppear": // pop 回退会触发该事件
          this.getContactList();
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

  refreshLoacalAddedContact(p) {
    let list = this.state.contactList || [];

    this.setState({
      contactList: list,
    });
  }

  pressCell(contact) {
    if (this.props.onSelectedContact) {
      this.props.onSelectedContact(contact);
      this.props.navigator.pop();
      return;
    }

    this.props.navigator.push({
      screen: "AddContactScreen",
      title: i18n.tt(BIZ_SCOPE.mine, "contact-add"),
      passProps: {
        contact: contact,
      },
    });
  }

  render() {
    return (
      <View style={styles.container}>
        {!this.state.isLoading && this.state.contactList.length === 0 && (
          <EmptyView imageSource={require("@img/mine/empty_contact.png")} title={i18n.t("mine-contact-nocontact")} />
        )}
        {!this.state.isLoading && (
          <FlatList
            scrollEnabled={this.state.isAllowScroll}
            data={this.state.contactList}
            renderItem={(item, index) => {
              const contact = item.item;
              return (
                <SwipeView
                  style={{ marginVertical: 10 }}
                  autoClose={true}
                  rowId={index}
                  key={index}
                  onOpen={(sectionID, rowId) => {
                    this.setState({
                      activeRowKey: rowId,
                      isAllowScroll: false,
                    });
                  }}
                  onClose={(sectionID, rowId) => {
                    this.setState({
                      activeRowKey: rowId,
                      isAllowScroll: true,
                    });
                  }}
                  right={[
                    {
                      backgroundColor: "red",
                      color: "white",
                      text: "删除",
                      type: "delete",
                      onPress: () => {
                        this.deleteContact.call(this, contact);
                      },
                    },
                  ]}>
                  <ContactCell key={index} contact={contact} onPress={() => this.pressCell.call(this, contact)} />
                </SwipeView>
              );
            }}
          />
        )}
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: theme.backgroundColor,
    height: "100%",
  },

  itemStyle: {
    marginTop: 10,
    marginBottom: 10,
  },
  listContainer: {
    paddingBottom: Device.isIPhoneX ? Device.iPhoneXSafeArea.bottom : 0,
  },
});

class ContactCell extends Component {
  render() {
    const { contact } = this.props;

    return (
      <TouchableWithoutFeedback onPress={this.props.onPress}>
        <View style={[ccStyles.container, this.props.containerStyle]}>
          <View style={ccStyles.titleWrap}>
            <Text style={ccStyles.title}>{contact.type}</Text>
          </View>
          <View style={ccStyles.right}>
            <View style={ccStyles.nameContainer}>
              <Text style={ccStyles.name}>{contact.name}</Text>
              <Image source={require("@img/icon/arrow-right.png")} />
            </View>
            <Text numberOfLines={2} style={ccStyles.text}>
              {contact.address}
            </Text>
          </View>
        </View>
      </TouchableWithoutFeedback>
    );
  }
}

const ccStyles = StyleSheet.create({
  container: {
    flex: 1,
    width: "100%",
    backgroundColor: "#ffffff",
    display: "flex",
    flexDirection: "row",
    justifyContent: "flex-start",
  },
  titleWrap: {
    width: 56,
  },
  title: {
    lineHeight: 30,
    marginTop: 16,
    marginLeft: 16,
  },

  right: {
    marginRight: 16,
    flex: 1,
    display: "flex",
    flexDirection: "column",
    justifyContent: "flex-start",
  },

  nameContainer: {
    height: 30,
    marginTop: 16,
    display: "flex",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  name: {
    flex: 1,
    fontWeight: "700",
    fontSize: 14,
    color: theme.textColor.primary,
  },

  text: {
    fontSize: 14,
    color: theme.textColor.mainTitle,
    paddingTop: 11,
    paddingBottom: 16,
  },
});
