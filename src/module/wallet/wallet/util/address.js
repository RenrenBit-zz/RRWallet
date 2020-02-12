import { COIN_ID_ETH, COIN_ID_BTC } from "../../../../config/const";

export default {
  decodeAdress: function(str) {
    if (str.startsWith("0x")) {
      return {
        address: str,
        type: COIN_ID_ETH,
      };
    }
    const firstChar = str.charAt(0);
    if (firstChar === "1" || firstChar === "3" || firstChar === "2" || firstChar === "m" || firstChar === "n") {
      return {
        address: str,
        type: COIN_ID_BTC,
      };
    }
    return {
      address: str,
      type: 0,
    };
  },
};
