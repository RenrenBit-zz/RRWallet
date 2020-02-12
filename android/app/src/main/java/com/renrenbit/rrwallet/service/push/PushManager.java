package com.renrenbit.rrwallet.service.push;

import android.app.Activity;
import android.app.Application;
import android.content.Context;
import android.content.Intent;
import android.os.Bundle;

import com.blankj.utilcode.util.LogUtils;
import com.blankj.utilcode.util.Utils;
import com.renrenbit.rrwallet.BuildConfig;
import com.renrenbit.rrwallet.service.statistics.UmengAnalyticsAgent;
import com.renrenbit.rrwallet.utils.DeviceUuidFactory;
import com.facebook.react.bridge.Callback;
import com.umeng.commonsdk.UMConfigure;
import com.umeng.message.IUmengRegisterCallback;
import com.umeng.message.PushAgent;
import com.umeng.message.UHandler;
import com.umeng.message.UTrack;
import com.umeng.message.entity.UMessage;

import org.android.agoo.huawei.HuaWeiRegister;
import org.android.agoo.xiaomi.MiPushRegistar;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Vector;

/**
 * Created by jackQ on 2018/6/18.
 */

public class PushManager {
    private static PushManager sInstance;
    private final Vector<PushEvent> mMessageCacheVector = new Vector<>();
    public PushEventListener mListeners = null;
    ActivityHookService mHook = new ActivityHookService();
    private PushAgent mPushAgent;
    private PushRegisterCallback mRegisterCallback;
    private boolean mRegisterFinished;
    private boolean mRegisterSuccess;
    private String s;
    private String s1;
    private Callback mMessageHandler;

    private PushManager() {
        initUmengCommon();
        registerAnalytics();
        registerPush();
    }

    private void registerAnalytics() {
        UmengAnalyticsAgent.init(Utils.getApp());
    }

    public static PushManager inst() {
        if (sInstance == null) {
            synchronized (PushManager.class) {
                if (sInstance == null) {
                    sInstance = new PushManager();
                }
            }
        }
        return sInstance;
    }

    private static Intent getLaunchIntentForPackage(Context context, String packageName) {
        Intent intent = context.getPackageManager().getLaunchIntentForPackage(packageName);
        if (intent == null)
            return null;
        // MIUI 2.3 did not set CATEGORY_LAUNCHER
        if (!intent.hasCategory(Intent.CATEGORY_LAUNCHER)) {
            intent.addCategory(Intent.CATEGORY_LAUNCHER);
        }
        // set package to null and add flags so this intent has same
        // behavior with app launcher
        intent.setPackage(null);
        intent.addFlags(Intent.FLAG_ACTIVITY_RESET_TASK_IF_NEEDED);
        intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
        intent.addFlags(Intent.FLAG_ACTIVITY_CLEAR_TOP);
        return intent;
    }


    private void initUmengCommon() {
        UMConfigure.setLogEnabled(BuildConfig.DEBUG);
        UMConfigure.setEncryptEnabled(true);
    }

