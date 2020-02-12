package com.renrenbit.rrwallet.service.wallet;

import com.renrenbit.rrwallet.service.wallet.btc.BtcWalletCreator;
import com.renrenbit.rrwallet.service.wallet.ether.EthWalletCreator;

import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Created by jackQ on 2018/6/16.
 */

public class WalletCreatorFactory {
    private static Map<CoinType, IWalletCreator> sMap;

    public static IWalletCreator getCreator(CoinType type) {
        if (sMap == null) {
            synchronized (WalletCreatorFactory.class) {
                if (sMap == null) {
                    sMap = new ConcurrentHashMap<>();
                    initMap();
                }
            }
        }
        return sMap.get(type);
    }

    private static void initMap() {
        sMap.put(CoinType.eth, new EthWalletCreator());
        sMap.put(CoinType.btc, new BtcWalletCreator());
        sMap.put(CoinType.btcTest, new BtcWalletCreator());
    }
}
