package com.renrenbit.rrwallet.react.module.webview;

import android.Manifest;
import android.annotation.SuppressLint;
import android.app.Activity;
import android.app.AlertDialog;
import android.content.ActivityNotFoundException;
import android.content.DialogInterface;
import android.content.Intent;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.provider.MediaStore;
import android.support.v4.content.FileProvider;
import android.util.Log;
import android.webkit.JsResult;
import android.webkit.ValueCallback;
import android.webkit.WebChromeClient;

import com.blankj.utilcode.util.LogUtils;
import com.blankj.utilcode.util.PermissionUtils;
import com.blankj.utilcode.util.StringUtils;
import com.blankj.utilcode.util.Utils;
import com.renrenbit.rrwallet.utils.PermissionHelper;
import com.facebook.react.bridge.ActivityEventListener;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.common.annotations.VisibleForTesting;

import java.io.File;

import static com.renrenbit.rrwallet.utils.PermissionHelper.requestCamera;

public class RNWebViewModule extends ReactContextBaseJavaModule implements ActivityEventListener {
    private static final int REQUEST_CODE_TAKE_PHOTO = 1003;
    private static final int REQUEST_CODE_VIDEO_CAPTURED = 1004;
    private File fileUri;

    @VisibleForTesting
    public static final String REACT_CLASS = "RNWebViewAndroidModule";

    private RNWebViewPackage aPackage;

    /* FOR UPLOAD DIALOG */
    private final static int REQUEST_SELECT_FILE = 1001;

    private ValueCallback<Uri[]> mUploadMessageArr = null;
    private Uri imageUri;
    private Uri videoUri;

    public RNWebViewModule(ReactApplicationContext reactContext) {
        super(reactContext);

        reactContext.addActivityEventListener(this);
    }

    @Override
    public String getName() {
        return REACT_CLASS;
    }

    public void setPackage(RNWebViewPackage aPackage) {
        this.aPackage = aPackage;
    }

    public RNWebViewPackage getPackage() {
        return this.aPackage;
    }

    @SuppressWarnings("unused")
    public Activity getActivity() {
        return getCurrentActivity();
    }

    public void showAlert(String url, String message, final JsResult result) {
        AlertDialog ad = new AlertDialog.Builder(getCurrentActivity())
                .setMessage(message)
                .setPositiveButton("Ok", new DialogInterface.OnClickListener() {
                    @Override
                    public void onClick(DialogInterface dialog, int which) {
                        result.confirm();
                    }
                })
                .create();

        ad.show();
    }


