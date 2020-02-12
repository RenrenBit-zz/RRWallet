package com.renrenbit.rrwallet.service.wallet;

import com.renrenbit.rrwallet.service.wallet.db.entry.Account;

/**
 * Created by jackQ on 2018/6/16.
 */

public enum CoinType {
    eth("m/44'/60'/0'/0/0", Account.ETHER),
    btc("m/44'/0'/0'/0/0", Account.BTC),
    btcTest("m/44'/1'/0'/0/0", Account.BTC_TEST);

    private final String mPath;
    private final int mAccountType;


    CoinType(String path, int accountType) {
        this.mPath = path;
        this.mAccountType = accountType;
    }

    public static CoinType of(int type) {
        switch (type) {
            case Account.ETHER:
                return eth;
            case Account.BTC:
                return btc;
            case Account.BTC_TEST:
                return btcTest;
        }
        throw new IllegalArgumentException("not support coin type : " + type);
    }

    public String getPath() {
        return mPath;
    }

    public int getAccountType() {
        return mAccountType;
    }
}
