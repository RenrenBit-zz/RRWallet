package com.renrenbit.rrwallet.react;

import android.app.Application;
import android.support.annotation.NonNull;

import com.BV.LinearGradient.LinearGradientPackage;
import com.renrenbit.rrwallet.BuildConfig;
import com.renrenbit.rrwallet.react.module.WalletNativePackage;
import com.renrenbit.rrwallet.react.module.webview.RNWebViewPackage;
import com.facebook.react.ReactNativeHost;
import com.facebook.react.ReactPackage;
import com.facebook.react.shell.MainReactPackage;
import com.facebook.soloader.SoLoader;
import com.learnium.RNDeviceInfo.RNDeviceInfo;
import com.oblador.vectoricons.VectorIconsPackage;
import com.reactcommunity.rnlanguages.RNLanguagesPackage;
import com.rnfingerprint.FingerprintAuthPackage;
import com.horcrux.svg.SvgPackage;
import fr.greweb.reactnativeviewshot.RNViewShotPackage;
import io.sentry.RNSentryPackage;
import com.rnfs.RNFSPackage;

import im.shimo.react.prompt.RNPromptPackage;
import org.reactnative.camera.RNCameraPackage;
import com.imagepicker.ImagePickerPackage;

import com.dylanvann.fastimage.FastImageViewPackage;
import com.reactnativecommunity.webview.RNCWebViewPackage;

import java.util.Arrays;
import java.util.List;

/**
 * Created by jackQ on 2018/5/31.
 */

public class ReactNativeApplicationAdapter extends ReactNativeHost {
    private final Application mApplication;

    public ReactNativeApplicationAdapter(@NonNull Application application) {
        super(application);
        mApplication = application;
    }

    public void onCreate() {
        SoLoader.init(mApplication, false);
    }

    @Override
    public boolean getUseDeveloperSupport() {
        return BuildConfig.DEBUG;
    }

    @Override
    public List<ReactPackage> getPackages() {
        return Arrays.asList(
                new MainReactPackage(),
                new RNCameraPackage(),
                new LinearGradientPackage(),
                new VectorIconsPackage(),
                new RNDeviceInfo(),
                new WalletNativePackage(),
                new RNPromptPackage(),
                new FingerprintAuthPackage(),
                new SvgPackage(),
                new RNSentryPackage(),
                new ImagePickerPackage(),
                new RNFSPackage(),
                new RNViewShotPackage(),
                new RNWebViewPackage(),
                new RNLanguagesPackage(),
                new FastImageViewPackage(),
                new RNCWebViewPackage()
        );
    }
    @Override
    public String getJSMainModuleName() {
        return "index";
    }
}
