package com.renrenbit.rrwallet.service.wallet.db;

import android.support.annotation.NonNull;
import android.util.Base64;

import com.blankj.utilcode.util.StringUtils;
import com.renrenbit.rrwallet.service.wallet.db.entry.Account;
import com.renrenbit.rrwallet.utils.SharedPreferenceUtils;

import java.security.SecureRandom;

import io.realm.Realm;
import io.realm.RealmConfiguration;

/**
 * Created by jackQ on 2018/6/12.
 */

public class WalletDbHelper {
    private static final long VERSION_WALLET_DB = 0;
    private static WalletDbHelper sInstance;
    private final RealmConfiguration mConfig;

    public WalletDbHelper() {
        mConfig = new RealmConfiguration.Builder()
                .name("wallet.realm")
                .schemaVersion(VERSION_WALLET_DB)
                .migration(new WalletDbMigration())
                .encryptionKey(getKey())
                .build();
    }

    public static WalletDbHelper inst() {
        if (sInstance == null) {
            synchronized (WalletDbHelper.class) {
                if (sInstance == null) {
                    sInstance = new WalletDbHelper();
                }
            }
        }
        return sInstance;
    }

    private byte[] getKey() {
        String spKey = "wallet_key";
        String key = SharedPreferenceUtils.inst().getStringValue(spKey, "");
        if (StringUtils.isEmpty(key)) {
            byte[] k = new byte[64];
            new SecureRandom().nextBytes(k);
            key = Base64.encodeToString(k, Base64.NO_WRAP);
            SharedPreferenceUtils.inst().setValue(spKey,key);
        }
        return Base64.decode(key, Base64.NO_WRAP);
    }

    public synchronized void insertAccount(@NonNull Account account) {
        Realm realm = Realm.getInstance(mConfig);
        realm.beginTransaction();
        realm.copyToRealmOrUpdate(account);
        realm.commitTransaction();
    }

    public synchronized boolean dropAccount(String id, String passwd) {
        boolean success = false;
        Realm realm = Realm.getInstance(mConfig);
        realm.beginTransaction();
        Account account = realm.where(Account.class).equalTo("id", id).findFirst();
        if (account != null) {
            account.deleteFromRealm();
            success = true;
        }
        realm.commitTransaction();
        return success;
    }

    public synchronized Account query(String id) {
        Realm realm = Realm.getInstance(mConfig);
        return realm.where(Account.class).equalTo("id", id).findFirst();
    }
}
