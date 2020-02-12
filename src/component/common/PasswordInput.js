import React, { Component } from "react";
import {
  StyleSheet,
  View,
  TextInput,
  Platform,
  Text,
  TouchableWithoutFeedback,
  AppState,
  Keyboard,
} from "react-native";
import { observable, computed, autorun } from "mobx";
import { observer } from "mobx-react";
import theme from "../../util/Theme";
import _ from "lodash";
import PropTypes from "prop-types";
import * as Animatable from "react-native-animatable";
import { padding } from "../../util/UIAdapter";

@observer
class PasswordInput extends Component {
  static propTypes = {
    length: PropTypes.number,
    onCompletion: PropTypes.func.isRequired,
    secureTextEntry: PropTypes.bool,
  };

  static defaultProps = {
    length: 6,
    secureTextEntry: false,
  };

  onKeyPressAvailable = false;
  lastKeyEventTimestamp = 0;
  @computed get inputs() {
    const { length, secureTextEntry } = this.props;
    const arr = _.fill(Array(length), "");

    this.inputCode.split("").forEach((el, i) => (arr[i] = secureTextEntry ? "●" : el));
    return arr;
  }
  @computed get current() {
    return Math.min(this.inputCode.length, this.props.length - 1);
  }
  @observable shouldAutoFocs = false;
  @observable code = "";
  @observable inputCode = "";
  completionCode = "";
  constructor(props) {
    super(props);
  }

  clear() {
    setTimeout(() => {
      this.textinput.clear();
      this.inputCode = "";
      this.completionCode = "";
    }, 50);
  }

  componentDidMount() {
    Keyboard.addListener("keyboardDidHide", this._handleKeyboardDidHide);
    AppState.addEventListener("change", this._handleAppStateChange);
    setTimeout(() => {
      this.textinput && this.textinput.focus();
    }, 600);
    autorun(() => {
      if (this.inputCode.length == 6) {
        console.log("completion", this.inputCode);
        if (this.props.onCompletion && this.completionCode != this.inputCode) {
          this.completionCode = this.inputCode;
          this.props.onCompletion(this.inputCode);
        }
      }
    });
  }
  componentWillUnmount() {
    Keyboard.removeListener("keyboardDidHide", this._handleKeyboardDidHide);
    AppState.removeEventListener("change", this._handleAppStateChange);
  }
  _handleKeyboardDidHide = () => {
    this.textinput && this.textinput.blur();
  };
  _handleAppStateChange = nextAppState => {
    if (nextAppState !== "active") {
      return;
    }
    this.textinput.blur();
    setTimeout(() => {
      this.textinput && this.textinput.focus();
    }, 600);
  };
  handleTextRef = ref => (this.textinput = ref);
  render() {
    const { length } = this.props;
    return (
      <TouchableWithoutFeedback onPress={this.onPress}>
        <View style={[styles.container, this.props.style]}>
          {_.times(length, i => (
            <Animatable.View
              key={i}
              iterationCount="infinite"
              transition={"borderColor"}
              style={[styles.codeBorder, this.current == i && { borderColor: theme.linkColor }]}>
              <Text key={i} style={styles.code}>
                {this.inputs[i]}
              </Text>
            </Animatable.View>
          ))}
          <TextInput
            style={styles.textinput}
            selectTextOnFocus={false}
            ref={this.handleTextRef}
            contextMenuHidden={true}
            underlineColorAndroid="transparent"
            maxLength={this.inputs.length}
            keyboardType={Platform.select({ ios: "number-pad", android: "numeric" })}
            onChangeText={this.onChangeTextInput}
            selectionColor="#DADADA"
            autoCorrect={false}></TextInput>
        </View>
      </TouchableWithoutFeedback>
    );
  }
  onPress = () => {
    this.textinput && this.textinput.focus();
  };

  onChangeTextInput = Platform.select({
    ios: _.debounce(text => {
      console.log(text);
      this.inputCode = text;
    }, 80),
    android: text => {
      this.inputCode = text;
    },
  });
  onChangeText(index, text) {
    if (Platform.OS != "android") {
      return;
    }
    if (this.onKeyPressAvailable) {
      return;
    }
    const pre = this.inputs[index];
    if (pre == undefined || pre.length < text.length) {
      //输入
      if (text.length == 1) {
        this.inputs[index] = text;
        if (index < this.inputs.length - 1) {
          this.refs["input" + (index + 1)].focus();
        }
      } else {
        this.inputs[index] = text.split("").pop() || "";
      }
    } else {
      //删除
    }

    return;
  }
  onKeyPress(index, event) {
    if (event.nativeEvent.key === "Backspace") {
      // Return if duration between previous key press and backspace is less than 20ms
      if (Math.abs(this.lastKeyEventTimestamp - event.timeStamp) < 40) {
        return;
      }
      this.clear();
    } else {
      this.onKeyPressAvailable = true;
      // Record non-backspace key event time stamp
      this.lastKeyEventTimestamp = event.timeStamp;
    }

    console.log("1111:", event.nativeEvent.key);
    console.log("1111:", event.timeStamp);
    let preText = this.inputs[index];

    if (this.lastIndex == index && event.nativeEvent.key == "Backspace" && preText == undefined) {
      //某些情况下 删除会出发两次..所以加上lastIndex标记..
      return;
    }

    this.lastIndex = index;
    let next = index;

    if (event.nativeEvent.key == "Backspace") {
      //删除
      if (index != 0 && !preText) {
        next = index - 1;
        this.inputs[next] = undefined;
      } else {
        this.inputs[index] = "";
      }
    } else {
      //输入
      if (index != this.inputs.length - 1) {
        //前几个
        next = index + 1;
        // if (preText && preText.length == 1) { //如果当前
        //     this.inputs[next] = event.nativeEvent.key
        // } else {
        this.inputs[index] = event.nativeEvent.key;
        // }
      } else {
        //最后一个
        this.inputs[index] = event.nativeEvent.key;
      }
    }
    this.forceUpdate();
    this.refs["input" + next].focus();
  }
  onFocus(index) {
    this.setState({ current: index });
  }
}

const styles = StyleSheet.create({
  container: {
    marginTop: 54,
    alignSelf: "stretch",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  codeBorder: {
    width: padding(50),
    height: padding(56),
    marginHorizontal: 4,
    borderColor: "#EBEBEB",
    borderWidth: 1,
    borderRadius: 10,
    backgroundColor: "#EBEBEB",
    justifyContent: "center",
    alignItems: "center",
  },
  code: {
    textAlign: "center",
    color: "#000",
    fontSize: 17,
  },
  textinput: {
    position: "absolute",
    width: 0,
    height: 0,
    left: 0,
    top: 0,
    opacity: 0,
  },
});

export default PasswordInput;
