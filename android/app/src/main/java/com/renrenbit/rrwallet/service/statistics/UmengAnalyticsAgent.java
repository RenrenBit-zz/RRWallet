package com.renrenbit.rrwallet.service.statistics;

import android.app.Activity;
import android.content.Context;

import com.umeng.analytics.MobclickAgent;

/**
 * Created by jackQ on 2018/8/11.
 */

public class UmengAnalyticsAgent {
    public static void init(Context context) {
        MobclickAgent.setScenarioType(context, MobclickAgent.EScenarioType.E_UM_NORMAL);
    }

    public static void onResume(Activity activity) {
        MobclickAgent.onResume(activity);
    }


    public static void onPause(Activity activity) {
        MobclickAgent.onPause(activity);
    }
}
