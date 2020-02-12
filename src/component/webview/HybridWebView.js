import React, { Component, PureComponent } from "react";
import { observer } from "mobx-react";
import { StyleSheet, View, Platform, Image, Text, TouchableHighlight } from "react-native";
import ProgressHUD from "../common/ProgressHUD";
import MessageBox from "@CC/MessageBox";
import AppInfo from "../../module/app/AppInfo";
import { WebView } from "react-native-webview";
import theme from "../../util/Theme";
import { observable, computed } from "mobx";
import logger from "../../util/logger";
import _ from "lodash";

@observer
class HybridWebView extends Component {
  didAppear = true;
  @observable isError = false;
  @observable isEmpty = false;
  @observable isLoad = false;
  @computed get showErrorPage() {
    return this.isError && this.isEmpty;
  }
  guard;
  constructor(props) {
    super(props);
    this.props.navigator.addOnNavigatorEvent(this.onNavigatorEvent.bind(this));
    const { source } = props;
    if (source) {
      logger.breadcrumbs(_.isPlainObject(source) ? JSON.stringify(source) : source);
    }
  }
  onNavigatorEvent(event) {
    switch (event.id) {
      case "willAppear":
        this.didAppear = true;
        break;
      case "willDisappear":
        this.didAppear = false;
        break;
      default:
        break;
    }
  }
  componentWillUnmount = () => {
    clearTimeout(this.guard);
  };
  injectJavaScript = js => this.webview && this.webview.injectJavaScript(js);
  handleWebViewRef = ref => (this.webview = ref);
  handleHUDRef = ref => (this.hud = ref);
  _onErrorPagePress = () => {
    this.isError = false;
    this.isEmpty = false;
    this.webview && this.webview.reload();
  };
  _onLoadStart = () => {
    this.isLoad = false;
    this.guard = setTimeout(() => {
      if (!this.isLoad && !this.isError) {
        this.webview && this.webview.stopLoading();
        this._onError();
      }
    }, 20 * 1000);
    this.props.onLoadStart && this.props.onLoadStart();
  };
  _onLoad = () => {
    this.isLoad = true;
    this.isError = false;
    this.isEmpty = false;
    clearTimeout(this.guard);
    this.props.onLoad && this.props.onLoad();
  };
  _onError = () => {
    this.isError = true;
    this.injectJavaScript(detectEmptyPage);
    clearTimeout(this.guard);
    this.props.onError && this.props.onError();
  };
  _renderError = () => <ErrorPage />;
  render() {
    const props = {
      ...this.props,
      style: [styles.containerWebView, this.props.webviewStyle],
      ref: this.handleWebViewRef,
      injectedJavaScript: `(${injectedScript})()`,
      userAgent: AppInfo.userAgent + ` RRWallet/${AppInfo.version}`,
      onLoadStart: this._onLoadStart,
      onLoad: this._onLoad,
      onError: this._onError,
    };
    return (
      <View style={[styles.main, this.props.style]}>
        {Platform.select({
          ios: <WebView {...props} useWebKit={true} />,
          android: <WebView {...props} />,
        })}
        <ErrorPage hidden={!this.showErrorPage} onPress={this._onErrorPagePress} />
        <ProgressHUD ref={this.handleHUDRef} />
        <MessageBox ref={ref => (this.messageBox = ref)} />
      </View>
    );
  }
}

const styles = StyleSheet.create({
  main: {
    flex: 1,
    backgroundColor: "transparent",
  },
  containerWebView: {
    flex: 1,
    backgroundColor: "transparent",
  },
});
export default HybridWebView;

const injectedScript = `() => {
  (function () {
      console.log('window.postMessage', window.postMessage.toString())
      var originalPostMessage = window.postMessage;

      var patchedPostMessage = function (message, targetOrigin, transfer) {
          originalPostMessage(message, targetOrigin, transfer);
      };

      patchedPostMessage.toString = function () {
          return String(Object.hasOwnProperty).replace('hasOwnProperty', 'postMessage');
      };

      window.postMessage = patchedPostMessage;
      
      // 初始化设置标题
      try {
        if(document.title){
          setTimeout(function(){
            window.postMessage(JSON.stringify({
              name: 'setTitle',
              sid: 0,
              data: {
                  title: document.title
              }
            }));
          }, 64)
        }
      } catch (error) {
          console.log('rn set title error', error.message)
      }
      
      console.log('window.postMessage', window.postMessage.toString())
  })();
}`;

const detectEmptyPage = `(() => {
  const isEmpty = !!(document.body && document.body.children.length)
  try {
    window.postMessage(JSON.stringify({
      name: 'isEmpty',
      data: {
        content: isEmpty
      }
    }))
  } catch (error) {
  }
})()`;

class ErrorPage extends PureComponent {
  render() {
    const { hidden, onPress } = this.props;
    if (hidden) {
      return null;
    }
    return (
      <View style={epStyles.main}>
        <TouchableHighlight activeOpacity={0.7} onPress={onPress}>
          <View style={epStyles.wrap}>
            <Image source={require("@img/empty/network_error.png")} />
            <Text style={epStyles.desc}>网络连接失败, 点击重试</Text>
          </View>
        </TouchableHighlight>
      </View>
    );
  }
}

const epStyles = StyleSheet.create({
  main: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: theme.backgroundColor,
  },
  wrap: {
    alignItems: "center",
  },
  desc: {
    marginTop: 22,
    fontSize: 14,
    paddingLeft: 16,
    paddingRight: 16,
    lineHeight: 18,
    color: theme.textColor.mainTitle,
    textAlign: "center",
  },
});
