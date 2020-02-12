package com.renrenbit.rrwallet.service.push;

import org.json.JSONException;
import org.json.JSONObject;

import java.util.Map;

/**
 * Created by jackQ on 2018/6/21.
 */

public class PushEvent {
    private final String mCustom;
    private final JSONObject mExtra;
    private final String mTitle;
    private final String mText;
    public PushEvent(Map<String, String> extra, String custom, String title, String text) {
        mCustom = custom;
        mTitle = title;
        mText = text;
        JSONObject jsonObject = new JSONObject();
        if (extra != null) {
            for (Map.Entry<String, String> entry : extra.entrySet()) {
                try {
                    jsonObject.put(entry.getKey(), entry.getValue());
                } catch (Exception e) {
                    e.printStackTrace();
                }
            }
        }
        mExtra = jsonObject;
    }

    public PushEvent(JSONObject extra, String custom, String title, String text) {
        this.mExtra = extra;
        this.mCustom = custom;
        this.mTitle = title;
        this.mText = text;
    }

    public JSONObject toJson() {
        JSONObject obj = new JSONObject();
        try {
            obj.put("extra", mExtra);
            obj.put("custom", mCustom);
            obj.put("title", mTitle);
            obj.put("text", mText);
        } catch (JSONException e) {
            e.printStackTrace();
        }
        return obj;
    }

    @Override
    public String toString() {
        return toJson().toString();
    }
}
