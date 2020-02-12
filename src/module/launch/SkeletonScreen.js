import React, { Component } from "react";
import { StyleSheet, View } from "react-native";
import Screen from "../../page/Screen";
import TabContainer from "../../component/tab/TabContainer";
import i18n from "../i18n/i18n";
import { Navigation } from "react-native-navigation";
import { observer } from "mobx-react";
import { computed, observable } from "mobx";
import theme from "../../util/Theme";
import splash from "./splash";
import { SPLASH_SCENE_TAB } from "../../config/const";

@observer
export default class SkeletonScreen extends Screen {
  static get screenID() {
    return "SkeletonScreen";
  }
  @computed get tabs() {
    const tabs = [
      {
        getLabel: () => i18n.t("common-tab-hd"),
        screen: "HDWalletScreen",
        icon: require("@img/tab/wallet-normal.png"),
        selectedIcon: require("@img/tab/wallet-selected.png"),
      },
      {
        getLabel: () => i18n.t("common-tab-multisig"),
        screen: "MultiSigWalletScreen",
        icon: require("@img/tab/multisig-normal.png"),
        selectedIcon: require("@img/tab/multisig-selected.png"),
      },
      {
        getLabel: () => i18n.t("common-tab-mine"),
        screen: "MineScreen",
        icon: require("@img/tab/mine-normal.png"),
        selectedIcon: require("@img/tab/mine-selected.png"),
      },
    ];
    return tabs;
  }
  @computed get tabItems() {
    return this.tabs.map((tab, index) => {
      return {
        label: tab.getLabel(),
        icon: tab.icon,
        selectedIcon: tab.selectedIcon,
        lazy: tab.lazy,
        selectedLabelColor: theme.brandColor,
        labelColor: "#929292",
      };
    });
  }
  @observable index = 0;
  navigatorEventHandler = {};
  constructor(props) {
    super(props);
    this.init();
  }
  init = () => {
    this.props.navigator.addOnNavigatorEvent(this.onNavigatorEvent);
  };
  onNavigatorEvent = event => {
    this.handleNavigatorEvent(event);
  };
  handleNavigatorEvent = event => {
    const handlers = this.navigatorEventHandler[this.index];
    if (handlers) {
      handlers.forEach(handler => handler && handler(event));
    }
  };
  componentDidMount = () => {
    splash.dismissIfNeed(SPLASH_SCENE_TAB);
  };
  onIndexChange = index => {
    this.handleNavigatorEvent({ type: "ScreenChangedEvent", id: "willDisappear" });
    this.handleNavigatorEvent({ type: "ScreenChangedEvent", id: "didDisappear" });
    this.index = index;
    this.handleNavigatorEvent({ type: "ScreenChangedEvent", id: "willAppear" });
    this.handleNavigatorEvent({ type: "ScreenChangedEvent", id: "didAppear" });
    const screen = Navigation.getRegisteredScreen(this.tabs[index].screen);

    let navigatorStyle = screen.navigatorStyle;

    this.props.navigator.setStyle(navigatorStyle);
  };
  renderScreen = index => {
    const addOnNavigatorEvent = callback => {
      if (!callback) {
        return;
      }
      if (!this.navigatorEventHandler[index]) {
        this.navigatorEventHandler[index] = [];
      }
      this.navigatorEventHandler[index].push(callback);
    };
    const clone = Object.assign(Object.create(Object.getPrototypeOf(this.props.navigator)), this.props.navigator);
    clone.addOnNavigatorEvent = addOnNavigatorEvent;
    const screen = Navigation.getRegisteredScreen(this.tabs[index].screen);
    const element = React.createElement(screen, {
      navigator: clone,
    });
    return element;
  };
  render() {
    return (
      <View style={styles.main}>
        <TabContainer renderScreen={this.renderScreen} tabItems={this.tabItems} onIndexChange={this.onIndexChange} />
      </View>
    );
  }
}

const styles = StyleSheet.create({
  main: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
});
