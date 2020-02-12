import {
  COIN_ID_BTC,
  COIN_ID_BCH,
  COIN_ID_BSV,
  COIN_ID_ETC,
  NETWORK_ENV_TESTNET,
  COIN_ID_ETH,
  COIN_ID_USDT,
} from "../../../config/const";
import network, { HD_WEB_API } from "../../common/network";

setTimeout(() => {
  observeRPCChange();
}, 3 * 1000);

const recommendFeeBTC = {
  fast: 45,
  avg: 30,
  low: 15,
};

const recommendFeeBSV = {
  fast: 20,
  avg: 10,
  low: 5,
};

const recommendFeeBCH = {
  fast: 5,
  avg: 2,
  low: 1,
};

const recommendFeeETH = {
  fast: 20,
  avg: 15,
  low: 10,
};

const recommendFeeETC = {
  fast: 40,
  avg: 30,
  low: 20,
};

function recommendFee(coinID) {
  switch (coinID) {
    case COIN_ID_BTC:
    case COIN_ID_USDT:
      return recommendFeeBTC;
    case COIN_ID_BCH:
      return recommendFeeBCH;
    case COIN_ID_BSV:
      return recommendFeeBSV;
    case COIN_ID_ETC:
      return recommendFeeETC;
    case COIN_ID_ETH:
    default:
      return recommendFeeETH;
  }
}

function observeRPCChange() {
  async function task() {
    try {
      await Promise.all([fetchrecommendFeeBTC(), fetchrecommendFeeETH()]);
    } catch (error) {}
    setTimeout(() => {
      task();
    }, 10 * 60 * 1000);
  }
  task();
}

async function fetchrecommendFeeETH() {
  try {
    const result = JSON.parse((await network.get("fees/eth", {}, HD_WEB_API)).data);

    recommendFeeETH.fast = Math.ceil((result.fast / 10) * 1.2);
    recommendFeeETH.avg = Math.ceil((result.average / 10) * 1.2);
    recommendFeeETH.low = Math.ceil((result.safeLow / 10) * 1.1);

    if (recommendFeeETH.low >= recommendFeeETH.avg) {
      recommendFeeETH.avg = recommendFeeETH.low + 2;
    }

    if (recommendFeeETH.avg >= recommendFeeETH.fast) {
      recommendFeeETH.fast = recommendFeeETH.avg + 2;
    }
  } catch (error) {
    console.log("btc_gasPrice异常");
    console.log(error);
  }
}

async function fetchrecommendFeeBTC() {
  try {
    const result = JSON.parse((await network.get("fees/btc", {}, HD_WEB_API)).data);
    recommendFeeBTC.fast = result.fastestFee;
    recommendFeeBTC.avg = result.halfHourFee;
    recommendFeeBTC.low = result.hourFee;
    if (network.env === NETWORK_ENV_TESTNET) {
      recommendFeeBTC.fast *= 1;
      recommendFeeBTC.avg *= 1;
      recommendFeeBTC.low *= 1;
    }
    recommendFeeBTC.low = Math.ceil(recommendFeeBTC.low * 0.8);
    recommendFeeBTC.avg = Math.ceil(recommendFeeBTC.avg * 1);
    recommendFeeBTC.fast = Math.ceil(recommendFeeBTC.fast * 1);
    if (recommendFeeBTC.low >= recommendFeeBTC.avg) {
      recommendFeeBTC.avg = recommendFeeBTC.low + 2;
    }

    if (recommendFeeBTC.avg >= recommendFeeBTC.fast) {
      recommendFeeBTC.fast = recommendFeeBTC.avg + 2;
    }
  } catch (error) {
    console.log("eth_gasPrice异常");
    console.log(error);
  }
}

export default recommendFee;
