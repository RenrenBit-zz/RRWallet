package com.renrenbit.rrwallet.network

import org.json.JSONObject

/**
 * Created by jackQ on 2018/6/1.
 */
class NetworkManager private constructor() {
    companion object {
        private val TAG = NetworkManager::class.simpleName
        val inst: NetworkManager by lazy(mode = LazyThreadSafetyMode.SYNCHRONIZED) {
            NetworkManager()
        }
    }

    private var mDefault: NetworkClient = RetrofitClient()

    fun setDefaultClient(client: NetworkClient) {
        mDefault = client
    }

    fun getDefaultClient(): NetworkClient {
        return mDefault
    }

    fun getAsync(url: String, headers: MutableMap<String, String>?, callback: Callback) {
        mDefault.getAsync(url, headers, callback)
    }

    fun get(url: String, headers: MutableMap<String, String>?): String? {
        return mDefault.get(url, headers)
    }

    fun postAsync(url: String, headers: MutableMap<String, String>?, body: JSONObject?, callback: Callback) {
        mDefault.postAsync(url, headers, body?.toString(), callback)
    }

    fun postAsync(url: String, headers: MutableMap<String, String>?, params: MutableMap<String, String>?, callback: Callback) {
        mDefault.postAsync(url, headers, params, callback)
    }

    fun post(url: String, headers: MutableMap<String, String>?, body: JSONObject?): String? {
        return mDefault.post(url,headers,body.toString())
    }
}