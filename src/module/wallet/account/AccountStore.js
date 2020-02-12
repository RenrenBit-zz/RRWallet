import CoinStore from "../wallet/CoinStore";
import network from "../../common/network";
import { observable, computed, reaction } from "mobx";
import {
  ACCOUNT_TYPE_HD,
  ACCOUNT_TYPE_EXCHANGE,
  ACCOUNT_TYPE_HD_IMPORT,
  ACCOUNT_DEFAULT_ID_HD,
  ACCOUNT_TYPE_MULTISIG,
  ACCOUNT_DEFAULT_ID_MULTISIG,
} from "../../../config/const";
import HDAccount from "./HDAccount";
import _ from "lodash";
import Account from "./Account";
import AccountStorage from "./AccountStorage";
import MultiSigAccount from "./MultiSigAccount";

class AccountStore {
  @observable isHiddenPrice = false;
  @observable showDefaultIndex = true;
  /**
   *
   * @type { Array.<Account> }
   * @memberof AccountStore
   */
  @observable accounts = [];

  /**
   *
   * @type { Account }
   * @memberof AccountStore
   */
  @observable currentAccount = null;

  /**
   *
   * @readonly
   * @type { HDAccount }
   * @memberof AccountStore
   */
  @computed get defaultHDAccount() {
    return this.accounts.find(account => account.type === ACCOUNT_TYPE_HD);
  }

  /**
   *
   * @readonly
   * @type { MultiSigAccount }
   * @memberof AccountStore
   */
  @computed get defaultMultiSigAccount() {
    return this.accounts.find(account => account.type === ACCOUNT_TYPE_MULTISIG);
  }
  /**
   *
   *
   * @readonly
   * @type { Array.<HDAccount> }
   * @memberof AccountStore
   */
  @computed get HDAccounts() {
    return this.accounts.filter(
      account =>
        account.type === ACCOUNT_TYPE_HD || (account.type === ACCOUNT_TYPE_HD_IMPORT && account.wallets.length != 0)
    );
  }

  setup = async env => {
    try {
      network.setRPCURLs();
      network.fetchRPCURLs();
      await CoinStore.start();
      const data = await AccountStorage.setup(env);
      console.log(data);

      this.accounts =
        (_.isArray(data.accounts) &&
          data.accounts.map(obj => {
            switch (obj.type) {
              case ACCOUNT_TYPE_HD:
              case ACCOUNT_TYPE_HD_IMPORT: {
                const hd = new HDAccount(obj);
                return hd;
              }
              case ACCOUNT_TYPE_MULTISIG: {
                const multiSig = new MultiSigAccount(obj);
                return multiSig;
              }
              default:
                console.warn("unknow wallet type");
                return null;
            }
          })) ||
        [];
      this.accounts = _.compact(this.accounts);
      if (!this.defaultHDAccount) {
        const hd = new HDAccount({ id: ACCOUNT_DEFAULT_ID_HD, name: "HD钱包", type: ACCOUNT_TYPE_HD });
        this.accounts.splice(0, 0, hd);
      }
      if (!this.defaultMultiSigAccount) {
        const multiSig = new MultiSigAccount({
          id: ACCOUNT_DEFAULT_ID_MULTISIG,
          name: "多签钱包",
          type: ACCOUNT_TYPE_MULTISIG,
        });
        this.accounts.splice(2, 0, multiSig);
      }
      if (data.hasOwnProperty("isHiddenPrice")) {
        this.isHiddenPrice = data.isHiddenPrice;
      }
      // if (data.hasOwnProperty('showDefaultIndex')) {
      //     this.showDefaultIndex = data.showDefaultIndex
      // }

      if (this.accounts.find(account => !!account.hasCreated)) {
        this.showDefaultIndex = false;
      }

      AccountStorage.data = this;
      AccountStorage.accounts = this.accounts;
      if (data.currentAccountID) {
        this.currentAccount = this.match(data.currentAccountID);
      }

      if (this.defaultHDAccount.hasCreated) {
        this.currentAccount = this.defaultHDAccount;
      }

      if (!this.currentAccount) {
        this.currentAccount = this.accounts.length > 0 && this.accounts[0];
      }

      this.accounts.observe(this.onAccountsChange);
      console.log(this.accounts);

      reaction(
        () => this.currentAccount,
        () => {
          AccountStorage.update();
        }
      );
      reaction(
        () => this.showDefaultIndex,
        () => {
          AccountStorage.update();
        }
      );
      reaction(
        () => this.isHiddenPrice,
        () => {
          AccountStorage.update();
        }
      );
    } catch (error) {
      console.error(error);
      alert(error);
    }
  };
  onAccountsChange = change => {
    return;
  };

  /**
   * @type {Account}
   *
   * @memberof AccountStore
   */
  match = id => {
    if (!_.isString(id)) {
      return null;
    }

    let account = this.accounts.find(account => (account.id + "").toUpperCase() === id.toUpperCase());
    if (account) {
      return account;
    }

    account = this.HDAccounts.find(hdaccount => !!hdaccount.findWallet(id));
    return account;
  };
  toJSON() {
    return {
      isHiddenPrice: this.isHiddenPrice,
      accounts: this.accounts,
      currentAccountID: this.currentAccount.id,
    };
  }
}

export default new AccountStore();
