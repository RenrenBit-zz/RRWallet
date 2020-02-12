import { Navigation } from "react-native-navigation";

import CreateWalletScreen from "./hd-wallet/CreateWalletScreen";
import AddAssets from "./hd-wallet/AddAssets";
import AddressScreen from "./hd-wallet/AddressScreen";
import PrintMnemonicWord from "./hd-wallet/print";
import ExportMnemonicWordScreen from "./hd-wallet/ExportMnemonicWordScreen";
import ConfirmMnemonicWordScreen from "./hd-wallet/ConfirmMnemonicWordScreen";
import TransferAssetsScreen from "./hd-wallet/HDSendTransactionScreen";
// 我的
import MineScreen from "./mine/MineScreen";
import AboutScreen from "./mine/AboutScreen";
import MsgListScreen from "./mine/MsgListScreen";
import ContactScreen from "./mine/ContactScreen";
import AddContactScreen from "./mine/AddContactScreen";
import ScanQRCodeScreen from "./mine/ScanQRCodeScreen";

import CoinDetailScreen from "./hd-wallet/CoinDetailScreen";
import TransactionDetailScreen from "./hd-wallet/TransactionDetailScreen";
import ImportHDWalletScreen from "./hd-wallet/ImportHDWalletScreen";

import Webview from "../component/webview/webview";
import SelectCoinScreen from "./hd-wallet/SelectCoinScreen";

import BackupWalletScreen from "./hd-wallet/BackupWalletScreen";
import AppUpdateModal from "../module/app/AppUpdateModal";
import UnlockPasswordSettingScreen from "./mine/UnlockPasswordSettingScreen";

import MultiSenderGuideScreen from "./multi-sender/GuideScreen";
import MultiSenderSelectCoinScreen from "./multi-sender/SelectCoinScreen";
import MultiSenderTaskExecutorScreen from "./multi-sender/TaskExecutorScreen";
import MultiSenderTaskDetailScreen from "./multi-sender/TaskDetailScreen";
import MultiSenderTaskListScreen from "./multi-sender/TaskListScreen";

import CurrencyScreen from "./mine/CurrencyScreen";
import InAppNotification from "../module/notification/InAppNotification";
import MyAddressesScreen from "./hd-wallet/MyAddressesScreen";

import AppWarningModal from "../module/app/AppWarningModal";
import MultiSigCreateScreen from "./multisig-wallet/MultiSigCreateScreen";
import MultiSigJoinScreen from "./multisig-wallet/MultiSigJoinScreen";
import MultiSigManageWalletScreen from "./multisig-wallet/MultiSigManageWalletScreen";
import MultiSigPendingWalletScreen from "./multisig-wallet/MultiSigPendingWalletScreen";

import MultiSigTxAuthorizationScreen from "./multisig-wallet/MultiSigTxAuthorizationScreen";
import MultiSigRecoveryScreen from "./multisig-wallet/MultiSigRecoveryScreen";
import MultiSigWalletInfoScreen from "./multisig-wallet/MultiSigWalletInfoScreen";

import WalletSettingsScreen from "./hd-wallet/WalletSettingsScreen";

import SplashPortal from "./splash/SplashPortal";
import SegwitQAScreen from "./hd-wallet/SegwitQAScreen";

import LanauageScreen from "./mine/LanguageScreen";

import MultisigFAQScreen from "./multisig-wallet/MultisigFAQScreen";

import SkeletonScreen from "../module/launch/SkeletonScreen";
import HDWalletScreen from "./hd-wallet/HDWalletScreen";
import MultiSigWalletScreen from "./multisig-wallet/MultiSigWalletScreen";
import PasswordComponent from "./mine/component/PasswordComponent";
import TouchIDComponent from "./mine/component/TouchIDComponent";

