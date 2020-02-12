package com.renrenbit.rrwallet.service.wallet.btc;

import com.blankj.utilcode.util.StringUtils;
import com.renrenbit.rrwallet.service.wallet.Wallet;
import com.renrenbit.rrwallet.service.wallet.WalletException;
import com.renrenbit.rrwallet.service.wallet.db.WalletDbHelper;
import com.renrenbit.rrwallet.service.wallet.db.entry.Account;
import com.renrenbit.rrwallet.utils.ThreadScheduleUtils;
import com.renrenbit.rrwallet.utils.WalletEncryptUtils;
import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReadableArray;
import com.facebook.react.bridge.WritableArray;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.bridge.WritableNativeArray;
import com.facebook.react.bridge.WritableNativeMap;

import org.jetbrains.annotations.NotNull;
import org.jetbrains.annotations.Nullable;
import org.json.JSONException;
import org.json.JSONObject;

import java.util.HashMap;
import java.util.List;

import rx.Observable;
import rx.Observer;
import rx.Subscriber;
import rx.functions.Func1;

/**
 * Created by jackQ on 2018/6/18.
 */

public class BtcWalletService {
    public void createRandomAccount(@NotNull final String name, @NotNull final String passwd,
                                    @Nullable final String note, @Nullable final Promise promise) {
        if (StringUtils.isEmpty(name) || StringUtils.isEmpty(passwd)) {
            if (promise != null) {
                promise.reject(new IllegalArgumentException("name or password is empty"));
            }
            return;
        }
        Observable<Account> observable = Observable.create(new Observable.OnSubscribe<Wallet>() {
            @Override
            public void call(Subscriber<? super Wallet> subscriber) {
                subscriber.onNext(BtcWalletHelper.createAccount());
            }
        }).map(new Func1<Wallet, Account>() {
            @Override
            public Account call(Wallet wallet) {
                JSONObject extra = new JSONObject();
                try {
                    extra.put("note", note);
                } catch (JSONException e) {
                    e.printStackTrace();
                }
                Account account;
                try {
                    account = convert2Account(wallet, name, passwd, extra.toString());
                } catch (Exception e) {
                    e.printStackTrace();
                    throw new RuntimeException("encrypt error,please try again");
                }

                WalletDbHelper.inst().insertAccount(account);
                return account;
            }
        });
        ThreadScheduleUtils.simpleScheduleThread(observable)
                .subscribe(new Observer<Account>() {
                    @Override
                    public void onCompleted() {
                    }

                    @Override
                    public void onError(Throwable e) {
                        if (promise != null) {
                            promise.reject(e);
                        }
                    }

                    @Override
                    public void onNext(Account account) {
                        if (promise != null) {
                            WritableMap map = new WritableNativeMap();
                            map.putString("id", account.getId());
                            map.putInt("type", account.getType());
                            map.putString("address", account.getAddress());
                            try {
                                map.putString("mnemonic", WalletEncryptUtils.decrypt(account.getMnemonic(), account.getId(), passwd));
                            } catch (Exception e) {
                                e.printStackTrace();
                            }
                            promise.resolve(map);
                        }
                    }
                });
    }

