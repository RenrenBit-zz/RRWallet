package com.renrenbit.rrwallet.service.push;

import android.content.Intent;
import android.os.Bundle;

import com.blankj.utilcode.util.LogUtils;
import com.renrenbit.rrwallet.R;
import com.umeng.message.UmengNotifyClickActivity;

import org.android.agoo.common.AgooConstants;
import org.json.JSONException;
import org.json.JSONObject;

/**
 * Created by jackQ on 2018/6/18.
 */

public class PushReceiveActivity extends UmengNotifyClickActivity {

    @Override
    protected void onCreate(Bundle bundle) {
        super.onCreate(bundle);
        setContentView(R.layout.activity_push);
    }

    @Override
    public void onMessage(Intent intent) {
        super.onMessage(intent);
        String body = intent.getStringExtra(AgooConstants.MESSAGE_BODY);
        LogUtils.d("msg : " + body);
        String custom = null;
        JSONObject extra = null;
        String title = null;
        String text = null;
        try {
            JSONObject jsonObject = new JSONObject(body);
            JSONObject jsonBody = jsonObject.optJSONObject("body");
            extra = jsonObject.optJSONObject("extra");
            custom = jsonObject.optJSONObject("body").optString("custom");
            title = jsonBody.optString("title");
            text = jsonBody.optString("text");
        } catch (JSONException e) {
            e.printStackTrace();
        }
        PushEvent event = new PushEvent(extra, custom, title, text);
        LogUtils.dTag("push msg: " + event);
        PushManager.inst().handleMessage(this, event);
        finish();
    }
}
