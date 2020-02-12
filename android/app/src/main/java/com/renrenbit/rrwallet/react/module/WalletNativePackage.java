package com.renrenbit.rrwallet.react.module;

import com.facebook.react.ReactPackage;
import com.facebook.react.bridge.NativeModule;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.uimanager.ViewManager;

import java.util.Arrays;
import java.util.Collections;
import java.util.List;

/**
 * Created by jackQ on 2018/5/31.
 */

public class WalletNativePackage implements ReactPackage {

    @Override
    public List<NativeModule> createNativeModules(ReactApplicationContext reactContext) {
        return Arrays.<NativeModule>asList(
                new RRRNNetworkModule(reactContext),
                new RRRNDeviceModule(reactContext),
                new RRRNEthereumModule(reactContext),
                new NotificationModule(reactContext),
                new RRRNBitcoinModule(reactContext),
                new RRRNQRDecoderModule(reactContext),
                new RRRNAnalysisModule(reactContext),
                new RRRNSplash(reactContext)
        );
    }

    @Override
    public List<ViewManager> createViewManagers(ReactApplicationContext reactContext) {
        return Collections.emptyList();
    }
}
