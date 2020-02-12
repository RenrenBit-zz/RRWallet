import React, { Component } from "react";
import { StyleSheet, View, TouchableHighlight, Text, Image, Animated } from "react-native";
import device from "../../util/device";
import PropTypes from "prop-types";
import _ from "lodash";
import theme from "../../util/Theme";
import { observer } from "mobx-react";

const HEADER_ITEM_WIDTH = 44;
const HEADER_ITEM_HEIGHT = 44;

@observer
class Header extends Component {
  static propTypes = {
    leftButtons: PropTypes.array,
    rightButtons: PropTypes.array,
    navigator: PropTypes.object,
    bottomBorder: PropTypes.bool,
  };
  static defaultProps = {
    leftButtons: [],
    rightButtons: [],
    navigator: {},
    bottomBorder: false,
  };
  state = {
    leftButtons: [],
    rightButtons: [],
  };
  get itemContainerWidth() {
    return Math.max(this.state.leftButtons.length, this.state.rightButtons.length) * HEADER_ITEM_WIDTH;
  }
  render() {
    const itemContainerStyle = {};
    const { children, renderTitleComponent, titleColor, bottomBorder } = this.props;
    if (!!children) {
      return <View style={[styles.customMain, this.props.style]}>{children}</View>;
    }
    return (
      <View style={[styles.main, this.props.style, bottomBorder && styles.bottomBorder]}>
        <View style={[styles.center, styles.absoluteCenter]}>
          {!!renderTitleComponent ? (
            renderTitleComponent()
          ) : (
            <Text style={[styles.title, titleColor && { color: titleColor }]}>{this.props.title}</Text>
          )}
        </View>
        <View style={[styles.left, itemContainerStyle, { width: this.itemContainerWidth }]}>
          {this.state.leftButtons.map(el => (
            <HeaderItem key={el.id} source={el} navigator={this.props.navigator} />
          ))}
        </View>
        <View style={[styles.left, itemContainerStyle]}>
          {[...this.state.rightButtons].reverse().map(el => (
            <HeaderItem key={el.id} source={el} navigator={this.props.navigator} />
          ))}
        </View>
      </View>
    );
  }
  static getDerivedStateFromProps(nextProps, prevState) {
    if (
      _.isEqual(nextProps.leftButtons, prevState.leftButtons) &&
      _.isEqual(nextProps.rightButtons, prevState.rightButtons)
    ) {
      return null;
    }
    return {
      leftButtons: [...nextProps.leftButtons],
      rightButtons: [...nextProps.rightButtons],
    };
  }
}

const styles = StyleSheet.create({
  main: {
    height: device.navBarHeight,
    flexDirection: "row",
    paddingTop: device.statusBarHeight,
    paddingHorizontal: 7,
    justifyContent: "space-between",
  },
  bottomBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: theme.borderColor,
  },
  customMain: {
    height: device.navBarHeight,
    paddingTop: device.statusBarHeight,
    justifyContent: "space-between",
  },
  left: {
    justifyContent: "flex-start",
    alignItems: "center",
    flexDirection: "row",
  },
  center: {
    justifyContent: "center",
    alignItems: "center",
    flexDirection: "row",
  },
  absoluteCenter: {
    position: "absolute",
    top: device.statusBarHeight,
    left: 0,
    right: 0,
    bottom: 0,
  },
  right: {
    justifyContent: "flex-end",
    alignItems: "center",
    flexDirection: "row",
  },
  title: {
    fontWeight: theme.fontWeight.medium,
    fontSize: 18,
    color: "#FFFFFF",
  },
});

/*
    {
        id: 'create_wallet',
        title: 'xxxx',
        icon: require('@img/nav/nav_create_wallet.png'),
        testID: TESTID_NAV_BUTTON_CREATE_WALLET,
        buttonColor: '#FFFFFF'
    }
*/
class HeaderItem extends Component {
  static propTypes = {
    source: PropTypes.object.isRequired,
  };
  static defaultProps = {
    source: {},
  };
  onPress = () => {
    this.props.navigator.onNavigatorEvent({
      type: "NavBarButtonPress",
      id: this.props.source.id,
    });
  };
  render() {
    return (
      <TouchableHighlight
        style={itemStyles.main}
        activeOpacity={0.6}
        underlayColor="transparent"
        onPress={this.onPress}>
        {this.props.source.icon ? (
          <Image source={this.props.source.icon} style={{ tintColor: this.props.source.buttonColor }} />
        ) : (
          <Text style={[itemStyles.text, { color: this.props.source.buttonColor }]}>{this.props.source.title}</Text>
        )}
      </TouchableHighlight>
    );
  }
}

const itemStyles = StyleSheet.create({
  main: {
    minWidth: HEADER_ITEM_WIDTH,
    height: HEADER_ITEM_HEIGHT,
    justifyContent: "center",
    alignItems: "center",
  },
  text: {
    color: theme.linkColor,
    fontSize: 16,
    paddingRight: 9,
  },
});

const AnimatedHeader = Animated.createAnimatedComponent(Header);
export default Header;
export { AnimatedHeader };
