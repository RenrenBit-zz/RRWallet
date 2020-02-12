package com.renrenbit.rrwallet.network;

import android.content.Context;

import com.renrenbit.rrwallet.R;

import java.io.InputStream;
import java.security.KeyManagementException;
import java.security.KeyStore;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.security.cert.Certificate;
import java.security.cert.CertificateFactory;

import javax.net.ssl.SSLContext;
import javax.net.ssl.SSLSocketFactory;
import javax.net.ssl.TrustManager;
import javax.net.ssl.TrustManagerFactory;

/**
 * Created by jackQ on 2018/7/24.
 */

public class SSLSocketFactoryUtils {
    private static SSLSocketFactory mSSLSocketFactory = null;

    public static SSLSocketFactory createSSLSocketFactory(Context context) {
        if (mSSLSocketFactory == null) {
            synchronized (SSLSocketFactoryUtils.class) {
                if (mSSLSocketFactory == null) {
                    InputStream bitrenren = context.getResources().openRawResource(R.raw.bitrenren_ssl);
                    SSLContext sslContext;
                    try {
                        sslContext = SSLContext.getInstance("TLS");
                    } catch (NoSuchAlgorithmException e) {
                        e.printStackTrace();
                        return null;
                    }
                    //获得服务器端证书
                    TrustManager[] turstManager = getTurstManager(bitrenren);

                    //初始化ssl证书库
                    try {
                        sslContext.init(null, turstManager, new SecureRandom());
                    } catch (KeyManagementException e) {
                        e.printStackTrace();
                    }
                    //获得sslSocketFactory
                    mSSLSocketFactory = sslContext.getSocketFactory();
                }
            }
        }
        return mSSLSocketFactory;
    }

    /**
     * 获得指定流中的服务器端证书库
     */
    private static TrustManager[] getTurstManager(InputStream... certificates) {
        try {
            CertificateFactory certificateFactory = CertificateFactory.getInstance("X.509");
            KeyStore keyStore = KeyStore.getInstance(KeyStore.getDefaultType());
            keyStore.load(null, null);
            int index = 0;
            for (InputStream certificate : certificates) {
                if (certificate == null) {
                    continue;
                }
                Certificate certificate1;
                try {
                    certificate1 = certificateFactory.generateCertificate(certificate);
                } finally {
                    certificate.close();
                }

                String certificateAlias = Integer.toString(index++);
                keyStore.setCertificateEntry(certificateAlias, certificate1);
            }

            TrustManagerFactory trustManagerFactory = TrustManagerFactory.getInstance(TrustManagerFactory
                    .getDefaultAlgorithm());

            trustManagerFactory.init(keyStore);
            return trustManagerFactory.getTrustManagers();
        } catch (Exception e) {
            e.printStackTrace();
        }

        return new TrustManager[0];
    }

//    public static HostnameVerifier safeHostnameVerifier() {
//        return new SafeHostnameVerifier();
//    }
//
//
//    private static class SafeHostnameVerifier implements HostnameVerifier {
//
//        @Override
//        public boolean verify(String hostname, SSLSession session) {
//            return false;
//        }
//    }
}
