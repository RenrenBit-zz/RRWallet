import React, { Component } from "react";
import { View, StyleSheet, TextInput, Text } from "react-native";
import theme from "../../util/Theme";
import { observer } from "mobx-react";

@observer
class ForumItem extends Component {
  _onChangeText = text => {
    this.props.onChangeText && this.props.onChangeText(text);
  };
  render() {
    const { title, placeholder, renderInputRightView, secureTextEntry } = this.props;
    return (
      <View style={[styles.card, this.props.style]}>
        <View style={[styles.row, styles.border]}>
          <Text style={styles.title}>{title}</Text>
        </View>
        <View style={styles.inputWrap}>
          <TextInput
            underlineColorAndroid="transparent"
            numberOfLines={1}
            onChangeText={this._onChangeText}
            style={styles.input}
            placeholder={placeholder}
            placeholderTextColor={theme.textColor.placeHolder}
            returnKeyType="done"
            blurOnSubmit={true}
            secureTextEntry={secureTextEntry}
          />
          {renderInputRightView && renderInputRightView()}
        </View>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#FFFFFF",
  },
  row: {
    height: 48,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginHorizontal: 16,
    flex: 1,
  },
  border: {
    borderColor: "transparent",
    borderBottomColor: theme.borderColor,
    borderWidth: StyleSheet.hairlineWidth,
  },
  input: {
    fontSize: 14,
    color: theme.textColor.primary,
    includeFontPadding: true,
    textAlignVertical: "center",
    paddingVertical: 0,
    flex: 1,
  },
  inputWrap: {
    flexDirection: "row",
    paddingTop: 12,
    paddingBottom: 15,
    marginHorizontal: 16,
  },
});
export default ForumItem;
