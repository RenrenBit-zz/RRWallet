import { observable, computed, reaction, action, transaction } from "mobx";
import Account from "./Account";
import BTCMultiSigWallet, { multiSigRedeemScript } from "../wallet/btc/BTCMultiSigWallet";
import AccountStorage from "./AccountStorage";
import MultiSigWallet, {
  MultiSigTransaction,
  BTCMultiSigTransaction,
  USDTMultiSigTransaction,
  BTCMultisigInput,
} from "../wallet/MultiSigWallet";
import network, { HD_BTC_API, HD_WEB_API, HD_MULTISIG_API } from "../../common/network";
import _ from "lodash";
import { COIN_TYPE_USDT, COIN_TYPE_BTC } from "../../../config/const";
import { toFixedNumber, toFixedString } from "../../../util/NumberUtil";
import AccountStore from "./AccountStore";
import BigNumber from "bignumber.js";
import { BTCCoin } from "../wallet/Coin";
import { BITCOIN_SATOSHI } from "../wallet/btc/BTCTransaction";

class MultiSigAccount extends Account {
  @observable displayChange = true;

  @computed get hasCreated() {
    return !!this.wallets.length;
  }

  @computed get totalAsset() {
    return toFixedNumber(
      this.wallets.reduce((sum, wallet) => sum + wallet.assetPrice, 0),
      2
    );
  }
  @computed get floatingAsset() {
    return toFixedNumber(
      this.wallets.reduce((sum, wallet) => sum + wallet.floatingAssetPrice, 0),
      2
    );
  }
  /**
   *
   * @type {Array.<MultiSigWallet>}
   * @memberof MultiSigAccount
   */
  @observable wallets = [];
  /**
   *
   * @type {Array.<MultiSigTransaction>}
   * @memberof MultiSigAccount
   */
  @observable pendingTxs = [];

  @observable frozenUtxos = [];

  @computed get completedWallets() {
    return this.wallets.filter(wallet => wallet.isCompleted);
  }

  @computed get incompletedWallets() {
    return this.wallets.filter(wallet => !wallet.isCompleted);
  }

  get HDWallet() {
    return AccountStore.defaultHDAccount.BTCWallet;
  }

  constructor(obj = {}) {
    const { wallets } = obj;
    super(obj);
    this.wallets = (wallets && wallets.map(wallet => new BTCMultiSigWallet(wallet))) || [];
    reaction(
      () => this.wallets.length,
      length => {
        AccountStorage.update();
      }
    );
  }
  @action deleteWallet = async id => {
    const wallet = this.findWallet(id);
    if (!wallet) {
      return;
    }

    if (!wallet.isCompleted) {
      await network.post(
        "multisigner/delGroup",
        {
          groupKey: wallet.id,
          publicKey: this.HDWallet.extendedPublicKey.key,
        },
        HD_MULTISIG_API
      );
    }

    const wallets = this.wallets.slice();
    _.remove(wallets, wallet => wallet.id === id);
    this.wallets = wallets;
    await AccountStorage.update();
  };
  @action update = async () => {
    try {
      await transaction(async () => {
        const incompletedWallet = this.incompletedWallets.map(wallet => wallet.updateWalletInfo());

        try {
          await Promise.all(_.compact([this.syncPendingTx(), ...incompletedWallet, this.syncAddress()]));
        } catch (error) {}

        const wallets = this.wallets.slice();
        _.remove(wallets, wallet => wallet.hasDelete === true);
        this.wallets = wallets;

        const addresses = _.flatten(this.completedWallets.map(wallet => Object.keys(wallet.addressesMap)));
        const BTCAddresses = addresses.reduce((res, address) => `${res}"2,${address}",`, "");
        const USDTAddresses = this.completedWallets.reduce((res, wallet) => `${res}"3,${wallet.address}",`, "");
        const utxo =
          addresses.length > 0 &&
          network.post(
            "multisigner/getUtxoGroup",
            {
              groupKey: this.completedWallets.map(wallet => wallet.id),
            },
            HD_MULTISIG_API
          );

        const balance =
          addresses.length > 0 &&
          network.get(
            "/balance",
            {
              address: `[${BTCAddresses}${USDTAddresses}]`,
            },
            HD_WEB_API
          );

        const [utxoResp = {}, balanceResp = {}] = await Promise.all([utxo, balance]);
        const utxosMap = {};
        this.completedWallets.forEach(wallet => (utxosMap[wallet.id] = []));
        const unLock = (utxoResp && utxoResp.data && utxoResp.data.unLock) || [];
        for (const utxo of unLock) {
          const wallet = this.completedWallets.find(wallet => !!wallet.addressesMap[utxo.address]);
          if (!wallet) {
            return;
          }

          utxo.address = wallet.addressesMap[utxo.address];
          utxo.confirmations = parseInt(utxo.confirmations);
          const publicKeys = [];
          for (const member of wallet.members) {
            const [publicKey] = await member.extendedPublicKey.generatePublicKey([utxo.address.path]);
            publicKeys.push(publicKey);
          }
          utxo.redeemScript = multiSigRedeemScript(wallet.required, wallet.total, publicKeys);
          console.log(utxo.redeemScript);
          if (isNaN(utxo.confirmations)) {
            return;
          }

          utxosMap[wallet.id].push(new BTCMultisigInput(utxo));
        }

        this.frozenUtxos = (utxoResp && utxoResp.data && utxoResp.data.lock) || [];
        this.completedWallets.forEach(wallet => {
          const utxos = utxosMap[wallet.id];
          wallet.utxos = _.compact(
            utxos.sort((a, b) => (new BigNumber(a.satoshis).minus(b.satoshis).isGreaterThanOrEqualTo(0) ? -1 : 1))
          );
        });

        this.completedWallets.forEach(wallet =>
          wallet.coins.forEach(coin => {
            // if (coin instanceof BTCCoin) {
            //   return
            // }
            coin.balance = 0;
          })
        );
        balanceResp.data &&
          balanceResp.data.forEach(item => {
            const wallet = this.completedWallets.find(wallet => !!wallet.addressesMap[item.realAddress]);
            if (!wallet) {
              return;
            }

            switch (item.tokenType) {
              case COIN_TYPE_BTC:
                wallet.BTC.balance = toFixedString(new BigNumber(wallet.BTC.balance).plus(item.balance), 8);
                break;
              case COIN_TYPE_USDT:
                wallet.USDT.balance = toFixedString(new BigNumber(wallet.USDT.balance).plus(item.balance), 4);
                break;
            }
          });
        this.calculateBalance();
      });
    } catch (error) {}
  };
  @action syncPendingTx = async () => {
    if (this.completedWallets.length <= 0) {
      return;
    }
    try {
      const { data } = await network.post(
        "tx/getTx",
        {
          groupKeys: this.wallets.map(wallet => wallet.id),
          publicKey: this.wallets[0].HDWallet.extendedPublicKey.key,
        },
        HD_MULTISIG_API
      );

      const txs =
        _.compact(
          data.txDtoList &&
            data.txDtoList.map(tx => {
              const actors =
                (data.txDetailDtoList && data.txDetailDtoList.filter(member => member.txId == tx.id)) || [];
              const wallet = this.findWallet(tx.groupKey);
              const obj = {
                id: tx.id,
                wallet,
                creator: tx.createUserName,
                from: (tx.input && tx.input[0].address) || wallet.address,
                to: tx.toAddress,
                rawData: tx.txContent,
                inputs: tx.input,
                fee: tx.fee,
                actors,
              };
              const origTx = this.pendingTxs.find(ptx => ptx.id == obj.id);
              let newTx;
              switch (tx.tokenType) {
                case COIN_TYPE_BTC:
                  newTx = new BTCMultiSigTransaction(obj);
                  break;
                case COIN_TYPE_USDT:
                  newTx = new USDTMultiSigTransaction(obj);
                  break;
              }
              // wallet.txStore.insertTxs([newTx])
              if (origTx && newTx) {
                origTx.merge(newTx);
                return origTx;
              } else {
                return newTx;
              }
            })
        ) || [];

      this.pendingTxs = txs;
    } catch (error) {}
  };

