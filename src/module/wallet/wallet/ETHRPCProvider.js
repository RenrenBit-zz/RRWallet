import network from "../../common/network";
import { NETWORK_ENV_TESTNET } from "../../../config/const";
import { BigNumber } from "bignumber.js";
import ethereum, { unitMap } from "../../../util/ethereum";

class ETHRPCProvider {
  /**
   *节点推荐gasPrice
   *
   * @memberof ETHRPCProvider
   */
  gasPrice = 15;

  constructor() {
    // this.fetchGasPrice()
    // setInterval(this.fetchGasPrice, 10 * 60 * 1000)
  }

  fetchGasPrice = async () => {
    const weiGasPrice = await network.jsonrpc(network.ETHRpcUrl, "eth_gasPrice", []);
    this.gasPrice = new BigNumber(weiGasPrice).div(unitMap.Gwei).toNumber();
  };

  ethGetTransactionCount = async (address, tag = "latest") => {
    return new BigNumber(
      await network.jsonrpc(network.ETHRpcUrl, "eth_getTransactionCount", [address, tag]),
      16
    ).toNumber();
  };
  ethCall = async (obj, tag = "latest") => {
    return await network.jsonrpc(network.ETHRpcUrl, "eth_call", [obj, tag]);
  };
  ethGetTransactionReceipt = async txhash => {
    return await network.jsonrpc(network.ETHRpcUrl, "eth_getTransactionReceipt", [txhash]);
  };
}

export default new ETHRPCProvider();
