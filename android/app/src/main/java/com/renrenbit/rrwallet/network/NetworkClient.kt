package com.renrenbit.rrwallet.network

import org.json.JSONObject

/**
 * Created by jackQ on 2018/6/1.
 */
interface NetworkClient {
    fun get(url: String, headers: MutableMap<String, String>?): String?

    fun getAsync(url: String, headers: MutableMap<String, String>?, callback: Callback)

    fun post(url: String, headers: MutableMap<String, String>?, params: MutableMap<String, String>?): JSONObject?

    fun postAsync(url: String, headers: MutableMap<String, String>?, params: MutableMap<String, String>?, callback: Callback)

    fun post(url: String, headers: MutableMap<String, String>?, data: String?): String?

    fun postAsync(url: String, headers: MutableMap<String, String>?, data: String?, callback: Callback)
}