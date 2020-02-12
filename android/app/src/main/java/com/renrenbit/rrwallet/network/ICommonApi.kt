package com.renrenbit.rrwallet.network

import retrofit2.Call
import retrofit2.http.*
import retrofit2.http.POST



/**
 * Created by jackQ on 2018/6/1.
 */
interface ICommonApi {
    @GET
    fun get(@Url relativePath: String, @HeaderMap headers: Map<String, String>): Call<String>

    @POST
    @FormUrlEncoded
    fun post(@Url relativePath: String,
             @FieldMap(encoded = true) fields: Map<String, String>,
             @HeaderMap headers: Map<String, String>): Call<String>


    @POST
    fun post(@Url relativePath: String,
             @Body data: String,
             @HeaderMap headers: Map<String, String>): Call<String>


}