    public void importAccount(final String mnemonic, final String pwd, final String name, final Promise promise) {
        if (StringUtils.isEmpty(mnemonic) || StringUtils.isEmpty(pwd) || StringUtils.isEmpty(name)) {
            if (promise != null) {
                promise.reject(new IllegalArgumentException("mnemonic,name or pwd is empty"));
            }
            return;
        }
        Observable<Account> observable = Observable.create(new Observable.OnSubscribe<Wallet>() {
            @Override
            public void call(Subscriber<? super Wallet> subscriber) {
                subscriber.onNext(BtcWalletHelper.importWallet(mnemonic));
            }
        }).map(new Func1<Wallet, Account>() {
            @Override
            public Account call(Wallet wallet) {
                if (StringUtils.isEmpty(wallet.getAddress())) {
                    throw new IllegalArgumentException("import wallet error : invalid mnemonic");
                }
                Account account;
                try {
                    account = convert2Account(wallet, name, pwd, "");
                } catch (Exception e) {
                    e.printStackTrace();
                    throw new RuntimeException("encrypt error,please try again");
                }
                WalletDbHelper.inst().insertAccount(account);
                return account;
            }
        });

        ThreadScheduleUtils.simpleScheduleThread(observable)
                .subscribe(new Observer<Account>() {
                    @Override
                    public void onCompleted() {
                    }

                    @Override
                    public void onError(Throwable e) {
                        if (promise != null) {
                            promise.reject(e);
                        }
                    }

                    @Override
                    public void onNext(Account account) {
                        if (promise != null) {
                            WritableMap map = new WritableNativeMap();
                            map.putString("id", account.getId());
                            map.putInt("type", account.getType());
                            map.putString("address", account.getAddress());
                            promise.resolve(map);
                        }
                    }
                });
    }


    public void backupMnemonic(final String mnemonic, final Promise promise) {
        if (StringUtils.isEmpty(mnemonic)) {
            if (promise != null) {
                promise.reject(new IllegalArgumentException("mnemonic is empty"));
            }
            return;
        }
        Observable<Boolean> observable = Observable.create(new Observable.OnSubscribe<Wallet>() {
            @Override
            public void call(Subscriber<? super Wallet> subscriber) {
                Wallet wallet = BtcWalletHelper.importWallet(mnemonic);
                subscriber.onNext(wallet);
            }
        }).map(new Func1<Wallet, Boolean>() {
            @Override
            public Boolean call(Wallet wallet) {
                return wallet != null
                        && !StringUtils.isEmpty(wallet.getAddress())
                        && !StringUtils.isEmpty(wallet.getPrivateKey());
            }
        });
        ThreadScheduleUtils.simpleScheduleThread(observable)
                .subscribe(new Observer<Boolean>() {
                    @Override
                    public void onCompleted() {

                    }

                    @Override
                    public void onError(Throwable e) {
                        if (promise != null) {
                            promise.resolve(false);
                        }
                    }

                    @Override
                    public void onNext(Boolean success) {
                        if (promise != null) {
                            promise.resolve(success);
                        }
                    }
                });
    }

    private Account convert2Account(Wallet wallet, String name, String passwd, String extra) throws Exception {
        Account account = new Account();
        account.setAddress(wallet.getAddress());
        account.setId(WalletEncryptUtils.getWalletId(wallet.getAddress()));
        account.setName(name);
        account.setExtra(extra);
        account.setMnemonic(WalletEncryptUtils.encrypt(wallet.getMnemonic(), account.getId(), passwd));
        account.setPrivateKey(WalletEncryptUtils.encrypt(wallet.getPrivateKey(), account.getId(), passwd));
        account.setType(wallet.getType().getAccountType());
        return account;
    }

    public void exportMnemonic(final String id, final String passwd, final Promise promise) {
        if (StringUtils.isEmpty(id) || StringUtils.isEmpty(passwd)) {
            if (promise != null) {
                promise.reject(new IllegalArgumentException("empty id or password"));
            }
            return;
        }
        Observable<Wallet> observable = Observable.create(new Observable.OnSubscribe<Wallet>() {
            @Override
            public void call(Subscriber<? super Wallet> subscriber) {
                Account account = WalletDbHelper.inst().query(id);
                String mnemonic;
                try {
                    mnemonic = WalletEncryptUtils.decrypt(account.getMnemonic(), account.getId(), passwd);
                } catch (Exception e) {
                    e.printStackTrace();
                    throw new IllegalArgumentException("密码错误");
                }
                if (!WalletEncryptUtils.isValidMnemonic(mnemonic)) {
                    subscriber.onError(new WalletException("密码错误"));
                    return;
                }
                subscriber.onNext(BtcWalletHelper.importWallet(mnemonic));
            }
        });
        ThreadScheduleUtils.simpleScheduleThread(observable)
                .subscribe(new Observer<Wallet>() {
                    @Override
                    public void onCompleted() {

                    }

                    @Override
                    public void onError(Throwable e) {
                        if (promise != null) {
                            promise.reject(e);
                        }
                    }

                    @Override
                    public void onNext(Wallet wallet) {
                        if (promise != null) {
                            WritableMap map = new WritableNativeMap();
                            map.putString("mnemonic", wallet.getMnemonic());
                            promise.resolve(map);
                        }
                    }
                });
    }

