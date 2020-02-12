package com.renrenbit.rrwallet.network

import android.content.pm.PackageManager
import android.text.TextUtils
import com.blankj.utilcode.util.StringUtils
import com.blankj.utilcode.util.Utils
import com.renrenbit.rrwallet.BuildConfig
import com.renrenbit.rrwallet.network.cookie.CookieManager
import com.renrenbit.rrwallet.utils.Constants
import com.facebook.react.modules.network.CookieJarContainer
import com.facebook.react.modules.network.ReactCookieJarContainer
import com.facebook.stetho.okhttp3.StethoInterceptor
import okhttp3.OkHttpClient
import retrofit2.Retrofit
import retrofit2.converter.scalars.ScalarsConverterFactory
import java.util.concurrent.TimeUnit


/**
 * Created by jackQ on 2018/6/1.
 */
open class RetrofitUtils {
    companion object {
        private val sRetrofitCache = LimitCountCache<String, Retrofit>(10)

        @Synchronized
        fun <S> createService(baseUrl: String, serviceClass: Class<S>): S {
            val retrofit = getRetrofit(baseUrl)
            return createService(retrofit, serviceClass)
        }

        @Synchronized
        private fun getRetrofit(baseUrl: String): Retrofit {
            var retrofit = sRetrofitCache[baseUrl]
            if (retrofit != null) {
                return retrofit
            }
            retrofit = createRetrofit(baseUrl)
            sRetrofitCache.put(baseUrl, retrofit)
            return retrofit
        }

        @Synchronized
        private fun <S> createService(retrofit: Retrofit, serviceClass: Class<S>): S {
            return retrofit.create(serviceClass)
        }


        private var sOkHttpClient: OkHttpClient? = null

        @Synchronized private fun createRetrofit(baseUrl: String): Retrofit {
            val builder = Retrofit.Builder().baseUrl(baseUrl)
                    .client(getOkHttpClient(baseUrl))
                    .addConverterFactory(ScalarsConverterFactory.create())
            return builder.build()
        }

        @Synchronized
        fun getOkHttpClient(baseUrl: String?): OkHttpClient {
            if (baseUrl != null && (baseUrl.contains("gateway.d.cash") || baseUrl.contains("gateway.bitrenren.com")) && !BuildConfig.DEBUG) {
                val client = OkHttpClient.Builder()
                        .addNetworkInterceptor(StethoInterceptor())
                        .connectTimeout(Constants.HTTP_CONNECT_TIMEOUT, TimeUnit.SECONDS)
                        .readTimeout(Constants.HTTP_READ_TIMEOUT, TimeUnit.SECONDS)
                        .addInterceptor { chain ->
                            val request = chain.request()
                                    .newBuilder()
                                    .build()
                            chain.proceed(request)
                        }
                        .writeTimeout(Constants.HTTP_WRITE_TIMEOUT, TimeUnit.SECONDS)
                        .sslSocketFactory(SSLSocketFactoryUtils.createSSLSocketFactory(Utils.getApp()))
//                        .hostnameVerifier(SSLSocketFactoryUtils.safeHostnameVerifier())
                        .cookieJar(ReactCookieJarContainer())
                        .build()
                val container = client!!.cookieJar() as CookieJarContainer
                container.setCookieJar(CookieManager.inst().cookieJar)
                return client
            } else if (sOkHttpClient == null) {
                val builder = OkHttpClient.Builder()
                        .addNetworkInterceptor(StethoInterceptor())
                        .connectTimeout(Constants.HTTP_CONNECT_TIMEOUT, TimeUnit.SECONDS)
                        .readTimeout(Constants.HTTP_READ_TIMEOUT, TimeUnit.SECONDS)
                        .writeTimeout(Constants.HTTP_WRITE_TIMEOUT, TimeUnit.SECONDS)
                        .addInterceptor { chain ->
                            val request = chain.request()
                                    .newBuilder()
                                    .build()
                            chain.proceed(request)
                        }
                        .cookieJar(ReactCookieJarContainer())
                sOkHttpClient = builder.build()
                val container = sOkHttpClient!!.cookieJar() as CookieJarContainer
                container.setCookieJar(CookieManager.inst().cookieJar)
            }
            return sOkHttpClient!!
        }

        private fun getDefaultUserAgent(): String {
            var userAgent: String
            try {
                var ua = System.getProperty("http.agent")
                if (StringUtils.isEmpty(ua)) {
                    return ua
                }
                val version = getVersionInfo()
                if (!StringUtils.isEmpty(version)) {
                    ua = "$ua RRWallet/$version"
                }
                userAgent = ua
            } catch (t: Throwable) {
                userAgent = "RRWallet/xxx"
            }

            try {
                if (!TextUtils.isEmpty(userAgent)) {
                    val a = userAgent.toCharArray()
                    val length = a.size
                    var found = false
                    for (i in 0 until length) {
                        // 0x20 ~ 0x7e
                        if (a[i] < ' ' || a[i] > '~') {
                            a[i] = '?'
                            found = true
                        }
                    }
                    if (found) {
                        return String(a)
                    }
                }
            } catch (ignore: Exception) {
            }
            return userAgent
        }

        private fun getVersionInfo(): String {
            var versionName = ""
            val pm = Utils.getApp().packageManager
            try {
                val packageInfo = pm.getPackageInfo(Utils.getApp().packageName, 0)
                versionName = packageInfo.versionName
            } catch (e: PackageManager.NameNotFoundException) {
            }
            return versionName
        }

    }


}