package com.renrenbit.rrwallet.service.wallet;

/**
 * Created by jackQ on 2018/7/25.
 */

public class SignChecker {
    static {
        try {
            System.loadLibrary("wsc");
        } catch (Throwable ignored) {
            ignored.printStackTrace();
        }
    }

    public static void init() {
        init_native();
    }


    private static native void init_native();
}