    public void exportPrivateKey(final String id, final String password, final Promise promise) {
        if (StringUtils.isEmpty(id) || StringUtils.isEmpty(password)) {
            if (promise != null) {
                promise.reject(new IllegalArgumentException("钱包ID与密码不能为空"));
            }
            return;
        }
        Observable<String> observable = Observable.create(new Observable.OnSubscribe<String>() {
            @Override
            public void call(Subscriber<? super String> subscriber) {
                Account account = WalletDbHelper.inst().query(id);
                String privateKey;
                try {
                    privateKey = WalletEncryptUtils.decrypt(account.getPrivateKey(), account.getId(), password);
                    Wallet.Builder.create(BtcWalletHelper.getBtcCoinType())
                            .privateKey(privateKey)
                            .build();
                } catch (Exception e) {
                    e.printStackTrace();
                    throw new IllegalArgumentException("密码错误");
                }
                subscriber.onNext(privateKey);
            }
        });
        ThreadScheduleUtils.simpleScheduleThread(observable)
                .subscribe(new Observer<String>() {
                    @Override
                    public void onCompleted() {

                    }

                    @Override
                    public void onError(Throwable e) {
                        if (promise != null) {
                            promise.reject(e);
                        }
                    }

                    @Override
                    public void onNext(String privateKey) {
                        if (promise != null) {
                            WritableMap map = new WritableNativeMap();
                            map.putString("privateKey", privateKey);
                            promise.resolve(map);
                        }
                    }
                });
    }

    public void importPrivatekey(final String pk, final String pwd, final String name, final Promise promise) {
        if (StringUtils.isEmpty(pwd) || StringUtils.isEmpty(name)) {
            if (promise != null) {
                promise.reject(new IllegalArgumentException("密码不能为空"));
            }
            return;
        }
        Observable<Account> observable = Observable.create(new Observable.OnSubscribe<Account>() {
            @Override
            public void call(Subscriber<? super Account> subscriber) {
                //import
                Wallet wallet = null;
                try {
                    wallet = BtcWalletHelper.importWalletFromPrivateKey(pk);
                } catch (WalletException e) {
                    e.printStackTrace();
                }
                if (wallet == null || StringUtils.isEmpty(wallet.getAddress())) {
                    throw new IllegalArgumentException("私钥错误");
                }

                //insert to db
                try {
                    Account account = convert2Account(wallet, name, pwd, "");
                    WalletDbHelper.inst().insertAccount(account);
                    subscriber.onNext(account);
                } catch (Exception e) {
                    e.printStackTrace();
                    throw new IllegalStateException("保存数据错误");
                }

            }
        });
        ThreadScheduleUtils.simpleScheduleThread(observable)
                .subscribe(new Observer<Account>() {
                    @Override
                    public void onCompleted() {

                    }

                    @Override
                    public void onError(Throwable e) {
                        if (promise != null) {
                            promise.reject(e);
                        }
                    }

                    @Override
                    public void onNext(Account account) {
                        WritableMap map = new WritableNativeMap();
                        map.putString("id", account.getId());
                        map.putInt("type", account.getType());
                        map.putString("address", account.getAddress());
                        if (promise != null) {
                            promise.resolve(map);
                        }
                    }
                });
    }

