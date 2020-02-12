import { observable, reaction, computed } from "mobx";
import network, { EXCHANGE_RATE_API } from "../../common/network";
import { toSignificanceNumber } from "../../../util/NumberUtil";
import { COIN_ID_BTC, COIN_ID_ETH, COIN_ID_USDT, CURRENCY_TYPE_CNY, CURRENCY_TYPE_USD } from "../../../config/const";
import storage from "../../../util/Storage";

const COINSTORE_PRICE_STORAGE_KEY = "COINSTORE-PRICE-STORAGE-KEY";
const COINSTORE_CURRENCY_STORAGE_KEY = "COINSTORE-CURRENCY-STORAGE-KEY";
class CoinPrice {
  id = 0;
  @observable USD = 0;
  @observable CNY = 0;
  @observable USDAnchor = 0;
  @observable CNYAnchor = 0;

  @computed get USDFloating() {
    return this.USD - this.USDAnchor;
  }

  @computed get CNYFloating() {
    return this.CNY - this.CNYAnchor;
  }

  constructor({ tokenId, priceUSD = 0, priceCNY = 0, price24HUSD = 0, price24HCNY = 0 }) {
    this.id = tokenId;
    this.USD = toSignificanceNumber(priceUSD, 8);
    this.CNY = toSignificanceNumber(priceCNY, 8);
    this.USDAnchor = toSignificanceNumber(price24HUSD, 8);
    this.CNYAnchor = toSignificanceNumber(price24HCNY, 8);
  }
  toJSON() {
    return {
      tokenId: this.id,
      priceUSD: this.USD,
      priceCNY: this.CNY,
      price24HUSD: this.USDAnchor,
      price24HCNY: this.CNYAnchor,
    };
  }
}
class CoinStore {
  @observable currency = CURRENCY_TYPE_CNY;
  @computed get currencySymbol() {
    switch (this.currency) {
      case CURRENCY_TYPE_CNY:
        return "¥";
      case CURRENCY_TYPE_USD:
        return "$";
    }
  }
  @observable map = new Map();
  constructor() {
    this.map.set(COIN_ID_BTC, new CoinPrice({ tokenId: COIN_ID_BTC }));
    this.map.set(COIN_ID_USDT, new CoinPrice({ tokenId: COIN_ID_USDT }));
    this.map.set(COIN_ID_ETH, new CoinPrice({ tokenId: COIN_ID_ETH }));
  }

  get BTCPrice() {
    return this.getPrice(COIN_ID_BTC);
  }

  get ETHPrice() {
    return this.getPrice(COIN_ID_ETH);
  }

  get USDTPrice() {
    return this.getPrice(COIN_ID_USDT);
  }

  async start() {
    try {
      const ret = await storage.load({ key: COINSTORE_PRICE_STORAGE_KEY });
      ret && ret.forEach(el => (el[0] ? this.map.set(el[0], new CoinPrice(el[1])) : null));
    } catch (error) {}

    try {
      const currency = await storage.load({ key: COINSTORE_CURRENCY_STORAGE_KEY });
      this.currency = currency || CURRENCY_TYPE_CNY;
    } catch (error) {
    } finally {
      reaction(
        () => this.currency,
        currency => {
          storage.save({
            key: COINSTORE_CURRENCY_STORAGE_KEY,
            data: currency,
          });
        }
      );
    }

    this.fetchPrice();

    setInterval(async () => {
      try {
        await this.fetchPrice();
      } catch (error) {}
    }, 2 * 60 * 1000);
  }
  observePrice(id) {
    if (!id || this.map.has(id)) {
      return;
    }
    let coin = new CoinPrice({ tokenId: id });
    this.map.set(id, coin);
    return coin;
  }
  getPrice(id) {
    return (this.map.get(id) && this.map.get(id)[this.currency]) || 0;
  }
  getFloatingPrice(id) {
    return (this.map.get(id) && this.map.get(id)[`${this.currency}Floating`]) || 0;
  }

  fetchPrice = async () => {
    try {
      let prices = (
        await network.postJson(
          "/token/price",
          {
            tokenIds: [...this.map.keys()],
          },
          EXCHANGE_RATE_API
        )
      ).data;
      prices.forEach(price => {
        let coin = this.map.get(price.tokenId);
        if (!coin) {
          return;
        }
        coin.USD = toSignificanceNumber(price.priceUSD, 8);
        coin.CNY = toSignificanceNumber(price.priceCNY, 8);
        coin.CNYAnchor = toSignificanceNumber(price.price24HCNY, 8);
        coin.USDAnchor = toSignificanceNumber(price.price24HUSD, 8);
      });
      storage.save({
        key: COINSTORE_PRICE_STORAGE_KEY,
        data: [...this.map],
      });
    } catch (error) {}
  };

  match(id) {
    return this.map.get(id);
  }
  /**
   * 拥有该币种的钱包
   *
   * @param {string} id
   * @returns {array}
   * @memberof CoinStore
   */
  filterWallets(id) {
    // return WalletStore.list.filter((wallet) => !!wallet.findCoin(id))
  }
}

export default new CoinStore();
