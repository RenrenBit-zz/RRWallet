package com.renrenbit.rrwallet.react.module;

import android.text.TextUtils;

import com.renrenbit.rrwallet.service.wallet.btc.BtcWalletService;
import com.renrenbit.rrwallet.utils.Constants;
import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.ReadableArray;
import com.facebook.react.module.annotations.ReactModule;

/**
 * Created by jackQ on 2018/6/18.
 */
@ReactModule(name = Constants.REACT_MODULE_NAME_DFRN_BITCOIN)
public class RRRNBitcoinModule extends ReactContextBaseJavaModule {
    private BtcWalletService service = new BtcWalletService();

    public RRRNBitcoinModule(ReactApplicationContext reactContext) {
        super(reactContext);
    }

    @Override
    public String getName() {
        return Constants.REACT_MODULE_NAME_DFRN_BITCOIN;
    }

    @ReactMethod
    public void createRandomAccount(String name, String passwd, String note, Promise promise) {
        if (TextUtils.isEmpty(name) || TextUtils.isEmpty(passwd)) {
            if (promise != null) {
                promise.reject(new NullPointerException("name or password is empty"));
            }
            return;
        }
        service.createRandomAccount(name, passwd, note, promise);
    }


    @ReactMethod
    public void importAccount(String mnemonic, String pwd, String name, Promise promise) {
        service.importAccount(mnemonic, pwd, name, promise);
    }

    @ReactMethod
    public void backupMnemonic(String mnemonic, Promise promise) {
        service.backupMnemonic(mnemonic, promise);
    }

    @ReactMethod
    public void exportMnemonic(String id, String passwd, Promise promise) {
        service.exportMnemonic(id, passwd, promise);
    }

    @ReactMethod
    public void exportPrivateKey(String id, String password, Promise promise) {
        service.exportPrivateKey(id, password, promise);
    }

    @ReactMethod
    public void importPrivatekey(String pk, String pwd, String name, Promise promose) {
        service.importPrivatekey(pk, pwd, name, promose);
    }

    @ReactMethod
    public void isVaildPassword(String id, String passwd, Promise promise) {
        service.isValidPassword(id, passwd, promise);
    }

    @ReactMethod
    public void sendRawTransaction(String walletId, ReadableArray utxos, ReadableArray outputs, Integer net,
                                   String pwd, Promise promise) {
        service.sendRawTransaction(walletId, utxos, outputs, net, pwd, promise);
    }
    @ReactMethod
    public void signHash(String id, String hash, Integer sigHashType, String path, String pwd, Promise promise) {
        service.signHash(id, path, hash, sigHashType, pwd, promise);
    }
    @ReactMethod
    public void fetchAddresses(String walletId, ReadableArray paths, String extendedKey,
                               Integer type, Integer net, Promise promise) {
        service.fetchAddresses(walletId, paths, extendedKey, type, net, promise);
    }
    @ReactMethod
    public  void exportExtendedPublicKey(String walletId, String path, Integer net, String pwd, Promise promise) {
        service.exportExtendedPublicKey(walletId, path, net, pwd, promise);
    }
    @ReactMethod
    public void publicKeys(String extendedPublicKey, ReadableArray paths, Promise promise) {
        service.publicKeys(extendedPublicKey, paths, promise);
    }
}
