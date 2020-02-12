import React, { Component } from "react";
import { TextInput } from "react-native";
import { observer } from "mobx-react";
import { observable, computed } from "mobx";

const TEXTINPUT_INITIAL_HEIGHT = -1;
@observer
class GrowingTextInput extends Component {
  @observable height = TEXTINPUT_INITIAL_HEIGHT;
  @computed get style() {
    const outer = this.props.style;
    return [outer, this.height === TEXTINPUT_INITIAL_HEIGHT && { height: this.height }];
  }
  handleInputRef = ref => (this.input = ref);
  _onContentSizeChange = e => {
    const contentSize = e.nativeEvent.contentSize;
    this.height = contentSize.height;

    const outer = this.props.onContentSizeChange;
    if (outer) {
      outer(e);
    }
  };
  focus = () => {
    this.input && this.input.focus();
  };
  blur = () => {
    this.input && this.input.blur();
  };
  render() {
    return (
      <TextInput
        style={this.style}
        {...this.props}
        multiline={true}
        onContentSizeChange={this._onContentSizeChange}
        ref={this.handleInputRef}
      />
    );
  }
}

export default GrowingTextInput;
