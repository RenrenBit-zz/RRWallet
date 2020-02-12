package com.renrenbit.rrwallet.service.wallet.btc.net;

import com.renrenbit.rrwallet.service.wallet.CoinType;

import org.bitcoinj.core.NetworkParameters;
import org.bitcoinj.params.TestNet3Params;

/**
 * Created by jackQ on 2018/7/7.
 */

public class TestEnv implements BtcEnv {

    @Override
    public NetworkParameters getNetParams() {
        return TestNet3Params.get();
    }

    @Override
    public String getPath() {
        return CoinType.btcTest.getPath();
    }

    @Override
    public CoinType getCoinType() {
        return CoinType.btcTest;
    }

}
