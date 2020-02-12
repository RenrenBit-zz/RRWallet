package com.renrenbit.rrwallet.service.push;

import android.app.Notification;
import android.content.Context;

import com.umeng.message.UmengMessageHandler;
import com.umeng.message.entity.UMessage;

/**
 * Created by jackQ on 2018/6/18.
 */

public class MessageHandler extends UmengMessageHandler {

    /**
     * 通知的回调方法
     *
     * @param context
     * @param msg
     */
    @Override
    public void dealWithNotificationMessage(Context context, UMessage msg) {
        //调用super则会走通知展示流程，不调用super则不展示通知
        super.dealWithNotificationMessage(context, msg);
    }

    @Override
    public void dealWithCustomMessage(Context context, UMessage uMessage) {
        PushEvent event = new PushEvent(uMessage.extra, uMessage.custom, uMessage.title, uMessage.text);
        PushManager.inst().handleMessage(context, event);
    }

    @Override
    public Notification getNotification(Context context, UMessage uMessage) {
        PushEvent event = new PushEvent(uMessage.extra, uMessage.custom, uMessage.title, uMessage.text);
        PushManager.inst().onReceiveMessage(context, event);
        return super.getNotification(context, uMessage);
    }
}