    private void registerPush() {
        HuaWeiRegister.register(Utils.getApp());

        mPushAgent = PushAgent.getInstance(Utils.getApp());
        mPushAgent.setPushCheck(BuildConfig.DEBUG);
        mPushAgent.setMessageHandler(new MessageHandler());
        mPushAgent.addAlias(DeviceUuidFactory.inst().getDeviceUuid(), "device_id", new UTrack.ICallBack() {
            @Override
            public void onMessage(boolean isSuccess, String message) {
                LogUtils.d("onMessage : isSuccess" + isSuccess + " , message : " + message);
            }
        });
        //注册推送服务，每次调用register方法都会回调该接口
        mPushAgent.register(new IUmengRegisterCallback() {
            @Override
            public void onSuccess(final String deviceToken) {
                LogUtils.dTag(PushManager.class.getSimpleName(), "register push success,deviceToken :" + deviceToken);
                mRegisterFinished = true;
                mRegisterSuccess = true;

                if (mRegisterCallback != null) {
                    mRegisterCallback.onSuccess(deviceToken);
                }
            }

            @Override
            public void onFailure(final String s, final String s1) {
                LogUtils.dTag(PushManager.class.getSimpleName(), "register push failed,deviceToken : s:" + s + ", s1 : " + s1);
                mRegisterFinished = true;
                mRegisterSuccess = false;
                PushManager.this.s = s;
                PushManager.this.s1 = s1;
                if (mRegisterCallback != null) {
                    mRegisterCallback.onFailure(s, s1);
                }
            }
        });

        Utils.getApp().registerActivityLifecycleCallbacks(new Application.ActivityLifecycleCallbacks() {
            @Override
            public void onActivityCreated(Activity activity, Bundle savedInstanceState) {
                mHook.onActivityCreated(activity, savedInstanceState);
            }

            @Override
            public void onActivityStarted(Activity activity) {
                mHook.onActivityStarted(activity);
            }

            @Override
            public void onActivityResumed(Activity activity) {
                mHook.onActivityResumed(activity);
            }

            @Override
            public void onActivityPaused(Activity activity) {
                mHook.onActivityPaused(activity);
            }

            @Override
            public void onActivityStopped(Activity activity) {
                mHook.onActivityStopped(activity);
            }

            @Override
            public void onActivitySaveInstanceState(Activity activity, Bundle outState) {
                mHook.onActivitySaveInstanceState(activity, outState);
            }

            @Override
            public void onActivityDestroyed(Activity activity) {
                mHook.onActivityDestroyed(activity);
            }
        });

        mPushAgent.setNotificationClickHandler(new UHandler() {
            @Override
            public void handleMessage(Context context, UMessage uMessage) {
                Map<String, String> extra = uMessage.extra;
                String custom = uMessage.custom;
                String title = uMessage.title;
                String text = uMessage.text;
                PushEvent event = new PushEvent(extra, custom, title, text);
                PushManager.this.handleMessage(context, event);
            }
        });
    }


    public void setRegisterCallback(PushRegisterCallback callback) {
        if (callback == null) {
            mRegisterCallback = null;
            return;
        }
        if (mRegisterFinished) {
            if (mRegisterSuccess) {
                callback.onSuccess(mPushAgent.getRegistrationId());
            } else {
                callback.onFailure(s, s1);
            }
        } else {
            mRegisterCallback = callback;
        }
    }

    public void handleMessage(Context context, PushEvent pushEvent) {
        LogUtils.dTag("PushManager", "handleMessage : " + pushEvent);
        openRNActivityIfNeeded(Utils.getApp());
        if (mListeners != null) {
            mListeners.onEvent(pushEvent);
        } else {
            synchronized (mMessageCacheVector) {
                mMessageCacheVector.add(pushEvent);
            }
        }
    }
    public void onReceiveMessage(Context context, PushEvent pushEvent) {
        if (mListeners != null) {
            mListeners.onReceive(pushEvent);
        }
    }
    private void openRNActivityIfNeeded(Context context) {
        Intent intent = getLaunchIntentForPackage(Utils.getApp(), Utils.getApp().getPackageName());
        if (intent != null) {
            Utils.getApp().startActivity(intent);
        }
    }

    public void registerPushEventListener(PushEventListener listener) {
        mListeners = listener;
        List<PushEvent> messages = new ArrayList<>();
        synchronized (mMessageCacheVector) {
            if (!mMessageCacheVector.isEmpty()) {
                messages.addAll(mMessageCacheVector);
                mMessageCacheVector.clear();
            }
        }
        for (PushEvent msg : messages) {
            mListeners.onEvent(msg);
        }
    }

    public void removePushEventListener(PushEventListener listener) {
        mListeners = null;
    }

    public interface PushRegisterCallback {
        void onSuccess(String deviceToken);

        void onFailure(String s, String s1);
    }

    public interface PushEventListener {
        void onEvent(PushEvent event);
        void onReceive(PushEvent event);
    }
}