    public void isValidPassword(final String id, final String passwd, final Promise promise) {
        if (StringUtils.isEmpty(id) || StringUtils.isEmpty(passwd)) {
            if (promise != null) {
                promise.resolve(false);
            }
            return;
        }
        Observable<Wallet> observable = Observable.create(new Observable.OnSubscribe<Wallet>() {
            @Override
            public void call(Subscriber<? super Wallet> subscriber) {
                Account account = WalletDbHelper.inst().query(id);
                String privateKey;
                try {
                    privateKey = WalletEncryptUtils.decrypt(account.getPrivateKey(), account.getId(), passwd);
                    Wallet wallet = Wallet.Builder.create(BtcWalletHelper.getBtcCoinType())
                            .privateKey(privateKey)
                            .build();
                    subscriber.onNext(wallet);
                } catch (Exception e) {
                    e.printStackTrace();
                    throw new IllegalArgumentException("密码错误");
                }
            }
        });
        ThreadScheduleUtils.simpleScheduleThread(observable)
                .subscribe(new Observer<Wallet>() {
                    @Override
                    public void onCompleted() {

                    }

                    @Override
                    public void onError(Throwable e) {
                        if (promise != null) {
                            promise.resolve(false);
                        }
                    }

                    @Override
                    public void onNext(Wallet wallet) {
                        boolean isRight = wallet != null && !StringUtils.isEmpty(wallet.getPrivateKey());
                        if (promise != null) {
                            promise.resolve(isRight);
                        }
                    }
                });
    }

