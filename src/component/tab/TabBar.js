import React, { Component } from "react";
import { observer } from "mobx-react";
import { StyleSheet, View } from "react-native";
import { computed } from "mobx";
import device from "../../util/device";
import TabBarItem from "./TabBarItem";
import theme from "../../util/Theme";

const width = Math.min(device.screenSize.width, device.screenSize.height);

@observer
export default class TabBar extends Component {
  @computed get backgroundColor() {
    return this.props.backgroundColor;
  }
  @computed get tabBarItems() {
    const { items } = this.props;
    return items;
  }
  @computed get showSeparator() {
    return !this.backgroundColor || this.backgroundColor === "#FFFFFF";
  }
  onTabBarItemPress = index => {
    const { onTabBarItemPress } = this.props;
    onTabBarItemPress && onTabBarItemPress(index);
  };
  renderTabBarItem = () => {
    const itemWidth = Math.floor(width / this.tabBarItems.length);
    return this.tabBarItems.map(item => (
      <View style={[styles.item, { width: itemWidth }]} key={item.label}>
        <TabBarItem data={item} onPress={this.onTabBarItemPress} />
      </View>
    ));
  };
  render() {
    return [
      this.showSeparator && <View style={styles.separator} key="separator" />,
      <View style={[styles.main, { backgroundColor: this.backgroundColor }]} key="tabbar">
        {this.renderTabBarItem()}
      </View>,
    ];
  }
}

const styles = StyleSheet.create({
  main: {
    flexDirection: "row",
    height: device.tabBarHeight,
    paddingBottom: device.safeArea.bottom,
    backgroundColor: "#FFFFFF",
  },
  separator: {
    width: "100%",
    height: StyleSheet.hairlineWidth,
    backgroundColor: theme.borderColor,
  },
  item: {
    alignItems: "center",
    justifyContent: "center",
  },
});
