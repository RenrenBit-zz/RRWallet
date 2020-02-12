package com.renrenbit.rrwallet.react.module;

import android.content.Intent;
import android.net.Uri;
import android.provider.Settings;
import android.support.v4.app.NotificationManagerCompat;

import com.blankj.utilcode.util.Utils;
import com.renrenbit.rrwallet.service.push.PushEvent;
import com.renrenbit.rrwallet.service.push.PushManager;
import com.renrenbit.rrwallet.utils.Constants;
import com.renrenbit.rrwallet.utils.RNUtils;
import com.facebook.react.bridge.Callback;
import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.bridge.WritableNativeMap;
import com.facebook.react.module.annotations.ReactModule;
import com.facebook.react.modules.core.DeviceEventManagerModule;

import org.json.JSONException;

/**
 * Created by jackQ on 2018/6/18.
 */
@ReactModule(name = Constants.REACT_MODULE_NAME_NOTIFICATION)
public class NotificationModule extends ReactContextBaseJavaModule {
    NotificationModule(ReactApplicationContext reactContext) {
        super(reactContext);
    }

    @ReactMethod
    public void register(final Callback callback) {
        PushManager.inst().setRegisterCallback(new PushManager.PushRegisterCallback() {
            @Override
            public void onSuccess(String deviceToken) {
                WritableMap map = new WritableNativeMap();
                map.putBoolean("success", true);
                map.putString("deviceToken", deviceToken);
                if (callback != null) {
                    callback.invoke(map);
                }
            }

            @Override
            public void onFailure(String s, String s1) {
                WritableMap map = new WritableNativeMap();
                map.putBoolean("success", false);
                map.putString("s", s);
                map.putString("s1", s1);
                if (callback != null) {
                    callback.invoke(map);
                }
            }
        });
        PushManager.inst().registerPushEventListener(new PushManager.PushEventListener() {
            @Override
            public void onEvent(PushEvent event) {
                if (event == null) {
                    return;
                }
                try {
                    sendEventToJs(Constants.PUSH_EVENT, RNUtils.convertJsonToMap(event.toJson()));
                } catch (JSONException e) {
                    e.printStackTrace();
                }
            }

            @Override
            public void onReceive(PushEvent event) {
                if (event == null) {
                    return;
                }
                try {
                    sendEventToJs(Constants.RECEIVE_EVENT, RNUtils.convertJsonToMap(event.toJson()));
                } catch (JSONException e) {
                    e.printStackTrace();
                }
            }
        });
    }

    @ReactMethod
    public void checkPermissions(Promise promise) {
        boolean enable = NotificationManagerCompat.from(getReactApplicationContext())
                .areNotificationsEnabled();
        if (promise != null) {
            promise.resolve(enable);
        }
    }

    @ReactMethod
    public void requestPermissions() {
        boolean enable = NotificationManagerCompat.from(getReactApplicationContext())
                .areNotificationsEnabled();
        if (!enable) {
            try {
                Intent intent = new Intent();
                intent.setAction(Settings.ACTION_APPLICATION_DETAILS_SETTINGS);
                intent.setData(Uri.fromParts("package", Utils.getApp().getPackageName(), null));
                intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                Utils.getApp().startActivity(intent);
            }catch (Throwable throwable){
                throwable.printStackTrace();
            }
        }
    }



    @Override
    public String getName() {
        return Constants.REACT_MODULE_NAME_NOTIFICATION;
    }

    /**
     * @param eventName 事件的名称
     * @param obj       对应的Value
     */
    private void sendEventToJs(String eventName, Object obj) {
        getReactApplicationContext().getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter.class).emit(eventName, obj);
    }
}
