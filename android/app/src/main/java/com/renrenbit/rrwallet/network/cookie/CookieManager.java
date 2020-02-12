package com.renrenbit.rrwallet.network.cookie;

import com.blankj.utilcode.util.Utils;

import java.io.IOException;
import java.net.URI;
import java.util.List;
import java.util.Map;

import okhttp3.JavaNetCookieJar;

/**
 * Created by jackQ on 2018/6/2.
 */

public class CookieManager {

    private static CookieManager sInstance;
    private final CookieHandler mHandler;
    private final JavaNetCookieJar mCookieJar;

    private CookieManager() {
        mHandler = new CookieHandler(Utils.getApp());
        mCookieJar = new JavaNetCookieJar(mHandler);
    }

    public static CookieManager inst() {
        if (sInstance == null) {
            synchronized (CookieManager.class) {
                if (sInstance == null) {
                    sInstance = new CookieManager();
                }
            }
        }
        return sInstance;
    }

    public JavaNetCookieJar getCookieJar() {
        return mCookieJar;
    }

    public Map<String, List<String>> get(URI uri, Map<String, List<String>> headers)
            throws IOException {
        return mHandler.get(uri, headers);
    }

    public void set(URI uri, Map<String, List<String>> headers) throws IOException {
        mHandler.put(uri, headers);
    }
}
