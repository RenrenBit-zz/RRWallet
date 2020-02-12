package com.renrenbit.rrwallet.service.wallet;

import org.jetbrains.annotations.NotNull;

/**
 * Created by jackQ on 2018/6/16.
 */

public interface IWalletCreator {
    @NotNull
    Wallet createNewWallet();

    @NotNull
    Wallet createWalletFromWords(@NotNull String mnemonic);

    Wallet createWallet(String privateKey);

    String getPrivateKey(String mnemonic);

    String getAddress(String privateKey);

    String getPublicKey(String privateKey);
}
