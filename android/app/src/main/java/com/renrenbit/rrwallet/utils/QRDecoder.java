package com.renrenbit.rrwallet.utils;

import android.content.Context;
import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import android.text.TextUtils;

import com.google.zxing.BinaryBitmap;
import com.google.zxing.ChecksumException;
import com.google.zxing.DecodeHintType;
import com.google.zxing.FormatException;
import com.google.zxing.NotFoundException;
import com.google.zxing.RGBLuminanceSource;
import com.google.zxing.Result;
import com.google.zxing.common.HybridBinarizer;
import com.google.zxing.qrcode.QRCodeReader;


import java.util.Hashtable;
import java.util.concurrent.Callable;
import java.util.concurrent.ExecutionException;
import java.util.concurrent.Executor;
import java.util.concurrent.Executors;
import java.util.concurrent.FutureTask;


public class QRDecoder {
    public class DecodeResult {
        public String data = null;
        public String errMsg = null;
    }

    public DecodeResult loadImageFromURL(String url,Context context) throws ExecutionException, InterruptedException {
        FutureTask<Result> result = new FutureTask<Result>(new scanningImage(url));
        Executor executor= Executors.newSingleThreadExecutor();
        executor.execute(result);
        DecodeResult object = new DecodeResult();

        if (result.get() != null) {
            object.data = result.get().getText();
        } else {
            object.errMsg = "未识别到二维码";
        }
        return object;
    }


    static class scanningImage implements Callable<Result> {
        private String path;
        private Bitmap scanBitmap;

        public scanningImage(String url) {
            path = url;//"/storage/emulated/0/DCIM/ReactNative-snapshot-image976078480.png";
        }

        @Override
        public Result call() throws Exception {
            if(TextUtils.isEmpty(path)){
                return null;
            }
            Hashtable<DecodeHintType, String> hints = new Hashtable<>();
            hints.put(DecodeHintType.CHARACTER_SET, "UTF8"); //设置二维码内容的编码

            BitmapFactory.Options options = new BitmapFactory.Options();
            options.inJustDecodeBounds = true; // 先获取原大小
            scanBitmap = BitmapFactory.decodeFile(path, options);
            options.inJustDecodeBounds = false; // 获取新的大小
            int sampleSize = (int) (options.outHeight / (float) 200);
            if (sampleSize <= 0)
                sampleSize = 1;
            options.inSampleSize = sampleSize;
            scanBitmap = BitmapFactory.decodeFile(path, options);
            int width = scanBitmap.getWidth();
            int height = scanBitmap.getHeight();
            int[] pixels = new int[width * height];
            scanBitmap.getPixels(pixels, 0, width, 0, 0, width, height);
            RGBLuminanceSource source = new RGBLuminanceSource(width,height,pixels);
            BinaryBitmap bitmap1 = new BinaryBitmap(new HybridBinarizer(source));
            QRCodeReader reader = new QRCodeReader();
            try {
                return reader.decode(bitmap1, hints);
            } catch (NotFoundException e) {
                e.printStackTrace();
            } catch (ChecksumException e) {
                e.printStackTrace();
            } catch (FormatException e) {
                e.printStackTrace();
            }
            return null;
        }
    }
}
