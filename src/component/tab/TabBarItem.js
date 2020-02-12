import React, { Component } from "react";
import PropTypes from "prop-types";
import RRImage from "../image/RRImage";
import { StyleSheet, View, TouchableWithoutFeedback, Text } from "react-native";
import { observer } from "mobx-react";
import { computed } from "mobx";
import _ from "lodash";
import theme from "../../util/Theme";

const defaultLableColor = "#929292";

@observer
export default class TabBarItem extends Component {
  @computed get selected() {
    const { data } = this.props;
    return data.selected;
  }
  @computed get icon() {
    const { data } = this.props;
    const icon = this.selected ? data.selectedIcon : data.icon;

    if (_.isNumber(icon)) {
      return icon;
    }

    return {
      uri: icon,
    };
  }
  @computed get iconSize() {
    const { data } = this.props;
    const { width, height } = (this.selected ? data.selectedIconSize : data.iconSize) || {};
    if (!_.isFinite(width) || !_.isFinite(height)) {
      return {};
    }
    return {
      width,
      height,
    };
  }
  @computed get label() {
    const { data } = this.props;
    return data.label;
  }
  @computed get labelColor() {
    const { data } = this.props;
    return this.selected ? data.selectedLabelColor || theme.brandColor : data.labelColor || defaultLableColor;
  }
  onPress = () => {
    const { onPress, data } = this.props;
    onPress && onPress(data.index);
  };
  render() {
    return (
      <TouchableWithoutFeedback onPress={this.onPress}>
        <View style={styles.main}>
          <RRImage source={this.icon} style={[styles.icon, this.iconSize]} resizeMode={"contain"} />
          <Text style={[styles.label, { color: this.labelColor }]}>{this.label}</Text>
        </View>
      </TouchableWithoutFeedback>
    );
  }
}

const styles = StyleSheet.create({
  main: {
    height: 49,
    width: "100%",
    alignItems: "center",
  },
  icon: {
    position: "absolute",
    bottom: 18,
    width: 24,
    height: 24,
  },
  label: {
    position: "absolute",
    top: 33,
    fontSize: 10,
    textAlign: "center",
    color: "#929292",
  },
});
