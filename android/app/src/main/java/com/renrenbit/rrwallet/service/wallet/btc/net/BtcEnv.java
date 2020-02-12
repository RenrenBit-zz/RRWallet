package com.renrenbit.rrwallet.service.wallet.btc.net;

import com.renrenbit.rrwallet.service.wallet.CoinType;

import org.bitcoinj.core.NetworkParameters;

/**
 * Created by jackQ on 2018/7/7.
 */

public interface BtcEnv {

    NetworkParameters getNetParams();

    String getPath();

    CoinType getCoinType();

}
