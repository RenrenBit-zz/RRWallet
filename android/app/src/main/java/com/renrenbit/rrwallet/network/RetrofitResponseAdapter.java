package com.renrenbit.rrwallet.network;

import retrofit2.Call;
import retrofit2.Response;

/**
 * Created by jackQ on 2018/6/2.
 */

@SuppressWarnings("unchecked")
public class RetrofitResponseAdapter implements retrofit2.Callback<String> {

    private final Callback mCallback;

    public RetrofitResponseAdapter(Callback callback) {
        mCallback = callback;
    }

    @Override
    public void onResponse(Call<String> call, Response<String> response) {
        try {
            if (response.isSuccessful()) {
                mCallback.onResponse(response.body());
            } else {
                String errorResp = response.errorBody() != null ? response.errorBody().string() : "";
                mCallback.onResponse(errorResp);
            }
        } catch (Throwable e) {
            mCallback.onFailure(e);
        }
    }

    @Override
    public void onFailure(Call<String> call, Throwable t) {
        mCallback.onFailure(t);
    }
}