    // For Android 5.0+
    @SuppressLint("NewApi")
    public boolean startFileChooserIntent(ValueCallback<Uri[]> filePathCallback, WebChromeClient.FileChooserParams intentChoose) {
        Log.d(REACT_CLASS, "Open new file dialog");

        if (mUploadMessageArr != null) {
            mUploadMessageArr.onReceiveValue(null);
            mUploadMessageArr = null;
        }

        mUploadMessageArr = filePathCallback;

        final Activity currentActivity = getCurrentActivity();
        if (currentActivity == null) {
            Log.w(REACT_CLASS, "No context available");
            return false;
        }

        try {
            if (!intentChoose.isCaptureEnabled()) {
                currentActivity.startActivityForResult(intentChoose.createIntent(), REQUEST_SELECT_FILE, new Bundle());
            } else {
                //capture enable
                String[] acceptTypes = intentChoose.getAcceptTypes();
                for (String acceptType : acceptTypes) {
                    if (!StringUtils.isEmpty(acceptType)) {
                        if (acceptType.contains("image")) {
                            fileUri = new File(Utils.getApp().getFilesDir().getPath() + "/public/" + System.currentTimeMillis() + ".png");
                            ensureParentExist(fileUri);
//                            fileUri = new File(Environment.getExternalStorageDirectory().getPath() + "/dfund/" + System.currentTimeMillis() + ".jpg");
                            imageUri = Uri.fromFile(fileUri);
                            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.N) {
                                imageUri = FileProvider.getUriForFile(currentActivity, currentActivity.getPackageName() + ".utilcode.provider", fileUri);//通过FileProvider创建一个content类型的Uri
                            }
                            if (PermissionUtils.isGranted(Manifest.permission.CAMERA)) {
                                takePicture(currentActivity, imageUri, REQUEST_CODE_TAKE_PHOTO);
                            } else {
                                requestCamera(new PermissionHelper.OnPermissionGrantedListener() {
                                    @Override
                                    public void onPermissionGranted() {
                                        takePicture(currentActivity, imageUri, REQUEST_CODE_TAKE_PHOTO);
                                    }
                                }, new PermissionHelper.OnPermissionDeniedListener() {
                                    @Override
                                    public void onPermissionDenied() {
                                        if (mUploadMessageArr != null) {
                                            mUploadMessageArr.onReceiveValue(null);
                                        }
                                        mUploadMessageArr = null;
                                    }
                                });
                            }
                            return true;
                        } else if (acceptType.contains("video")) {
                            fileUri = new File(Utils.getApp().getFilesDir().getPath() + "/public/" + System.currentTimeMillis() + ".3pg");
                            ensureParentExist(fileUri);
                            videoUri = Uri.fromFile(fileUri);
                            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.N) {
                                videoUri = FileProvider.getUriForFile(currentActivity, currentActivity.getPackageName() + ".utilcode.provider", fileUri);//通过FileProvider创建一个content类型的Uri
                            }
                            if (PermissionUtils.isGranted(Manifest.permission.CAMERA)) {
                                recordVideo(currentActivity, videoUri, REQUEST_CODE_VIDEO_CAPTURED);
                            } else {
                                requestCamera(new PermissionHelper.OnPermissionGrantedListener() {
                                                  @Override
                                                  public void onPermissionGranted() {
                                                      recordVideo(currentActivity, videoUri, REQUEST_CODE_VIDEO_CAPTURED);

                                                  }
                                              },
                                        new PermissionHelper.OnPermissionDeniedListener() {
                                            @Override
                                            public void onPermissionDenied() {
                                                if (mUploadMessageArr != null) {
                                                    mUploadMessageArr.onReceiveValue(null);
                                                }
                                                mUploadMessageArr = null;
                                            }
                                        });
                            }

                            return true;
                        } else if (acceptType.contains("audio")) {
                            //not impl
                            return true;
                        }
                    }
                }
            }
        } catch (ActivityNotFoundException e) {
            Log.e(REACT_CLASS, "No context available");
            e.printStackTrace();

            if (mUploadMessageArr != null) {
                mUploadMessageArr.onReceiveValue(null);
                mUploadMessageArr = null;
            }
            return false;
        }

        return true;
    }

    private void ensureParentExist(File fileUri) {
        if (fileUri == null) {
            return;
        }
        File publicDir = new File(fileUri.getParent());
        if (!publicDir.exists() || !publicDir.isDirectory()) {
            try {
                publicDir.delete();
            } catch (Throwable t) {

            }
            publicDir.mkdir();
        }
    }

    private void recordVideo(Activity currentActivity, Uri uri, int requestCode) {
        Intent captureVideoIntent = new Intent(MediaStore.ACTION_VIDEO_CAPTURE);
        captureVideoIntent.putExtra(MediaStore.EXTRA_VIDEO_QUALITY, 1);
        captureVideoIntent.putExtra(MediaStore.EXTRA_OUTPUT, uri);
        currentActivity.startActivityForResult(captureVideoIntent, requestCode);
    }

    private void onActivityResult(int requestCode, int resultCode, Intent data) {
        if (requestCode == REQUEST_SELECT_FILE) {
            if (mUploadMessageArr == null) return;
            mUploadMessageArr.onReceiveValue(WebChromeClient.FileChooserParams.parseResult(resultCode, data));
            mUploadMessageArr = null;
        } else if (requestCode == REQUEST_CODE_TAKE_PHOTO) {
            if (mUploadMessageArr == null)
                return;
            Uri result = imageUri;
            if (result == null) {
                mUploadMessageArr.onReceiveValue(null);
            } else {
                LogUtils.d("file exist : " + fileUri.exists() + " , fileUri " + fileUri.getAbsolutePath());
                mUploadMessageArr.onReceiveValue(new Uri[]{result});
            }
            mUploadMessageArr = null;
        } else if (requestCode == REQUEST_CODE_VIDEO_CAPTURED) {
            Uri result = videoUri;
            if (result == null) {
                mUploadMessageArr.onReceiveValue(null);
            } else {
                mUploadMessageArr.onReceiveValue(new Uri[]{result});
            }
            mUploadMessageArr = null;
        }
    }

    public void onActivityResult(Activity activity, int requestCode, int resultCode, Intent data) {
        this.onActivityResult(requestCode, resultCode, data);
    }

    public void onNewIntent(Intent intent) {
    }


    public static void takePicture(Activity activity, Uri imageUri, int requestCode) {
        //调用系统相机
        Intent intentCamera = new Intent();
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.N) {
            intentCamera.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);
        }
        intentCamera.setAction(MediaStore.ACTION_IMAGE_CAPTURE);
        //将拍照结果保存至photo_file的Uri中，不保留在相册中
        intentCamera.putExtra(MediaStore.EXTRA_OUTPUT, imageUri);
        if (activity != null) {
            activity.startActivityForResult(intentCamera, requestCode);
        }
    }
}
