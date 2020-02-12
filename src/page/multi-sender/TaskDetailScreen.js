import React from "react";
import { StyleSheet, ScrollView, View, Text, Image, TouchableHighlight, Dimensions } from "react-native";
import Screen from "../Screen";
import Theme from "../../util/Theme";
import ProgressHUD from "../../component/common/ProgressHUD";
import EmptyView from "../../component/common/EmptyView";
import Network from "../../module/common/network";
import i18n from "../../module/i18n/i18n";
import MultiSender from "../../module/multi-sender";
import theme from "../../util/Theme";

const { height, width } = Dimensions.get("window");

export default class BatchRecrod extends Screen {
  static navigatorStyle = {
    ...Theme.navigatorStyle,
    tabBarHidden: true,
    statusBarTextColorSchemeSingleScreen: "light",
    navBarButtonColor: "#FFFFFF",
    navBarBackgroundColor: Theme.linkColor,
    navBarTextColor: "#FFFFFF",
  };

  constructor(props) {
    super(props);
    this.state = {
      recordList: [],
      showLoading: true,
    };
  }
  componentDidMount() {
    this.getRecordList();
  }
  getRecordList = async () => {
    this.hud && this.hud.showLoading();
    const data = await MultiSender.fetchTaskDetail(this.props.taskUUID);
    if (data && data.length > 0) {
      this.setState({
        recordList: data,
      });
    }
    this.hud && this.hud.dismiss();
    this.setState({
      showLoading: false,
    });
  };

  onItemPress(item) {
    let url = "https://etherscan.io/tx/";
    if (Network.networkType === "test") {
      url = "https://ropsten.etherscan.io/tx/";
    }
    url += item.txhash;
    this.props.navigator.push({
      screen: "Webview",
      passProps: {
        url: url,
      },
    });
  }

  render() {
    return (
      <View style={styles.container}>
        <ProgressHUD ref={ref => (this.hud = ref)} />
        <ScrollView style={{ flex: 1 }}>
          <View style={{ flex: 1, backgroundColor: "#f8f9fe" }}>
            {this.state.showLoading || this.state.recordList.length > 0 ? (
              <View style={{ flex: 1 }}>
                <Text
                  style={{
                    backgroundColor: Theme.backgroundColor,
                    fontSize: 12,
                    color: Theme.textColor.mainTitle,
                    paddingLeft: 16,
                    paddingVertical: 9.5,
                  }}>
                  {i18n.t("qunfabao-order-list")}
                </Text>

                <View
                  style={{
                    backgroundColor: "#fff",
                    minHeight: height - 150,
                    paddingBottom: 60,
                  }}>
                  {this.state.recordList.map((item, index) => (
                    <TouchableHighlight
                      activeOpacity={0.6}
                      underlayColor="transparent"
                      onPress={this.onItemPress.bind(this, item)}
                      key={index}>
                      <View
                        style={{
                          flexDirection: "row",
                        }}>
                        <View style={styles.imgWrap}>
                          <Image source={require("@img/qunfabao/roll-out.png")} />
                        </View>
                        <View style={styles.contentContainer}>
                          <Text style={{ color: "#000", fontSize: 16, fontWeight: "500" }}>{item.name}</Text>
                          <View style={styles.infoWrap}>
                            <View style={[styles.row, { paddingTop: 4 }]}>
                              <Text style={styles.address} numberOfLines={1} ellipsizeMode="middle">
                                {item.address}
                              </Text>
                              <Text style={styles.amount}>-{item.amount}</Text>
                            </View>
                            <View style={[styles.row, { marginTop: 4 }]}>
                              <Text style={styles.date}>{item.creatDate}</Text>
                              <Text style={styles.status}>{i18n.t("qunfabao-order-success")}</Text>
                            </View>
                          </View>
                        </View>
                      </View>
                    </TouchableHighlight>
                  ))}
                </View>
              </View>
            ) : (
              <EmptyView
                title={i18n.t("qunfabao-no-order")}
                containerStyle={{
                  backgroundColor: "#f8f9fe",
                  height: height - 160,
                }}
              />
            )}
          </View>
        </ScrollView>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    flex: 1,
    paddingTop: 20,
  },
  imgWrap: {
    paddingLeft: 16,
    paddingTop: 20,
    paddingRight: 12,
  },
  infoWrap: {
    borderBottomColor: Theme.borderColor,
    borderBottomWidth: StyleSheet.hairlineWidth,
    flex: 1,
    paddingRight: 16,
    paddingBottom: 20,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  address: {
    width: 120,
    fontSize: 12,
    color: theme.linkColor,
  },
  amount: {
    color: "#FEA900",
    fontSize: 16,
    textAlign: "right",
    fontWeight: "500",
    fontFamily: Theme.alphanumericFontFamily,
  },
  date: {
    fontSize: 12,
    color: "#A7A7A7",
  },
  status: {
    fontSize: 12,
    color: "#A7A7A7",
    textAlign: "right",
  },
});
