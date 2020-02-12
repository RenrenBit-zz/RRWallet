package com.renrenbit.rrwallet.react.module;

import com.renrenbit.rrwallet.utils.Constants;
import com.renrenbit.rrwallet.utils.RNUtils;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.ReadableMap;
import com.facebook.react.module.annotations.ReactModule;
import com.umeng.analytics.MobclickAgent;

import org.json.JSONException;

import java.util.HashMap;

@ReactModule(name = Constants.REACT_MODULE_NAME_ANALYSIS)
class RRRNAnalysisModule extends ReactContextBaseJavaModule {
    private final ReactApplicationContext reactContext;

    public RRRNAnalysisModule(ReactApplicationContext reactContext) {
        super(reactContext);
        this.reactContext = reactContext;
    }

    @Override
    public String getName() {
        return Constants.REACT_MODULE_NAME_ANALYSIS;
    }

    @ReactMethod
    public void event(String event, ReadableMap attributes) {
        try {
            HashMap<String, String> attributesMap = RNUtils.convertMapToHashMap(attributes);
            if (attributesMap.size() == 0) {
                MobclickAgent.onEvent(this.reactContext, event);
            } else  {
                MobclickAgent.onEvent(this.reactContext, event, attributesMap);
            }

        } catch (JSONException e) {
            e.printStackTrace();
        }
    }

    @ReactMethod
    public void counter(String event, ReadableMap attributes, String count) {
        try {
            HashMap<String, String> attributesMap = RNUtils.convertMapToHashMap(attributes);

            MobclickAgent.onEventValue(this.reactContext, event, attributesMap, Integer.valueOf(count).intValue());
        } catch (JSONException e) {
            e.printStackTrace();
        }
    }

}
