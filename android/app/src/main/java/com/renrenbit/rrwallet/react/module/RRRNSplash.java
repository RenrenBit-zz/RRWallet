package com.renrenbit.rrwallet.react.module;

import android.content.Context;
import android.view.Gravity;
import android.view.LayoutInflater;
import android.view.View;
import android.view.WindowManager;

import com.renrenbit.rrwallet.R;
import com.renrenbit.rrwallet.utils.Constants;
import com.renrenbit.rrwallet.utils.SharedPreferenceUtils;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.module.annotations.ReactModule;

;

import java.util.HashMap;
import java.util.Map;

@ReactModule(name = Constants.REACT_MODULE_SPLASH_NAME)
public class RRRNSplash extends ReactContextBaseJavaModule {
    protected static final String PREFS_FILE = "splash";
    protected static final String PREFS_FILE_KEY = "is_first_launch";
    private WindowManager mWindowManager;
    private final ReactApplicationContext reactContext;
//    private static WeakReference<Activity> mActivity;
    final Boolean isFirstLaunch;
    public static RRRNSplash globalSplash;

    public RRRNSplash(ReactApplicationContext reactContext) {
        super(reactContext);
        this.reactContext = reactContext;
        this.isFirstLaunch = SharedPreferenceUtils.inst().getBoolanValue(PREFS_FILE_KEY, true);
        SharedPreferenceUtils.inst().setValue(PREFS_FILE_KEY, false);
        mWindowManager = (WindowManager) reactContext.getSystemService(Context.WINDOW_SERVICE);
//        globalSplash = this;
    }

    public static void show(Context ctx) {
        WindowManager.LayoutParams params = new WindowManager.LayoutParams();
        params.gravity = Gravity.TOP | Gravity.LEFT;
        params.type = WindowManager.LayoutParams.TYPE_APPLICATION_OVERLAY;
        params.x = 0;
        params.y = 0;
        LayoutInflater inflater = LayoutInflater.from(ctx);
        View v = inflater.inflate(R.layout.splash_page, null, false);
        ((WindowManager)ctx.getSystemService(Context.WINDOW_SERVICE)).addView(v, params);
//        this.mWindowManager.addView(v, params);
    }

    public static View getSplashLayout(Context ctx) {
        LayoutInflater inflater = LayoutInflater.from(ctx);
        View v = inflater.inflate(R.layout.splash_page, null, false);

        View logo = v.findViewById(R.id.logo);
        logo.setVisibility(View.VISIBLE);

        return v;
    }

    @Override
    public String getName() {
        return Constants.REACT_MODULE_SPLASH_NAME;
    }

    @Override
    public Map<String, Object> getConstants() {
        final Map<String, Object> constants = new HashMap<>();
        constants.put("isFirstLaunch", this.isFirstLaunch);
        return constants;
    }

}