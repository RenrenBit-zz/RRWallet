import { AsyncStorage } from "react-native";
import LocalDataName from "./LocalDataName";

export default {
  async getItem(key) {
    return new Promise((resolve, reject) => {
      AsyncStorage.getItem(key, (err, text) => {
        if (err) {
          reject(err, text);
        } else {
          let ret = text;
          try {
            ret = JSON.parse(text);
          } catch (error) {}
          resolve(ret);
        }
      });
    });
  },
  async setItem(key, data) {
    return new Promise((resolve, reject) => {
      let str = data;
      if (data && typeof data == "object") {
        str = JSON.stringify(data);
      } else {
        str = "" + str;
      }

      AsyncStorage.setItem(key, str, err => {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    });
  },
  async removeItem(key) {
    return new Promise((resolve, reject) => {
      AsyncStorage.removeItem(key, err => {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    });
  },

  async clear() {
    return new Promise((resolve, reject) => {
      AsyncStorage.clear(err => {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    });
  },

  async getLocalSecretAuth() {
    return this.getItem(LocalDataName.LOCAL_SECRET_AUTH);
  },

  async setLocalSecretAuth(data) {
    return this.setItem(LocalDataName.LOCAL_SECRET_AUTH, data);
  },
  async removeLocalSecretAuth() {
    return this.removeItem(LocalDataName.LOCAL_SECRET_AUTH);
  },
};
