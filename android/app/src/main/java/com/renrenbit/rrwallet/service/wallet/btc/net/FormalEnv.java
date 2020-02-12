package com.renrenbit.rrwallet.service.wallet.btc.net;

import com.renrenbit.rrwallet.service.wallet.CoinType;

import org.bitcoinj.core.NetworkParameters;
import org.bitcoinj.params.MainNetParams;


/**
 * Created by jackQ on 2018/7/7.
 */

public class FormalEnv implements BtcEnv {

    @Override
    public NetworkParameters getNetParams() {
        return MainNetParams.get();
    }

    @Override
    public String getPath() {
        return CoinType.btc.getPath();
    }

    @Override
    public CoinType getCoinType() {
        return CoinType.btc;
    }

}
