import React, { Component } from "react";
import { StyleSheet, Platform } from "react-native";
import { WebView, View, BackHandler } from "react-native";

import Screen from "../../page/Screen";
import Theme from "../../util/Theme";

import HybridWebView from "./HybridWebView";

export default class Webview extends Screen {
  get hud() {
    return !this.webview.isHudUsing && this.webview && this.webview.hud;
  }
  static get screenID() {
    return "Webview";
  }

  static navigatorButtons = {
    leftButtons: [
      {
        ...Screen.navigatorButtons.leftButtons[0],
        id: "backButton",
      },
    ],
  };
  state = {
    url: "",
  };

  constructor(props) {
    super(props);
    this.props.navigator.addOnNavigatorEvent(this.onNavigatorEvent.bind(this));
  }

  handleWebViewRef = ref => (this.webview = ref);

  onNavigatorEvent(event) {
    if (event.type == "NavBarButtonPress") {
      if (event.id == "backButton") {
        this.handleBackPress();
      }
    }
  }
  handleBackPress = () => {
    let preventBackButton = this.preventBackButton;
    if (!preventBackButton) {
      this.props.navigator.pop();
    } else if (preventBackButton == "history") {
      this.webview.injectJavaScript(`(${goBack})()`);
    } else {
      // 完全交由webview自行处理
      let js = 'var e = new Event("backButtonPress");document.dispatchEvent(e)';
      this.webview.injectJavaScript(js);
    }
    return true;
  };
  setTitle = title => {
    this.props.navigator.setTitle({
      title: title,
    });
  };
  _onLoadStart = () => {
    this.hud && this.hud.showLoading();
  };
  _onLoad = () => {
    this.hud && this.hud.dismiss();
  };
  _onError = () => {
    this.hud && this.hud.dismiss();
  };
  render() {
    return (
      <View style={styles.main}>
        <HybridWebView
          ref={this.handleWebViewRef}
          source={{ uri: this.state.url }}
          onLoad={this._onLoad}
          onError={this._onError}
          onLoadStart={this._onLoadStart}
          navigator={this.props.navigator}
          ctx={this}
          bounces={false}
        />
      </View>
    );
  }

  static getDerivedStateFromProps(next, prev) {
    if (next.url && next.url != prev.url) {
      return {
        url: next.url,
      };
    }
    return null;
  }
}
const styles = StyleSheet.create({
  main: {
    flex: 1,
    backgroundColor: Theme.backgroundColor,
  },
});

const goBack = `() => {
    console.log('history.length===', history.length)
    if(history.length > 1){
      history.go(-1);
    } else {
      window.postMessage(JSON.stringify({
        name: 'popWindow'
      }));
    }
  }`;
