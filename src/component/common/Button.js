import React, { Component } from "react";
import { StyleSheet, View, TouchableHighlight, Text, Image } from "react-native";
import theme from "../../util/Theme";
import PropTypes from "prop-types";

class Button extends Component {
  static propTypes = {
    onPress: PropTypes.func,
    title: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    disabled: PropTypes.bool,
  };
  onPress = () => {
    setTimeout(() => {
      this.props.onPress && this.props.onPress();
    }, 0);
  };
  render() {
    const { title, style, containerStyle, titleStyle, iconStyle, icon, disabled } = this.props;
    return (
      <View style={[styles.main, containerStyle, disabled && styles.disabledContainer]}>
        <TouchableHighlight
          style={styles.touch}
          disabled={disabled}
          underlayColor="transparent"
          activeOpacity={0.7}
          onPress={this.onPress}>
          <View style={[styles.container, style]}>
            {!!icon && <Image style={iconStyle} source={icon} />}
            {!!title && <Text style={[styles.text, titleStyle, disabled && styles.disabledTitle]}>{title}</Text>}
          </View>
        </TouchableHighlight>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  main: {
    justifyContent: "center",
  },
  container: {
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
  },
  touch: {
    // flex: 1,
    // alignItems: 'center',
    // justifyContent: 'center',
  },
  text: {
    fontSize: 17,
    color: theme.textColor.primary,
  },
  disabledContainer: {
    backgroundColor: theme.disabledColor,
  },
  disabledTitle: {
    color: "#FFFFFF",
  },
});

class IconButton extends Component {
  render() {
    const { onPress, style, source } = this.props;
    return (
      <TouchableHighlight
        onPress={onPress}
        style={style}
        underlayColor="transparent"
        activeOpacity={0.7}
        hitSlop={{ top: 10, left: 10, bottom: 10, right: 10 }}>
        <Image source={source} />
      </TouchableHighlight>
    );
  }
}

export { IconButton };
export default Button;
