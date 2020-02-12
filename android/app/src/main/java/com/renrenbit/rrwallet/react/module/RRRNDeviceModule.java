package com.renrenbit.rrwallet.react.module;

import android.app.Activity;
import android.content.ContentResolver;
import android.os.Build;
import android.os.Handler;
import android.os.Looper;
import android.os.Message;
import android.provider.Settings;
import android.text.TextUtils;
import android.view.WindowManager;
import android.content.Intent;

import com.blankj.utilcode.util.AppUtils;
import com.blankj.utilcode.util.FileUtils;
import com.blankj.utilcode.util.LogUtils;
import com.blankj.utilcode.util.StringUtils;
import com.renrenbit.rrwallet.utils.Constants;
import com.renrenbit.rrwallet.utils.DeviceUuidFactory;
import com.renrenbit.rrwallet.utils.RootUtils;
import com.renrenbit.rrwallet.utils.WeakHandler;
import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.bridge.WritableNativeMap;
import com.facebook.react.module.annotations.ReactModule;

import java.io.File;
import java.util.HashMap;
import java.util.Map;

/**
 * Created by jackQ on 2018/6/2.
 */
@ReactModule(name = Constants.REACT_MODULE_NAME_DFRN_DEVICE)
public class RRRNDeviceModule extends ReactContextBaseJavaModule implements WeakHandler.IHandler {
    private final ReactApplicationContext reactContext;

    public RRRNDeviceModule(ReactApplicationContext reactContext) {
        super(reactContext);
        this.reactContext = reactContext;
    }

    @Override
    public String getName() {
        return Constants.REACT_MODULE_NAME_DFRN_DEVICE;
    }

    @ReactMethod
    public void deviceID(Promise promise) {
        String deviceUUid = DeviceUuidFactory.inst().getDeviceUuid();

        LogUtils.d(deviceUUid);
        promise.resolve(deviceUUid);
    }


    @ReactMethod
    public void isRoot(Promise promise) {
        if (promise != null) {
            WritableMap map = new WritableNativeMap();
            map.putBoolean("isRoot", RootUtils.isDeviceRooted());
            promise.resolve(map);
        }
    }

    @ReactMethod
    public void installAPK(String path, Promise promise) {
        try {
            AppUtils.installApp(new File(path));
            if (promise != null) {
                promise.resolve(true);
            }
        } catch (Exception e) {
            if (promise != null) {
                promise.resolve(false);
            }
        }
    }


    @ReactMethod
    public void keepScreenOn(final boolean isOpenLight) {
        mHandler.post(new Runnable() {
            @Override
            public void run() {
                Activity activity = getCurrentActivity();
                if (activity != null) {
                    try {
                        if (isOpenLight) {
                            activity.getWindow().addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);
                        } else {
                            activity.getWindow().clearFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);
                        }
                    } catch (Throwable ignored) {
                        ignored.printStackTrace();
                    }
                }
            }
        });
    }

    @ReactMethod
    public void getScreenBrightness(final Promise promise) {
        mHandler.post(new Runnable() {
            @Override
            public void run() {
                int nowBrightnessValue = 0;
                try {
                    ContentResolver resolver = getCurrentActivity().getContentResolver();
                    try {
                        nowBrightnessValue = android.provider.Settings.System.getInt(resolver, Settings.System.SCREEN_BRIGHTNESS);
                    } catch (Exception e) {
                        e.printStackTrace();
                    }
                } catch (Exception e) {
                    e.printStackTrace();
                }

                if (promise != null) {
                    promise.resolve(1.0f * nowBrightnessValue / 255f);
                }
            }
        });
    }

    @ReactMethod
    public void setScreenBrightness(float value) {
        if (value < 0) {
            value = 0;
        }

        if (value > 1) {
            value = 1;
        }
        final float finalValue = value;
        mHandler.post(new Runnable() {
            @Override
            public void run() {
                Activity activity = getCurrentActivity();
                if (activity == null) {
                    return;
                }
                WindowManager.LayoutParams lp = activity.getWindow().getAttributes();
                lp.screenBrightness = finalValue;
                activity.getWindow().setAttributes(lp);
            }
        });
    }

    @ReactMethod
    public void deleteFile(String filePath) {
        if (StringUtils.isEmpty(filePath)) {
            return;
        }
        if (filePath.contains("..") || filePath.contains("../")) {
            return;
        }

        try {
            FileUtils.deleteFile(new File(filePath));
        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    @ReactMethod
    public void openSettings(String action) {
        if (TextUtils.isEmpty(action)) {
            return;
        }
        Intent intent = new Intent(action);
        intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
        intent.addFlags(Intent.FLAG_ACTIVITY_NO_HISTORY);
        if (intent.resolveActivity(reactContext.getPackageManager()) != null) {
            reactContext.startActivity(intent);
        }
    }
    @ReactMethod
    public  void  openNotification() {
        Intent intent = new Intent(Settings.ACTION_APP_NOTIFICATION_SETTINGS);

        if(Build.VERSION.SDK_INT >=26){
            intent.putExtra("android.provider.extra.APP_PACKAGE", reactContext.getPackageName());
        }
        if(Build.VERSION.SDK_INT >=21 && Build.VERSION.SDK_INT <26) {
            intent.putExtra("app_package", reactContext.getPackageName());
            intent.putExtra("app_uid", reactContext.getApplicationInfo().uid);
        }
        if (intent.resolveActivity(reactContext.getPackageManager()) != null) {
            reactContext.startActivity(intent);
        }

    }

    private Handler mHandler = new WeakHandler(Looper.getMainLooper(), this);

    @Override
    public void handleMsg(Message msg) {

    }
    @Override
    public Map<String, Object> getConstants() {
        final Map<String, Object> constants = new HashMap<>();
        constants.put("O0o0o0OOoo00O00ooO0o0", RootUtils.isDeviceRooted());
        return constants;
    }
}
