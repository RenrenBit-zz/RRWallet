package com.renrenbit.rrwallet.network;

/**
 * Created by jackQ on 2018/6/2.
 */

public interface Callback {
    void onResponse(String response);

    void onFailure(Throwable throwable);
}
