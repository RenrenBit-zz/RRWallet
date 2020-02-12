package com.renrenbit.rrwallet.utils;

import android.os.Handler;
import android.os.Looper;
import android.os.Message;

import java.lang.ref.WeakReference;

public class WeakHandler extends Handler {

    public interface IHandler {
        public void handleMsg(Message msg);
    }

    WeakReference<IHandler> mRef;

    public WeakHandler(IHandler handler) {
        mRef = new WeakReference<IHandler>(handler);
    }

    public WeakHandler(Looper looper, IHandler handler) {
        super(looper);
        mRef = new WeakReference<IHandler>(handler);
    }

    @Override
    public void handleMessage(Message msg) {
        IHandler handler = mRef.get();
        if (handler != null && msg != null)
            handler.handleMsg(msg);
    }
}