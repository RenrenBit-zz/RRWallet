import AccountStore from "../wallet/account/AccountStore";
import notificationHandler from "./notificationHandler";
import { NativeModules, NativeEventEmitter } from "react-native";
import theme from "../../util/Theme";

const quickAction = NativeModules.RRRNQuickAction;
const eventEmitter = new NativeEventEmitter(quickAction);

quickAction.getInitialAction().then(data => {
  if (data && data.type) {
    setTimeout(() => {
      handleQuickAction(data);
    }, 700);
  }
});
eventEmitter.addListener("quickActionShortcut", data => {
  handleQuickAction(data);
});
function handleQuickAction(data) {
  let url;
  const HDAccount = AccountStore.defaultHDAccount;
  switch (data.type) {
    case "hd_receive":
      if (!HDAccount.hasCreated) {
        return;
      }
      url = `renrenbit://Receivables?accountID=${HDAccount.id}&walletID=${HDAccount.lastWalletID}&coinID=${HDAccount.lastReceiveCoinID}&backgroundColor=${theme.business.hd}`;
      break;
    case "hd_transfer":
      if (!HDAccount.hasCreated) {
        return;
      }
      url = `renrenbit://TransferAssetsScreen?accountID=${HDAccount.id}&walletID=${HDAccount.lastWalletID}&coinID=${HDAccount.lastTransferCoinID}`;
      break;
    default:
      break;
  }
  setTimeout(() => {
    notificationHandler(
      {
        getData: function() {
          return {
            url,
            body: "3D Touch",
            title: "3D Touch",
          };
        },
        getAlert: function() {
          return {};
        },
      },
      true
    );
  }, 1000);
}

export default handleQuickAction;
