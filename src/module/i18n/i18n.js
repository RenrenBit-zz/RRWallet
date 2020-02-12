import RNLanguages from "react-native-languages";
import en from "./translations/en";
import zh from "./translations/zh";
import { AsyncStorage, DeviceEventEmitter } from "react-native";
import { I18N_LANGUAGE_CHANGE_NOTIFICATION } from "../../config/const";
import { BIZ_SCOPE } from "./const";

const DEFAULT_REGION = "CN";
const I18N_STORAGE_KEY = "I18N-STORAGE-KEY";
const origi18n = require("i18n-js");

let language = "zh";
origi18n.locale = RNLanguages.language;
origi18n.defaultLocale = language;
origi18n.fallbacks = true;
//TODO: 暂时只启动zh
origi18n.translations = { zh, en };

/**
 *
 * @param {Object} specifics
 * @param {*} specifics.zh
 * @param {*} specifics.en
 */
function i18nSelector(specifics) {
  if (specifics.hasOwnProperty(origi18n.locale)) {
    return specifics[origi18n.locale];
  }

  if (specifics.hasOwnProperty(language)) {
    return specifics[language];
  }

  if (specifics.hasOwnProperty(origi18n.defaultLocale)) {
    return specifics[origi18n.defaultLocale];
  }

  return undefined;
}

class i18n {
  get locale() {
    return origi18n.locale;
  }
  set locale(str) {
    if (typeof str !== "string") {
      return;
    }
    const split = str.split("-");
    const preferredSplit = RNLanguages.language.split("-");
    if (split.length >= 1 && preferredSplit.length >= 2) {
      str = `${split[0]}-${preferredSplit[preferredSplit.length - 1]}`;
    }
    origi18n.locale = str;
    language = split[0];
    DeviceEventEmitter.emit(I18N_LANGUAGE_CHANGE_NOTIFICATION);
    setTimeout(() => {
      AsyncStorage.setItem(I18N_STORAGE_KEY, str);
    }, 1000);
  }
  get region() {
    const split = this.locale.split("-");
    if (split.length === 1) {
      return DEFAULT_REGION;
    }
    return split[split.length - 1];
  }

  /**
   *
   * @returns {'zh'|'en'}
   * @readonly
   * @memberof i18n
   */
  get language() {
    return this.select({
      zh: "zh",
      en: "en",
    });
  }
  setup = async () => {
    try {
      const locale = (await AsyncStorage.getItem(I18N_STORAGE_KEY)) || RNLanguages.language;
      this.locale = locale;
    } catch (error) {}
  };
  tt = function(biz, scope, ...args) {
    return origi18n.t(`${biz}-${scope}`, ...args);
  };
  t = function(...args) {
    return origi18n.t(...args);
  };
  numeric = function(num) {
    num = parseInt(num);
    if (language === "en") {
      switch (num) {
        case 0:
          return "0th";
        case 1:
          return "1st";
        case 2:
          return "2nd";
        case 3:
          return "3rd";
        default:
          return num + "th";
      }
    }
    return num + "";
  };
  date = function(time = true) {
    if (time) {
      return this.select({
        zh: "YYYY.MM.DD HH:mm",
        en: "HH:mm DD/MM/YYYY",
      });
    } else {
      return this.select({
        zh: "YYYY.MM.DD",
        en: "DD/MM/YYYY",
      });
    }
  };
  select = i18nSelector;
}

// 以文件夹做别名, 避免每次都要scope
Object.keys(BIZ_SCOPE).forEach(biz => {
  Object.assign(i18n.prototype, {
    [biz](scope, ...args) {
      return origi18n.t(`${biz}-${scope}`, ...args);
    },
  });
});

export default new i18n();
export { i18nSelector };
