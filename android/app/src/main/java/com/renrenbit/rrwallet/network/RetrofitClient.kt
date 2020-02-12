package com.renrenbit.rrwallet.network

import android.net.Uri
import android.support.annotation.WorkerThread
import android.text.TextUtils
import android.util.Pair
import com.renrenbit.rrwallet.utils.Constants
import org.json.JSONObject

/**
 * Created by jackQ on 2018/6/1.
 */
class RetrofitClient : NetworkClient {

    @WorkerThread
    override fun get(url: String, headers: MutableMap<String, String>?): String? {
        val pair = parseUrl(url)
        val baseUrl = pair.first
        val path = pair.second
        val commonApi = RetrofitUtils.createService(baseUrl, ICommonApi::class.java)
        val resp = commonApi.get(path, headers ?: HashMap()).execute()
        if (resp.isSuccessful) {
            if (resp.body() != null) {
                return resp.body().toString()
            }
        } else {
            if (resp.errorBody() != null) {
                return resp.errorBody()!!.string()
            }
        }
        return ""
    }

    override fun getAsync(url: String, headers: MutableMap<String, String>?, callback: Callback) {
        val pair = parseUrl(url)
        val baseUrl = pair.first
        val path = pair.second
        val commonApi = RetrofitUtils.createService(baseUrl, ICommonApi::class.java)
        commonApi.get(path, headers ?: HashMap()).enqueue(RetrofitResponseAdapter(callback))
    }

    override fun post(url: String, headers: MutableMap<String, String>?, data: String?): String? {
        val pair = parseUrl(url)
        val baseUrl = pair.first
        val path = pair.second
        val h = headers ?: HashMap()
        val k = "Content-Type"
        if (TextUtils.isEmpty(h[k])) {
            h[k] = Constants.CONTENT_TYPE
        }
        val api = RetrofitUtils.createService(baseUrl, ICommonApi::class.java)
        return api.post(path, data ?: "", h).execute().body().toString()
    }

    override fun postAsync(url: String, headers: MutableMap<String, String>?, data: String?, callback: Callback) {
        val pair = parseUrl(url)
        val baseUrl = pair.first
        val path = pair.second
        val h = headers ?: HashMap()
        val k = "Content-Type"
        if (TextUtils.isEmpty(h[k])) {
            h[k] = Constants.CONTENT_TYPE
        }
        val api = RetrofitUtils.createService(baseUrl, ICommonApi::class.java)
        api.post(path, data ?: "", h).enqueue(RetrofitResponseAdapter(callback))
    }

    @WorkerThread
    override fun post(url: String, headers: MutableMap<String, String>?, params: MutableMap<String, String>?): JSONObject? {
        val pair = parseUrl(url)
        val baseUrl = pair.first
        val path = pair.second
        val api = RetrofitUtils.createService(baseUrl, ICommonApi::class.java)
        return JSONObject(api.post(path, params ?: HashMap(), headers ?: HashMap()).execute().body().toString())
    }


    override fun postAsync(url: String, headers: MutableMap<String, String>?, params: MutableMap<String, String>?, callback: Callback) {
        val pair = parseUrl(url)
        val baseUrl = pair.first
        val path = pair.second
        val api = RetrofitUtils.createService(baseUrl, ICommonApi::class.java)
        api.post(path, params ?: HashMap(), headers ?: HashMap()).enqueue(RetrofitResponseAdapter(callback))
    }

    private fun parseUrl(url: String): Pair<String, String> {
        val uri = Uri.parse(url)
        val buffer = StringBuilder()
        val scheme = uri.scheme
        val host = uri.host
        val port = uri.port
        if (host != null) {
            if (scheme != null) {
                buffer.append(scheme)
                buffer.append("://")
            }
            buffer.append(host)
            if (port > 0) {
                buffer.append(':')
                buffer.append(port)
            }
        }
        val baseUrl = buffer.toString()
        var path = uri.path
        val query = uri.encodedQuery
        if (query != null) {
            path = "$path?$query"
        }
        return android.util.Pair(baseUrl, path)
    }
}