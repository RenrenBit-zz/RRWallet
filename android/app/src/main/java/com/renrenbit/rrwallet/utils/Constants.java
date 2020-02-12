package com.renrenbit.rrwallet.utils;

import org.jetbrains.annotations.Nullable;

/**
 * Created by jackQ on 2018/6/1.
 */

public class Constants {
    public static final String REACT_MODULE_NETWORK_NAME = "RRRNNetwork";
    public static final String REACT_MODULE_SPLASH_NAME = "RRRNSplash";
    public static final String CONTENT_TYPE = "application/json; charset=utf-8";
    public static final long HTTP_CONNECT_TIMEOUT = 30;
    public static final long HTTP_READ_TIMEOUT = 30;
    public static final long HTTP_WRITE_TIMEOUT = 30;
    public static final String REACT_MODULE_NAME_DFRN_DEVICE = "RRRNDevice";
    public static final String WALLET = "wallet";
    public static final String REACT_MODULE_NAME_DFRN_ETHER = "RRRNEthereum";
    public static final String REACT_MODULE_NAME_NOTIFICATION = "PushNotificationAndroid";
    public static final String REACT_MODULE_NAME_DFRN_BITCOIN = "RRRNBitcoin";

    public static final String REACT_MODULE_NAME_DFRN_QRDECODER = "RRRNQRDecoder";
    public static final String REACT_MODULE_NAME_ANALYSIS = "RRRNAnalysis";
    public static final String REACT_MODULE_NAME_SHARE = "RRRNShare";

    public static final String ETH_RPC_URL = "http://gateway.bitrenren.com:8545";

    public static final String PUSH_EVENT = "pushevent";
    public static final String RECEIVE_EVENT = "receive_event";
    public static final String WALLET_DB_TABLE = "wallet";
    @Nullable
    public static final String WRONG_MNEMONIC = "助记词格式错误";
    public static final String WRONG_PASSWORD = "密码错误";
    public static final String ERROR_NETWORK = "网络连接失败，请稍候再试";
}