  @action syncAddress = async () => {
    if (this.completedWallets.length <= 0) {
      return;
    }
    try {
      const data = (
        await network.post(
          "multisigner/getAddressAllGroupKey",
          {
            groupKeyList: this.completedWallets.map(wallet => wallet.id),
          },
          HD_MULTISIG_API
        )
      ).data;
      const list = data.addressDtoList || [];
      const map = list.reduce((res, address) => {
        if (!address.groupKey) {
          return res;
        }

        if (!res[address.groupKey]) {
          res[address.groupKey] = [];
        }

        res[address.groupKey].push(address);

        return res;
      }, {});
      this.completedWallets.forEach(wallet => {
        const address = map[wallet.id];
        if (!address) {
          return;
        }

        wallet.syncAddress(address);
      });
    } catch (error) {}
  };
  findWallet = id => this.wallets.find(wallet => wallet.id == id);
  findCoin = (coinID, walletID) => {
    const wallet = this.findWallet(walletID);
    return wallet && wallet.findCoin(coinID);
  };
  @action calculateBalance = () => {
    transaction(() => {
      this.completedWallets.forEach(wallet => {
        wallet.BTC.frozen = "0";
        wallet.USDT.frozen = "0";
        wallet.USDT.available = wallet.USDT.balance;
        const txs = this.pendingTxs.filter(tx => tx.wallet === wallet);
        BTCMultiSigTransaction;
        txs.forEach(tx => {
          switch (tx.coinType) {
            case COIN_TYPE_USDT:
              wallet.USDT.frozen = toFixedString(new BigNumber(wallet.USDT.frozen).plus(tx.amount), 4);
              wallet.USDT.available = toFixedString(new BigNumber(wallet.USDT.balance).minus(wallet.USDT.frozen), 4);
              break;
          }
        });
      });
      this.frozenUtxos.forEach(utxo => {
        const wallet = this.completedWallets.find(wallet => !!wallet.addressesMap[utxo.address]);
        if (!wallet) {
          return;
        }
        const amount = new BigNumber(utxo.satoshis + "").div(BITCOIN_SATOSHI);
        wallet.BTC.frozen = toFixedString(new BigNumber(wallet.BTC.frozen).plus(amount), 8);
      });
    });
  };
}

export default MultiSigAccount;