// import QRCodeScan from './camera/camera'
export function registerScreens() {
  Navigation.registerComponent(SkeletonScreen.screenID, () => SkeletonScreen);
  Navigation.registerComponent("MultiSenderGuideScreen", () => MultiSenderGuideScreen);
  Navigation.registerComponent("MultiSenderSelectCoinScreen", () => MultiSenderSelectCoinScreen);
  Navigation.registerComponent("MultiSenderTaskExecutorScreen", () => MultiSenderTaskExecutorScreen);
  Navigation.registerComponent("MultiSenderTaskDetailScreen", () => MultiSenderTaskDetailScreen);
  Navigation.registerComponent("MultiSenderTaskListScreen", () => MultiSenderTaskListScreen);

  Navigation.registerComponent("AddAssets", () => AddAssets);

  Navigation.registerComponent("CreateWallet", () => CreateWalletScreen);
  Navigation.registerComponent("ExportMnemonicWord", () => ExportMnemonicWordScreen);
  Navigation.registerComponent("PrintMnemonicWord", () => PrintMnemonicWord);
  Navigation.registerComponent("ConfirmMnemonicWord", () => ConfirmMnemonicWordScreen);
  Navigation.registerComponent("TransferAssetsScreen", () => TransferAssetsScreen);

  /** start 我的选项卡 add by sanshao */
  Navigation.registerComponent("MineScreen", () => MineScreen);
  Navigation.registerComponent("AboutScreen", () => AboutScreen);
  Navigation.registerComponent("MsgListScreen", () => MsgListScreen);
  Navigation.registerComponent("ContactScreen", () => ContactScreen);
  Navigation.registerComponent("AddContactScreen", () => AddContactScreen);
  Navigation.registerComponent(UnlockPasswordSettingScreen.screenID, () => UnlockPasswordSettingScreen);
  Navigation.registerComponent("PasswordComponent", () => PasswordComponent);
  Navigation.registerComponent("TouchIdComponent", () => TouchIDComponent);

  Navigation.registerComponent(CurrencyScreen.screenID, () => CurrencyScreen);
  Navigation.registerComponent(LanauageScreen.screenID, () => LanauageScreen);
  Navigation.registerComponent(ScanQRCodeScreen.screenID, () => ScanQRCodeScreen);

  //wallet
  Navigation.registerComponent(CoinDetailScreen.screenID, () => CoinDetailScreen);
  Navigation.registerComponent(TransactionDetailScreen.screenID, () => TransactionDetailScreen);
  Navigation.registerComponent(AddressScreen.screenID, () => AddressScreen);
  Navigation.registerComponent(SelectCoinScreen.screenID, () => SelectCoinScreen);
  Navigation.registerComponent(BackupWalletScreen.screenID, () => BackupWalletScreen);
  Navigation.registerComponent(ImportHDWalletScreen.screenID, () => ImportHDWalletScreen);
  Navigation.registerComponent(WalletSettingsScreen.screenID, () => WalletSettingsScreen);
  Navigation.registerComponent(MyAddressesScreen.screenID, () => MyAddressesScreen);
  Navigation.registerComponent(SegwitQAScreen.screenID, () => SegwitQAScreen);
  Navigation.registerComponent(MultiSigCreateScreen.screenID, () => MultiSigCreateScreen);
  Navigation.registerComponent(MultiSigJoinScreen.screenID, () => MultiSigJoinScreen);
  Navigation.registerComponent(MultiSigManageWalletScreen.screenID, () => MultiSigManageWalletScreen);
  Navigation.registerComponent(MultiSigPendingWalletScreen.screenID, () => MultiSigPendingWalletScreen);
  Navigation.registerComponent(MultiSigTxAuthorizationScreen.screenID, () => MultiSigTxAuthorizationScreen);
  Navigation.registerComponent(MultiSigRecoveryScreen.screenID, () => MultiSigRecoveryScreen);
  Navigation.registerComponent(MultiSigWalletInfoScreen.screenID, () => MultiSigWalletInfoScreen);
  Navigation.registerComponent(MultisigFAQScreen.screenID, () => MultisigFAQScreen);
  Navigation.registerComponent(HDWalletScreen.screenID, () => HDWalletScreen);
  Navigation.registerComponent(MultiSigWalletScreen.screenID, () => MultiSigWalletScreen);
  Navigation.registerComponent("AppUpdateModal", () => AppUpdateModal);

  Navigation.registerComponent("Webview", () => Webview);

  Navigation.registerComponent(InAppNotification.screenID, () => InAppNotification);
  Navigation.registerComponent(AppWarningModal.screenID, () => AppWarningModal);

  Navigation.registerComponent(SplashPortal.screenID, () => SplashPortal);
}
