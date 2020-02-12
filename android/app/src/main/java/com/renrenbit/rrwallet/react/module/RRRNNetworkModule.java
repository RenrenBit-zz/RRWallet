package com.renrenbit.rrwallet.react.module;

import com.renrenbit.rrwallet.network.Callback;
import com.renrenbit.rrwallet.network.NetworkManager;
import com.renrenbit.rrwallet.network.RetrofitUtils;
import com.renrenbit.rrwallet.service.wallet.btc.BtcWalletHelper;
import com.renrenbit.rrwallet.service.wallet.ether.EthWalletHelper;
import com.renrenbit.rrwallet.utils.Constants;
import com.renrenbit.rrwallet.utils.RNUtils;
import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.ReadableArray;
import com.facebook.react.bridge.ReadableMap;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.module.annotations.ReactModule;

import org.json.JSONException;
import org.json.JSONObject;

import java.io.IOException;
import java.util.HashMap;
import java.util.Map;

import okhttp3.MediaType;
import okhttp3.RequestBody;
import okhttp3.ResponseBody;
import retrofit2.Call;
import retrofit2.Response;
import retrofit2.http.Body;
import retrofit2.http.HeaderMap;
import retrofit2.http.POST;
import retrofit2.http.Url;

/**
 * Created by jackQ on 2018/5/31.
 */
@ReactModule(name = Constants.REACT_MODULE_NETWORK_NAME)
class RRRNNetworkModule extends ReactContextBaseJavaModule {
    private final ReactApplicationContext mReaftContext;

    RRRNNetworkModule(ReactApplicationContext reactContext) {
        super(reactContext);
        mReaftContext = reactContext;
    }

    @Override
    public String getName() {
        return Constants.REACT_MODULE_NETWORK_NAME;
    }

    @ReactMethod
    public void fetch(String url, final ReadableMap params, final Promise promise) {
        try {
            HashMap<String, String> headers = RNUtils.convertMapToHashMap(params);
            NetworkManager.Companion.getInst().getAsync(url, headers, new Callback() {
                @Override
                public void onResponse(String response) {
                    if (promise != null) {
                        WritableMap map;
                        try {
                            map = RNUtils.convertJsonToMap(new JSONObject(response));
                            promise.resolve(map);
                        } catch (Exception e) {
                            promise.resolve(response);
                        }
                    }
                }

                @Override
                public void onFailure(Throwable t) {
                    if (promise != null) {
                        promise.reject(t);
                    }
                    t.printStackTrace();
                }

            });
        } catch (Throwable e) {
            e.printStackTrace();
            if (promise != null) {
                promise.reject(e);
            }
        }
    }

    @ReactMethod
    public void post(String url, final ReadableMap jsBody, final ReadableMap jsHeaders, final Promise promise) {
        try {
            JSONObject body = RNUtils.convertMapToJSON(jsBody);
            HashMap<String, String> headers = RNUtils.convertMapToHashMap(jsHeaders);
            NetworkManager.Companion.getInst().postAsync(url, headers, body, new Callback() {
                @Override
                public void onResponse(String response) {
                    if (promise != null) {
                        WritableMap map;
                        try {
                            map = RNUtils.convertJsonToMap(new JSONObject(response));
                            promise.resolve(map);
                        } catch (JSONException e) {
                            promise.resolve(response);
                            e.printStackTrace();
                        }
                    }
                }

                @Override
                public void onFailure(Throwable t) {
                    if (promise != null) {
                        promise.reject(t);
                    }
                    t.printStackTrace();
                }
            });
        } catch (Throwable e) {
            e.printStackTrace();
            if (promise != null) {
                promise.reject(e);
            }
        }
    }

    @ReactMethod
    public void jsonrpc(String url, String method, ReadableArray params, ReadableMap headers, final Promise promise) {
        IApi api = RetrofitUtils.Companion.createService(url, IApi.class);

        JSONObject body = new JSONObject();
        try {
            body.put("method", method);
            body.put("jsonrpc", "2.0");
            body.put("params", RNUtils.convertArrayToJSON(params));
            body.put("id", "1");
            HashMap<String, String> headersMap = RNUtils.convertMapToHashMap(headers);
            if(headersMap == null){
                headersMap = new HashMap<>();
            }
            okhttp3.RequestBody requestBody = okhttp3.RequestBody.create(MediaType.parse("application/json"), body.toString());
            api.sendRpc("", requestBody,headersMap).enqueue(new retrofit2.Callback<String>() {
                @Override
                public void onResponse(Call<String> call, Response<String> response) {
                    String resp = null;
                    if (response.isSuccessful()) {
                        resp = response.body();
                    } else {
                        ResponseBody errBody = response.errorBody();
                        if (errBody != null) {
                            try {
                                resp = errBody.string();
                            } catch (IOException e) {
                                e.printStackTrace();
                            }
                        }
                    }
                    if (promise != null) {
                        try {
                            promise.resolve(RNUtils.convertJsonToMap(new JSONObject(resp)));
                        } catch (JSONException e) {
                            promise.reject(e);
                        }
                    }
                }

                @Override
                public void onFailure(Call<String> call, Throwable t) {
                    if (promise != null) {
                        promise.reject(t);
                    }
                }
            });

        } catch (Exception e) {
            e.printStackTrace();
        }

    }


    @ReactMethod
    public void setRpcUrls(String eth, String btc, String usdt, Promise promise) {
        EthWalletHelper.Companion.setEthAddress(eth);
        if (promise != null) {
            promise.resolve(true);
        }
    }


    @ReactMethod
    public void setEnv(int useTestEnv, Promise promise) {
        //0是正式，1是测试
        BtcWalletHelper.setEnv(useTestEnv == 1);
        if(promise!=null){
            promise.resolve(true);
        }
    }

    interface IApi {
        @POST
        public Call<String> sendRpc(@Url String path, @Body RequestBody body, @HeaderMap Map<String, String> map);

//        @POST
//        fun sendRawTransaction(@Url relativePath:String,
//                               @Body body:RequestBody):Call<String>
    }

}
