import React, { Component, PureComponent } from "react";
import { StyleSheet, View, ActivityIndicator, Text } from "react-native";
import PropTypes from "prop-types";
import theme from "../../util/Theme";
import i18n from "../../module/i18n/i18n";

class FlatListLoadMoreView extends PureComponent {
  static propTypes = {
    status: PropTypes.oneOf(["empty", "loading", "nomore"]),
    text: PropTypes.string,
  };

  static defaultProps = {
    status: "empty",
    text: `- ${i18n.t("common-end-line")} -`,
  };

  render() {
    if (this.props.status === "empty") {
      return <View />;
    }
    return (
      <View style={[styles.container, this.props.style]}>
        {this.props.status === "loading" ? (
          <ActivityIndicator size="small" color="#000000" />
        ) : (
          <Text style={styles.text}>{this.props.text}</Text>
        )}
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    height: 62,
    alignItems: "center",
    justifyContent: "center",
  },
  text: {
    fontSize: 12,
    color: theme.textColor.mainTitle,
  },
});
export default FlatListLoadMoreView;
