import React, { Component } from "react";
import { StyleSheet, View, DeviceEventEmitter, Keyboard } from "react-native";
import TabBar from "./TabBar";
import { observer } from "mobx-react";
import { observable, computed } from "mobx";
import device from "../../util/device";
import _ from "lodash";
import { TAB_SWITCH } from "../../config/const";

const width = Math.min(device.screenSize.width, device.screenSize.height);

@observer
export default class TabContainer extends Component {
  @observable index = 0;
  cachedScreen = {};
  @computed get tabBarBackgroundColor() {
    return this.props.tabBarBackgroundColor;
  }
  @computed get tabItems() {
    const { tabItems = [] } = this.props;
    return tabItems.map((item, index) => {
      const selected = index === this.index;
      return {
        ...item,
        selected,
        index,
      };
    });
  }
  constructor(props) {
    super(props);
    this.init();
  }
  init = () => {
    this.switchListener = DeviceEventEmitter.addListener(TAB_SWITCH, ({ tabIndex }) => {
      this.switchTab(tabIndex);
    });
  };
  componentWillUnmount = () => {
    this.switchListener && this.switchListener.remove();
    this.switchListener = undefined;
  };
  switchTab = index => {
    if (!_.isNumber(index) || this.tabItems.length <= index) {
      return;
    }
    this.onTabBarItemPress(index);
  };
  onTabBarItemPress = index => {
    const { onIndexChange } = this.props;
    this.index = index;
    Keyboard.dismiss();
    onIndexChange && onIndexChange(index);
  };
  renderScreen = item => {
    const { renderScreen } = this.props;

    let screen = this.cachedScreen[item.index];
    if (!screen) {
      if (!item.lazy || (item.lazy && this.index === item.index)) {
        screen = renderScreen && renderScreen(item.index);
        this.cachedScreen[item.index] = screen;
      }
    }
    return (
      <View style={styles.screen} key={item.label}>
        {screen}
      </View>
    );
  };
  render() {
    const translateX = -this.index * width;
    return (
      <View style={styles.main}>
        <View style={[styles.container, { width: this.tabItems.length * width, transform: [{ translateX }] }]}>
          {this.tabItems.map(item => this.renderScreen(item))}
        </View>
        <TabBar
          backgroundColor={this.tabBarBackgroundColor}
          items={this.tabItems}
          onTabBarItemPress={this.onTabBarItemPress}
        />
      </View>
    );
  }
}

const styles = StyleSheet.create({
  main: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  container: {
    flex: 1,
    flexDirection: "row",
    alignItems: "stretch",
  },
  screen: {
    width: width,
  },
});
