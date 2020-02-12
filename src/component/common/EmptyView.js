import React, { Component } from "react";
import { View, Text, StyleSheet, Image, ViewPropTypes } from "react-native";
import PropTypes from "prop-types";
import i18n from "../../module/i18n/i18n";
import theme from "../../util/Theme";

export default class EmptyView extends Component {
  static propTypes = {
    containerStyle: ViewPropTypes.style,
    imageSource: PropTypes.number,
    title: PropTypes.string,
  };

  constructor(props) {
    super(props);

    const { imageSource = require("@img/mine/empty_data.png"), title = i18n.common("empty-data") } = props;
    this.state = {
      imageSource,
      title,
    };
  }

  render() {
    return (
      <View style={[styles.container, this.props.containerStyle]}>
        <Image source={this.state.imageSource} />
        {!!this.state.title && <Text style={styles.text}>{this.state.title}</Text>}
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
    height: "100%",
    alignItems: "center",
    paddingTop: 160,
    backgroundColor: theme.backgroundColor,
  },
  text: {
    marginTop: 22,
    fontSize: 14,
    paddingLeft: 16,
    paddingRight: 16,
    lineHeight: 18,
    color: theme.textColor.mainTitle,
    textAlign: "center",
  },
});
