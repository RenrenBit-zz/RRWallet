package com.renrenbit.rrwallet.service.wallet;

import android.text.TextUtils;

import com.blankj.utilcode.util.StringUtils;
import com.renrenbit.rrwallet.service.wallet.db.entry.Account;
import com.renrenbit.rrwallet.utils.Constants;
import com.renrenbit.rrwallet.utils.WalletEncryptUtils;

import org.jetbrains.annotations.NotNull;
import org.jetbrains.annotations.Nullable;

/**
 * Created by jackQ on 2018/6/14.
 */

public class Wallet {
    private final String privateKey;
    private final String publicKey;
    private String address;

    @Nullable
    private String mnemonic;
    private CoinType type;

    private Wallet(@Nullable String mnemonic, String privateKey, CoinType type) {
        this.mnemonic = mnemonic;
        this.type = type;
        this.privateKey = privateKey;
        this.publicKey = WalletCreatorFactory.getCreator(type).getPublicKey(privateKey);
        this.address = WalletCreatorFactory.getCreator(type).getAddress(privateKey);
    }

    @NotNull
    public static Wallet from(@NotNull Account account, String password) throws Exception {
        CoinType type = CoinType.of(account.getType());
        try {
            return Wallet.Builder.create(type)
                    .mnemonic(WalletEncryptUtils.decrypt(account.getMnemonic(), account.getId(), password))
                    .privateKey(WalletEncryptUtils.decrypt(account.getPrivateKey(), account.getId(), password)).build();
        } catch (Exception e) {
            throw new WalletException(Constants.WRONG_PASSWORD);
        }
    }

    public CoinType getType() {
        return type;
    }

    @Nullable
    public String getMnemonic() {
        return mnemonic;
    }

    public String getPrivateKey() {
        return privateKey;
    }

    public String getPublicKey() {
        return publicKey;
    }

    public String getAddress() {
        return address;
    }

    @Override
    public String toString() {
        return "wallet [ mnemonic :" + mnemonic + " ,address : " + address
                + " , private key : " + privateKey
                + " , public key : " + publicKey + "]";
    }


    public static final class Builder {

        private final CoinType mType;
        private String mnemonic = "";
        private String privateKey;

        private Builder(CoinType coinType) {
            this.mType = coinType;
        }

        public static Builder create(CoinType coinType) {
            return new Builder(coinType);
        }

        public Builder mnemonic(String mnemonic) {
            if (!TextUtils.isEmpty(mnemonic)) {
                this.mnemonic = mnemonic;
            }
            return this;
        }

        public Builder privateKey(String privateKey) {
            this.privateKey = privateKey;
            return this;
        }

        public Wallet build() throws WalletException {
            if (StringUtils.isEmpty(mnemonic) && StringUtils.isEmpty(privateKey)) {
                throw new IllegalArgumentException("助记词和私钥不能同时为空");
            }
            try {
                if (StringUtils.isEmpty(privateKey)) {
                    if (!WalletEncryptUtils.isValidMnemonic(mnemonic)) {
                        throw new WalletException("助记词错误");
                    }
                    privateKey = WalletCreatorFactory.getCreator(mType).getPrivateKey(mnemonic);
                }
                return new Wallet(mnemonic, privateKey, mType);

            } catch (Exception e) {
                throw new WalletException("导入错误");
            }
        }
    }
}
