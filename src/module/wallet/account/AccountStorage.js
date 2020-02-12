import { AsyncStorage } from "react-native";
import logger from "../../../util/logger";
import { observable } from "mobx";
import _ from "lodash";
import { ACCOUNT_TYPE_EXCHANGE, ACCOUNT_TYPE_HD, NETWORK_ENV_TESTNET } from "../../../config/const";

const STORAGE_KEY_ACCOUNT_LIST = "STORAGE_KEY_ACCOUNT_LIST";

const STORAGE_KEY_ACCOUNTSTORE_MAINNET = "STORAGE_KEY_ACCOUNTSTORE_MAINNET_V1";
const STORAGE_KEY_ACCOUNTSTORE_TESTNET = "STORAGE_KEY_ACCOUNTSTORE_TESTNET_V1";
class AccountStorage {
  data = [];
  accounts = [];
  env;
  constructor() {}
  setup = async env => {
    let result;
    this.env = env;
    try {
      result = await AsyncStorage.getItem(
        env === NETWORK_ENV_TESTNET ? STORAGE_KEY_ACCOUNTSTORE_TESTNET : STORAGE_KEY_ACCOUNTSTORE_MAINNET
      );
      result = JSON.parse(result) || {};
    } catch (error) {
      logger.error(error);
    }
    // this.data.splice(0, 2)
    // await this.update()
    return result || {};
  };
  insert = async account => {
    let index = this.accounts.length;
    for (let i = 0; i < this.accounts.length; i++) {
      if (this.accounts[i].id === account.id) {
        index = i;
        break;
      }
    }
    this.accounts[index] = account;
    if (account.type != ACCOUNT_TYPE_EXCHANGE) {
      await this.update();
    }
  };
  drop = async account => {
    if (account.type === ACCOUNT_TYPE_HD) {
      account.wallets = [];
      account.BTCWallet = undefined;
      account.ETHWallet = undefined;
    } else {
      let index = this.accounts.length;
      for (let i = 0; i < this.accounts.length; i++) {
        if (this.accounts[i].id === account.id) {
          index = i;
          break;
        }
      }
      this.accounts.splice(index, 1);
    }

    await this.update();
  };
  update = _.debounce(
    async () => {
      return await AsyncStorage.setItem(
        this.env === NETWORK_ENV_TESTNET ? STORAGE_KEY_ACCOUNTSTORE_TESTNET : STORAGE_KEY_ACCOUNTSTORE_MAINNET,
        JSON.stringify(this.data)
      );
    },
    1000 * 2,
    {
      maxWait: 1000 * 6,
    }
  );
}
export default new AccountStorage();
