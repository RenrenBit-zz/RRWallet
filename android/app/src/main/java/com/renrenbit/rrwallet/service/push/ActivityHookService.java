package com.renrenbit.rrwallet.service.push;

import android.app.Activity;
import android.os.Bundle;

import com.renrenbit.rrwallet.service.statistics.UmengAnalyticsAgent;
import com.umeng.message.PushAgent;

/**
 * Created by jackQ on 2018/6/18.
 */

class ActivityHookService {
    void onActivityCreated(Activity activity, Bundle savedInstanceState) {
        PushAgent.getInstance(activity).onAppStart();
    }

    void onActivityStarted(Activity activity) {

    }

    void onActivityResumed(Activity activity) {
        UmengAnalyticsAgent.onResume(activity);
    }

    void onActivityPaused(Activity activity) {
        UmengAnalyticsAgent.onPause(activity);
    }

    void onActivityStopped(Activity activity) {

    }

    void onActivitySaveInstanceState(Activity activity, Bundle outState) {

    }

    void onActivityDestroyed(Activity activity) {

    }
}
