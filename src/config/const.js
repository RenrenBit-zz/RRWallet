export const NETWORK_ENV_MAINNET = 1;
export const NETWORK_ENV_TESTNET = 2;

export const BASEURL_MAINNET_BITRENREN = "https://gateway.bitrenren.com";

export const DEEPLINK_LINK_BLANK = "DEEPLINK_LINK_BLANK";

export const MNEMONIC_TYPE_EN = 0;
export const MNEMONIC_TYPE_ZH = 1;

export const ACCOUNT_TYPE_HD = 1;
export const ACCOUNT_TYPE_HD_IMPORT = 3;
export const ACCOUNT_TYPE_MULTISIG = 5;

export const ACCOUNT_DEFAULT_ID_HD = "ACCOUNT_DEFAULT_ID_HD";
export const ACCOUNT_DEFAULT_ID_MULTISIG = "ACCOUNT_DEFAULT_ID_MULTISIG";

export const CURRENCY_TYPE_CNY = "CNY";
export const CURRENCY_TYPE_USD = "USD";

export const WALLET_TYPE_ETH = 1;
export const WALLET_TYPE_BTC = 2;
export const WALLET_TYPE_OMNI = 3;
export const WALLET_TYPE_ETC = 4;
export const WALLET_TYPE_BCH = 5;
export const WALLET_TYPE_BSV = 6;

export const TX_PAGE_SIZE = 50;

export const ETHEREUM_CHAINID_MAINNET = 1;
export const ETHEREUM_CHAINID_TESTNET = 3;
export const ETHEREUM_CHAINID_ETC_MAINNET = 61;

export const BTC_ADDRESS_TYPE_PKH = 1;
export const BTC_ADDRESS_TYPE_SH = 2;

export const BTC_INPUT_TYPE_P2PKH = 1;
export const BTC_INPUT_TYPE_P2SH = 2;

export const BTC_SIGHASH_ALL = 0x1;
export const BTC_SIGHASH_NONE = 0x2;
export const BTC_SIGHASH_SINGLE = 0x3;
export const BTC_SIGHASH_FORKID = 0x40;
export const BTC_SIGHASH_OUTPUT_MASK = 0x1f;
export const BTC_SIGHASH_ANYONECANPAY = 0x80;

export const COIN_ID_BSV = 800;
export const COIN_ID_BCH = 395;
export const COIN_ID_BTC = 392;
export const COIN_ID_ETC = 398;
export const COIN_ID_USDT = 76;
export const COIN_ID_ETH = 3;
export const COIN_ICON_DEFAULT = "https://resource.kanquanbu.com/dcash/coin/default.png";
export const COIN_TYPE_ETH = 1;
export const COIN_TYPE_BTC = 2;
export const COIN_TYPE_USDT = 3;
export const COIN_TYPE_ETC = 4;
export const COIN_TYPE_BCH = 5;
export const COIN_TYPE_BSV = 6;

export const HDACCOUNT_FIND_WALELT_TYPE_ID = 1 << 0;
export const HDACCOUNT_FIND_WALELT_TYPE_ADDRESS = 1 << 1;
export const HDACCOUNT_FIND_WALELT_TYPE_COINID = 1 << 2;

export const WALLET_SOURCE_MW = 1; //
export const WALLET_SOURCE_PK = 2; //
export const WALLET_SOURCE_KS = 3; //KeyStore

export const APP_SCHEME = "rrwallet://";

export const SCHEMA_BTC = "bitcoin:";
export const SCHEMA_ETH = "iban:";

export const SPLASH_SCENE_TAB = 1;
export const SPLASH_SCENE_LOCK = 2;
export const SPLASH_SCENE_GUIDE = 3;

export const RPC_URL_CHANGE = "RPC_URL_CHANGE";

//notification
export const NOTIFICATION_AUTH_FINISH = "NOTIFICATION_AUTH_FINISH";
export const NOTIFICATION_SPLASH_FINISH = "NOTIFICATION_SPLASH_FINISH";
export const NOTIFICATION_SPLASH_START = "NOTIFICATION_SPLASH_START";
export const NOTIFICATION_WARNING_FINISH = "NOTIFICATION_WARNING_FINISH";

//HUD
export const HUD_TYPE_LOADING = "loading";
export const HUD_TYPE_TOAST = "toast";
export const HUD_TYPE_ALERT = "alert";

export const HUD_STATUS_SUCCESS = "success";
export const HUD_STATUS_FAILED = "failed";
export const HUD_STATUS_CUSTOM = "custom";

//log module
export const LOGGER_MODULE_COMMON = "common";
export const LOGGER_MODULE_LOG = "log";
export const LOGGER_MODULE_CORE = "core";
export const LOGGER_MODULE_NETWORK = "network";
export const LOGGER_MODULE_WALLET = "wallet";
export const LOGGER_MODULE_EXCHANGE = "exchange";
export const LOGGER_MODULE_MARKET = "market";

//lock
export const LOCKSCREEN_DISPLAY_STYLE_MODAL = "modal";
export const LOCKSCREEN_DISPLAY_STYLE_SINGLE = "single";

export const BUNDLE_ID_PRO_IOS = "com.renrenbit.rrwallet";
export const BUNDLE_ID_PRO_ANDROID = "com.renrenbit.rrwallet";
export const BUNDLE_ID_INHOUSE_IOS = "com.renrenbit.rrwallet.inhouse";
export const BUNDLE_ID_INHOUSE_ANDROID = "com.renrenbit.rrwallet.inhouse";
export const BUNDLE_ID_DEV = "com.renrenbit.rrwallet.development";

export const WALLET_TAB_JUMP_NOTIFICATION = "WALLET_TAB_JUMP_NOTIFICATION";
export const WALLET_TAB_JUMP_NOTIFICATION_INDEX_MULTISIG = "WALLET_TAB_JUMP_NOTIFICATION_INDEX_MULTISIG";
export const WALLET_TAB_JUMP_NOTIFICATION_INDEX_HD = "WALLET_TAB_JUMP_NOTIFICATION_INDEX_HD";

export const HDACCOUNT_FPPAYMENT_ERROR_MAX_FAILED = "HDACCOUNT_FINGERPRINTPAYMENT_ERROR_MAX_FAILED";
export const HDACCOUNT_FPPAYMENT_ERROR_FALLBACK = "HDACCOUNT_FINGERPRINTPAYMENT_ERROR_FALLBACK";
export const HDACCOUNT_FPPAYMENT_ERROR_CANCEL = "HDACCOUNT_FPPAYMENT_ERROR_CANCEL";

export const I18N_LANGUAGE_CHANGE_NOTIFICATION = "I18N_LANGUAGE_CHANGE_NOTIFICATION";

export const TAB_SWITCH = "TAB_SWITCH";
