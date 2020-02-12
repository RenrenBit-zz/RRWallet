package com.renrenbit.rrwallet.utils;

import rx.Observable;
import rx.android.schedulers.AndroidSchedulers;
import rx.schedulers.Schedulers;

public class ThreadScheduleUtils {
    public static <T> Observable<T> observeOnMainThread(Observable<T> obs) {
        return obs.observeOn(AndroidSchedulers.mainThread());
    }

    public static <T> Observable<T> subscribeOnIoThread(Observable<T> obs) {
        return obs.subscribeOn(Schedulers.io());
    }

    public static <T> Observable<T> simpleScheduleThread(Observable<T> obs) {
        return subscribeOnIoThread(observeOnMainThread(obs));
    }
}