    public void sendRawTransaction(final String id, final ReadableArray utxos, final ReadableArray outputs,
                                   final Integer net, final String pwd, final Promise promise) {
        Observable<HashMap<String, String>> observable = Observable.create(new Observable.OnSubscribe<HashMap<String, String>>() {
            @Override
            public void call(Subscriber<? super HashMap<String, String>> subscriber) {
                Account account = WalletDbHelper.inst().query(id);
                String mnemonic;
                try {
                    mnemonic = WalletEncryptUtils.decrypt(account.getMnemonic(), account.getId(), pwd);
                } catch (Exception e) {
                    e.printStackTrace();
                    throw new IllegalArgumentException("密码错误");
                }
                if (!WalletEncryptUtils.isValidMnemonic(mnemonic)) {
                    subscriber.onError(new WalletException("密码错误"));
                    return;
                }

                Wallet wallet = BtcWalletHelper.importWallet(mnemonic);
                HashMap<String, String> result = BtcWalletHelper.rawTransaction(wallet, utxos, outputs, net);
                subscriber.onNext(result);
            }
        });
        ThreadScheduleUtils.simpleScheduleThread(observable)
                .subscribe(new Observer<HashMap<String, String>>() {
                    @Override
                    public void onCompleted() {

                    }

                    @Override
                    public void onError(Throwable e) {
                        if (promise != null) {
                            promise.reject(e);
                        }
                    }

                    @Override
                    public void onNext(HashMap<String, String> hashMap) {
                        WritableMap map = new WritableNativeMap();
                        map.putString("txid", hashMap.get("txid"));
                        map.putString("rawData", hashMap.get("rawData"));
                        if (promise != null) {
                            promise.resolve(map);
                        }
                    }
                });
    }
    public void signHash(final String id, final String path, final String hash, final int sigHashType, final String pwd, final Promise promise) {
        Observable<String> observable = Observable.create(new Observable.OnSubscribe<String>() {

            @Override
            public void call(Subscriber<? super String> subscriber) {
                Account account = WalletDbHelper.inst().query(id);
                String mnemonic;
                try {
                    mnemonic = WalletEncryptUtils.decrypt(account.getMnemonic(), account.getId(), pwd);
                } catch (Exception e) {
                    e.printStackTrace();
                    throw new IllegalArgumentException("密码错误");
                }
                if (!WalletEncryptUtils.isValidMnemonic(mnemonic)) {
                    subscriber.onError(new WalletException("密码错误"));
                    return;
                }

                Wallet wallet = BtcWalletHelper.importWallet(mnemonic);
                String sigHex = BtcWalletHelper.signHash(wallet, path, hash, sigHashType);
                subscriber.onNext(sigHex);
            }
        });
        ThreadScheduleUtils.simpleScheduleThread(observable)
                .subscribe(new Observer<String>() {
                    @Override
                    public void onCompleted() {

                    }

                    @Override
                    public void onError(Throwable e) {
                        if (promise != null) {
                            promise.reject(e);
                        }
                    }

                    @Override
                    public void onNext(String hex) {
                        if (promise != null) {
                            promise.resolve(hex);
                        }
                    }
                });
    }
    public void fetchAddresses(final String id, final ReadableArray paths, final String extendedKey,
                               final Integer type, final Integer net, final Promise promise) {
        Observable<List<String>> observable = Observable.create(new Observable.OnSubscribe<List<String>>() {
            @Override
            public void call(Subscriber<? super List<String>> subscriber) {
                List<String> addresses = BtcWalletHelper.generateAddresses(paths, extendedKey, type, net);
                subscriber.onNext(addresses);
            }
        });
        ThreadScheduleUtils.simpleScheduleThread(observable)
                .subscribe(new Observer<List<String>>() {
                    @Override
                    public void onCompleted() {

                    }

                    @Override
                    public void onError(Throwable e) {
                        if (promise != null) {
                            promise.reject(e);
                        }
                    }

                    @Override
                    public void onNext(List<String> addresses) {
                        WritableArray array = new WritableNativeArray();
                        for (int i = 0; i < addresses.size(); i++) {
                            array.pushString(addresses.get(i));
                        }
                        if (promise != null) {
                            promise.resolve(array);
                        }
                    }
                });
    }
    public  void exportExtendedPublicKey(final String id, final String path, final Integer net, final String pwd, final Promise promise) {
        Observable<String> observable = Observable.create(new Observable.OnSubscribe<String>() {
            @Override
            public void call(Subscriber<? super String> subscriber) {
                Account account = WalletDbHelper.inst().query(id);
                String mnemonic;
                try {
                    mnemonic = WalletEncryptUtils.decrypt(account.getMnemonic(), account.getId(), pwd);
                } catch (Exception e) {
                    e.printStackTrace();
                    throw new IllegalArgumentException("密码错误");
                }
                if (!WalletEncryptUtils.isValidMnemonic(mnemonic)) {
                    subscriber.onError(new WalletException("密码错误"));
                    return;
                }

                Wallet wallet = BtcWalletHelper.importWallet(mnemonic);
                String key = BtcWalletHelper.exportExtendedPublicKey(wallet, path, net);
                subscriber.onNext(key);
            }
        });
        ThreadScheduleUtils.simpleScheduleThread(observable)
                .subscribe(new Observer<String>() {
                    @Override
                    public void onCompleted() {

                    }

                    @Override
                    public void onError(Throwable e) {
                        if (promise != null) {
                            promise.reject(e);
                        }
                    }

                    @Override
                    public void onNext(String key) {
                        if (promise != null) {
                            promise.resolve(key);
                        }
                    }
                });
    }
    public void publicKeys(final String extendedKey, final ReadableArray paths, final Promise promise) {
        Observable<List<String>> observable = Observable.create(new Observable.OnSubscribe<List<String>>() {
            @Override
            public void call(Subscriber<? super List<String>> subscriber) {
                List<String> pubkeys = BtcWalletHelper.generatePublicKeys(extendedKey, paths);
                subscriber.onNext(pubkeys);
            }
        });
        ThreadScheduleUtils.simpleScheduleThread(observable)
                .subscribe(new Observer<List<String>>() {
                    @Override
                    public void onCompleted() {

                    }

                    @Override
                    public void onError(Throwable e) {
                        if (promise != null) {
                            promise.reject(e);
                        }
                    }

                    @Override
                    public void onNext(List<String> pubkeys) {
                        WritableArray array = new WritableNativeArray();
                        for (int i = 0; i < pubkeys.size(); i++) {
                            array.pushString(pubkeys.get(i));
                        }
                        if (promise != null) {
                            promise.resolve(array);
                        }
                    }
                });
    }
}
