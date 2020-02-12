package com.renrenbit.rrwallet.react.module;

import com.renrenbit.rrwallet.utils.Constants;
import com.renrenbit.rrwallet.utils.QRDecoder;
import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.module.annotations.ReactModule;

import java.util.concurrent.ExecutionException;


@ReactModule(name = Constants.REACT_MODULE_NAME_DFRN_QRDECODER)
public class RRRNQRDecoderModule extends ReactContextBaseJavaModule {
    private final ReactApplicationContext mReaftContext;
    @Override
    public String getName() {
        return Constants.REACT_MODULE_NAME_DFRN_QRDECODER;
    }

    RRRNQRDecoderModule(ReactApplicationContext reactContext) {
        super(reactContext);
        mReaftContext = reactContext;
    }

    @ReactMethod
    public void decode(String path, Promise promise) throws ExecutionException, InterruptedException {
        QRDecoder decoder = new QRDecoder();
        QRDecoder.DecodeResult result = decoder.loadImageFromURL(path,mReaftContext);
        if (result.data != null) {
            promise.resolve(result.data);
        } else  {
            promise.reject(result.errMsg);
        }
    }
}
