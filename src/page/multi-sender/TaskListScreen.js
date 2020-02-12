import React from "react";
import { StyleSheet, ScrollView, View } from "react-native";
import Screen from "../Screen";
import Theme from "../../util/Theme";
import Footer from "../../component/common/Footer";
import { Button } from "react-native-elements";
import ProgressHUD from "../../component/common/ProgressHUD";
import TaskListComponent from "./component/TaskListComponent";
import EmptyView from "../../component/common/EmptyView";
import i18n from "../../module/i18n/i18n";
import MultiSender from "../../module/multi-sender";

export default class TaskListScreen extends Screen {
  static navigatorStyle = {
    ...Theme.navigatorStyle,
    tabBarHidden: true,
    statusBarTextColorSchemeSingleScreen: "light",
    navBarButtonColor: "#FFFFFF",
    navBarBackgroundColor: Theme.linkColor,
    navBarTextColor: "#fff",
  };

  constructor(props) {
    super(props);
    this.state = {
      taskList: [],
      showLoading: true,
    };
    this.props.navigator.addOnNavigatorEvent(this.onNavigatorEvent.bind(this));
  }

  onNavigatorEvent(event) {
    switch (event.id) {
      case "willAppear":
        this.getTaskList();
        break;
    }
  }

  onCreatePress = () => {
    this.props.navigator.push({
      screen: "MultiSenderSelectCoinScreen",
    });
  };

  getTaskList = async () => {
    this.hud && this.hud.showLoading();
    try {
      await this.fetchTaskList();
    } catch (error) {}
    this.hud && this.hud.dismiss();
  };
  fetchTaskList = async () => {
    const list = await MultiSender.fetchTaskList();
    this.setState({
      taskList: list,
    });
    this.setState({ showLoading: false });
  };

  async doDeleteItem(item) {
    this.hud && this.hud.showLoading();
    let r = await MultiSender.deleteTask(item.task_uuid);
    if (r && r.data) {
      await this.fetchTaskList();
    } else {
      this.hud.showFailed(i18n.t("qunfabao-delete-error"));
    }
    this.hud && this.hud.dismiss();
  }

  renderNoData() {
    if (this.state.showLoading) {
      return <View style={{ flex: 1 }}></View>;
    } else {
      return (
        <EmptyView
          title={i18n.t("qunfabao-no-data")}
          containerStyle={{
            backgroundColor: "#f8f9fe",
            // height: 200
          }}
        />
      );
    }
  }

  render() {
    return (
      <View style={styles.container}>
        <ProgressHUD ref={ref => (this.hud = ref)} />
        {this.state.taskList.length > 0 ? (
          <ScrollView style={{ flex: 1 }}>
            <TaskListComponent
              navigator={this.props.navigator}
              data={{ taskList: this.state.taskList }}
              onDeleteItemPress={this.doDeleteItem.bind(this)}
            />
          </ScrollView>
        ) : (
          this.renderNoData()
        )}
        <Footer>
          <Button
            title={i18n.t("qunfabao-create-task")}
            onPress={this.onCreatePress}
            containerStyle={styles.nextButtonContainer}
            buttonStyle={styles.nextButton}></Button>
        </Footer>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#f2f3f4",
    height: "100%",
  },
  nextButtonContainer: {
    flex: 1,
  },
  nextButton: {
    width: "100%",
    height: 50,
    borderRadius: 4,
    backgroundColor: Theme.linkColor,
    elevation: 0,
  },
});
