package com.renrenbit.rrwallet;

import android.support.annotation.Nullable;

import com.blankj.utilcode.util.LogUtils;
import com.blankj.utilcode.util.Utils;
import com.renrenbit.rrwallet.network.RetrofitUtils;
import com.renrenbit.rrwallet.react.ReactNativeApplicationAdapter;
import com.renrenbit.rrwallet.service.push.PushManager;
import com.renrenbit.rrwallet.service.wallet.SignChecker;
import com.facebook.react.ReactPackage;
import com.facebook.react.modules.network.OkHttpClientFactory;
import com.facebook.react.modules.network.OkHttpClientProvider;
import com.facebook.stetho.Stetho;
import com.reactnativenavigation.NavigationApplication;
import com.uphyca.stetho_realm.RealmInspectorModulesProvider;

import java.util.List;

import io.realm.Realm;
import io.realm.RealmConfiguration;
import okhttp3.OkHttpClient;

public class MainApplication extends NavigationApplication {
    ReactNativeApplicationAdapter mReactNativeApplicationAdapter
            = new ReactNativeApplicationAdapter(this);


    @Override
    public boolean isDebug() {
        return mReactNativeApplicationAdapter.getUseDeveloperSupport();
    }

    @Nullable
    @Override
    public List<ReactPackage> createAdditionalReactPackages() {
        return mReactNativeApplicationAdapter.getPackages();
    }

    @Nullable
    @Override
    public String getJSMainModuleName() {
        return mReactNativeApplicationAdapter.getJSMainModuleName();
    }

    @Override
    public void onCreate() {
        super.onCreate();
        initUtils();
        initReactNative();
        initDataBase();
        initPushSdk();
        initStetho();
        SignChecker.init();
    }

    private void initPushSdk() {
        PushManager.inst();
    }

    private void initStetho() {
        Stetho.initialize(
                Stetho.newInitializerBuilder(this)
                        .enableDumpapp(Stetho.defaultDumperPluginsProvider(this))
                        .enableWebKitInspector(RealmInspectorModulesProvider.builder(this)
                                .build())
                        .build());
    }

    private void initDataBase() {
        Realm.init(this);
        RealmConfiguration config = new RealmConfiguration.Builder().build();
        Realm.setDefaultConfiguration(config);
    }

    private void initUtils() {
        Utils.init(this);
        LogUtils.getConfig().setGlobalTag("Wallet");
    }

    private void initReactNative() {
        OkHttpClientProvider.setOkHttpClientFactory(new OkHttpClientFactory() {
            @Override
            public OkHttpClient createNewNetworkModuleClient() {
                return RetrofitUtils.Companion.getOkHttpClient(null);
            }
        });
        mReactNativeApplicationAdapter.onCreate();
    }
}
