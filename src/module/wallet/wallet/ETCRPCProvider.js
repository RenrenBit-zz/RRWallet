import { BigNumber } from "bignumber.js";
import network from "../../common/network";

class ETCRPCProvider {
  ethGetTransactionCount = async (address, tag = "latest") => {
    return new BigNumber(
      await network.jsonrpc(network.ETCRpcUrl, "eth_getTransactionCount", [address, tag]),
      16
    ).toNumber();
  };
}

export default new ETCRPCProvider();
