import Theme from "../util/Theme";
import { Component } from "react";
import { Platform, Vibration, DeviceEventEmitter } from "react-native";
import { debounce } from "lodash";
import { Sentry } from "react-native-sentry";
import URLRouter from "../util/URLRouter";
// import InAppNotification from "../module/notification/InAppNotification";
import logger from "../util/logger";
import { LOGGER_MODULE_CORE, TAB_SWITCH } from "../config/const";
import _ from "lodash";
import { observable } from "mobx";

const NEED_DEFAULT_TITLE_KEY = "NEED_DEFAULT_TITLE_KEY";

export default class Screen extends Component {
  static get screenID() {
    return this.name;
  }
  static get title() {
    return undefined;
  }
  static navigatorStyle = {
    ...Theme.navigatorStyle,
    tabBarHidden: true,
  };
  static navigatorButtons = {
    leftButtons: [
      {
        id: "_sbackButton",
        icon: require("@img/nav/nav-back.png"),
        buttonColor: "#000000",
      },
    ],
  };
  navigator = this.props.navigator;
  @observable visible = false;
  constructor(props) {
    super(props);
    this.props.navigator.switchToTab = this._switchToTab;
    try {
      this._hookPushIfNeed();
      this._setTitleIfNeed();
      this.props.navigator.addOnNavigatorEvent(this._sonNavigatorEvent);
      Sentry.captureBreadcrumb({
        message: "enter",
        category: "navigator",
        data: {
          screen:
            typeof this.constructor.screenID === "function" ? this.constructor.screenID() : this.constructor.screenID,
        },
      });
    } catch (error) {}
  }
  componentDidCatch(error, info) {
    try {
      logger.breadcrumbs("componentDidCatch", LOGGER_MODULE_CORE, info);
      const screenName =
        (typeof this.constructor.screenID === "function" ? this.constructor.screenID() : this.constructor.screenID) +
        "";
      const name = `RenderError:${screenName}`;
      logger.error(error, LOGGER_MODULE_CORE, name);
    } catch (error) {}
  }
  _switchToTab = ({ tabIndex }) => {
    DeviceEventEmitter.emit(TAB_SWITCH, { tabIndex });
  };
  _setTitleIfNeed = () => {
    if (!this.props.navigator || !this.props.navigator.push) {
      return;
    }

    const { NEED_DEFAULT_TITLE_KEY } = this.props;

    if (!NEED_DEFAULT_TITLE_KEY) {
      return;
    }

    this.navigator.setTitle({
      title: this.constructor.title,
    });
  };
  _hookPushIfNeed = () => {
    if (!this.props.navigator || !this.props.navigator.push) {
      return;
    }

    if (Platform.OS == "android") {
      const origPush = this.navigator.push;
      this.navigator.push = debounce(
        function(params) {
          if (!params.hasOwnProperty("animationType")) {
            params["animationType"] = "slide-horizontal";
          }
          if (!params.hasOwnProperty("title")) {
            if (!params.hasOwnProperty("passProps")) {
              params["passProps"] = {};
            }
            params["passProps"][NEED_DEFAULT_TITLE_KEY] = true;
          }
          origPush.apply(this, [params]);
        },
        1000,
        {
          leading: true,
          trailing: false,
        }
      );
    } else {
      this.navigator.push = new Proxy(this.navigator.push, {
        apply: function(target, ctx, args) {
          if (args[0] && !args[0].hasOwnProperty("title")) {
            if (!args[0].hasOwnProperty("passProps")) {
              args[0]["passProps"] = {};
            }
            args[0]["passProps"][NEED_DEFAULT_TITLE_KEY] = true;
          }
          return Reflect.apply(...arguments);
        },
      });
    }

    //fuck Android
    // this.navigator.push = new Proxy(this.navigator.push, {
    //     apply: function(target, ctx, args) {
    //         if (args[0] && !args[0].hasOwnProperty('animationType')) {
    //             args[0]['animationType'] = 'slide-horizontal'
    //         }
    //         return Reflect.apply(...arguments);
    //     }
    // })
  };
  _changeBackButtonColorIfNeed = () => {
    if (Platform.OS != "android") {
      return;
    }

    if (
      !this.constructor.navigatorButtons ||
      !this.constructor.navigatorButtons.leftButtons ||
      !this.constructor.navigatorStyle.navBarButtonColor
    ) {
      return;
    }

    const leftButtons =
      this.constructor.navigatorButtons.leftButtons.map(btn => {
        return {
          ...btn,
          buttonColor: this.constructor.navigatorStyle.navBarButtonColor,
        };
      }) || [];

    this.navigator.setButtons({
      leftButtons: leftButtons,
    });
  };
  _sonNavigatorEvent = event => {
    if (event.type == "NavBarButtonPress") {
      if (event.id == "_sbackButton") {
        this._sgoBack();
      }
    } else if (event.type == "DeepLink" && this.visible) {
      this._sHandleDeepLink(event);
    } else {
      switch (event.id) {
        case "willAppear":
          this._changeBackButtonColorIfNeed();
          break;
        case "didAppear":
          this.visible = true;
          break;
        case "willDisappear":
          break;
        case "didDisappear":
          this.visible = false;
          break;
        case "bottomTabSelected":
          break;
        default:
          break;
      }
    }
  };

  _sHandleDeepLink = event => {
    const { link, payload } = event;
    const { inApp, clicked } = payload;

    if (!this.canHandleDeepLink(event)) {
      return;
    }
    if (clicked) {
      URLRouter.open(link, this.props.navigator);
      return;
    } else if (inApp) {
      Vibration.vibrate();

      const willGotoScreenName = this._parseScreenNameInLink(link);

      if (this.ifShowInAppNotification(willGotoScreenName, link, payload)) {
        this.props.navigator.showInAppNotification({
          screen: "InAppNotification",
          passProps: { willGotoScreenName, link, payload },
        });
      }
    }
  };
  _sgoBack = async () => {
    try {
      if (await this.canGoBack()) {
        this.props.navigator.pop();
      }
    } catch (error) {}
  };
  canHandleDeepLink = event => true;
  ifShowInAppNotification = (willGotoScreenName, link, payload) => {
    return true;
  };

  canGoBack = () => {
    return true;
  };

  _parseScreenNameInLink(link) {
    if (_.isString(link)) {
      const split = /^renrenbit:\/\/([^\\?]+?)\?.*/.exec(link) || [];
      if (split.length >= 2) {
        return split[1];
      }
    }
    return "unknow";
  }
}
