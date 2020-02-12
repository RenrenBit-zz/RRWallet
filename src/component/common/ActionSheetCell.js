import React, { Component } from "react";
import { StyleSheet, Text, View, TouchableWithoutFeedback, Image } from "react-native";
import ActionSheet from "react-native-actionsheet";
import PropTypes from "prop-types";
import Theme from "../../util/Theme";

class ActionSheetCell extends Component {
  static propTypes = {
    label: PropTypes.string.isRequired,
    placeholder: PropTypes.string,
  };

  handleActionSheetRef = ref => (this.actionSheet = ref);

  constructor(props) {
    super(props);

    this.state = {
      value: "", // 当前select选中的值
      options: [],
      cancelIndex: 0,
      onChange: function() {
        // 切换选中文本
        console.info();
      },
    };
  }

  componentWillMount() {
    const props = this.props;

    let options = Array.from(props.options);
    options.push("取消"); // 添加一个取消按钮

    // 设置当前选中的 value 以及取消的索引
    this.setState({
      options,
      value: props.value,
      cancelIndex: options.length - 1,
    });
  }

  // 显示选择框
  onCellPress = () => {
    this.actionSheet.show();
  };

  // 点击单选项
  onActionSheetItemPress = index => {
    if (index === this.state.cancelIndex) return; // 点击了取消按钮

    const selectedValue = this.state.options[index];
    this.setState({
      value: selectedValue,
    });

    const onChange = this.props.onChange || this.state.onChange;
    onChange(selectedValue);
  };

  render() {
    const { containerStyle, label, placeholder, borderBottom } = this.props;

    return (
      <View style={styles.wrap}>
        <TouchableWithoutFeedback onPress={this.onCellPress}>
          <View style={[styles.container, borderBottom ? styles.containerBorder : {}, containerStyle]}>
            {label && label.length > 0 && <Text style={styles.label}>{label}</Text>}
            <Text
              style={[
                styles.selectTextView,
                !!this.state.value ? styles.selectTextView_selected : styles.selectTextView_placeholder,
              ]}>
              {this.state.value || placeholder}
            </Text>
            <Image source={require("@img/icon/arrow-right.png")} />
          </View>
        </TouchableWithoutFeedback>

        <ActionSheet
          options={this.state.options}
          cancelButtonIndex={this.state.cancelIndex}
          onPress={this.onActionSheetItemPress}
          ref={this.handleActionSheetRef}
        />
      </View>
    );
  }
}

const styles = StyleSheet.create({
  wrap: {
    width: "100%",
    height: 56,
  },
  container: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginLeft: 0,
    marginRight: 0,
    height: 56,
  },
  containerBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Theme.borderColor,
  },
  label: {
    marginRight: 8,
    fontSize: 16,
    color: Theme.textColor.primary,
  },
  selectTextView: {
    flex: 1,
    fontSize: 16,
  },
  selectTextView_placeholder: {
    color: Theme.textColor.placeHolder,
  },
  selectTextView_selected: {
    color: Theme.textColor.primary,
  },
  placeHolder: {
    fontSize: 14,
    color: Theme.textColor.minorTitle2,
  },
});

export default ActionSheetCell;
