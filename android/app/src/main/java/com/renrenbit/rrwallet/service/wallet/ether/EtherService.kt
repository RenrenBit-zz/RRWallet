package com.renrenbit.rrwallet.service.wallet.ether

import android.text.TextUtils
import android.util.Pair
import com.blankj.utilcode.util.LogUtils
import com.blankj.utilcode.util.NetworkUtils
import com.blankj.utilcode.util.StringUtils
import com.renrenbit.rrwallet.service.wallet.Transaction
import com.renrenbit.rrwallet.service.wallet.Wallet
import com.renrenbit.rrwallet.service.wallet.db.WalletDbHelper
import com.renrenbit.rrwallet.service.wallet.db.entry.Account
import com.renrenbit.rrwallet.utils.*
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.WritableNativeMap
import org.json.JSONException
import org.json.JSONObject
import rx.Observable
import rx.Observer
import rx.functions.Action1
import rx.functions.Func1
import java.math.BigInteger

/**
 * Created by jackQ on 2018/6/16.
 */

class EtherService {

    /**
     * 创建并且保存到数据库里面
     */
    fun createRandomAccount(name: String, passwd: String, note: String, promise: Promise?) {
        val observable = Observable.create(Observable.OnSubscribe<Wallet> { subscriber ->
            subscriber.onNext(EthWalletHelper.createWalletAccount())
        })
                .map<Pair<Wallet, Account>> { wallet ->
                    run {
                        val extra = JSONObject()
                        extra.put("note", note)
                        Pair(wallet, convert2Account(wallet, name, passwd, extra.toString()))
                    }
                }
                .doOnNext { pair -> WalletDbHelper.inst().insertAccount(pair.second) }

        ThreadScheduleUtils.simpleScheduleThread(observable)
                .subscribe(object : Observer<Pair<Wallet, Account>> {
                    override fun onCompleted() {}

                    override fun onError(e: Throwable) {
                        promise?.reject(e)
                    }

                    override fun onNext(pair: Pair<Wallet, Account>) {
                        if (promise != null) {
                            val wallet = pair.first
                            val account = pair.second
                            val jsonObject = JSONObject()
                            try {
                                jsonObject.put("id", account.id)
                                jsonObject.put("type", account.type)
                                jsonObject.put("address", account.address)
                                jsonObject.put("mnemonic", wallet.mnemonic)
                                promise.resolve(RNUtils.convertJsonToMap(jsonObject))
                            } catch (e: Throwable) {
                                e.printStackTrace()
                            }

                        }
                    }
                })
    }

    /**
     * 验证用户填的zhujici 是否能生产私钥
     */
    fun backupMnemonic(mnemonic: String, promise: Promise?) {
        ThreadScheduleUtils.simpleScheduleThread(
                Observable.create(Observable.OnSubscribe<Wallet> { subscriber ->
                    subscriber.onNext(EthWalletHelper.importWallet(mnemonic))
                })
                        .map { wallet: Wallet -> WalletDbHelper.inst().query(Md5.md5(wallet.address)) != null })
                .subscribe(object : Observer<Boolean> {
                    override fun onCompleted() {}

                    override fun onError(e: Throwable) {
                        promise?.resolve(false)
                    }

                    override fun onNext(success: Boolean) {
                        promise?.resolve(success)
                    }
                })
    }

    /**
     * 通过助记词导入,然后用密码加密上，保存到数据库里面
     */
    fun importAccount(mnemonic: String, passwd: String, name: String, promise: Promise?) {
        val observable =
                Observable.create(Observable.OnSubscribe<Wallet> { subscriber ->
                    subscriber.onNext(EthWalletHelper.importWallet(mnemonic))
                })
                        .map(Convert2AccountFunc(name, passwd, ""))
                        .doOnNext(InsertDbFunc())
        ThreadScheduleUtils.simpleScheduleThread(observable)
                .subscribe(object : Observer<Account> {
                    override fun onCompleted() {}

                    override fun onError(e: Throwable) {
                        promise?.reject(e)
                    }

                    override fun onNext(account: Account) {
                        if (promise != null) {
                            val jsonObject = JSONObject()
                            try {
                                jsonObject.put("id", account.id)
                                jsonObject.put("type", account.type)
                                jsonObject.put("address", account.address)
                                promise.resolve(RNUtils.convertJsonToMap(jsonObject))
                            } catch (e: JSONException) {
                                e.printStackTrace()
                                promise.reject(e)
                            }
                        }
                    }
                })
    }

    /**
     * 校验密码
     */
    fun isVaildPassword(id: String, passwd: String, promise: Promise?) {
        val observable = Observable.create(Observable.OnSubscribe<Boolean> { subscriber ->
            run {
                val account = queryWallet(id)
                val wallet = Wallet.from(account, passwd)
                if (StringUtils.isEmpty(wallet.privateKey)) {
                    throw IllegalArgumentException("密码错误")
                }
                subscriber.onNext(account.address == wallet.address)
            }
        })
        ThreadScheduleUtils.simpleScheduleThread(observable)
                .subscribe(object : Observer<Boolean> {
                    override fun onNext(t: Boolean) {
                        promise?.resolve(t)
                    }

                    override fun onError(e: Throwable?) {
                        promise?.resolve(false)
                    }

                    override fun onCompleted() {}
                })
    }

    /**
     * 删除钱包
     * @return true/false
     */
    fun drop(id: String, passwd: String, promise: Promise?) {
        val observable = Observable.create(Observable.OnSubscribe<Boolean> { subscriber ->
            subscriber.onNext(WalletDbHelper.inst().dropAccount(id, passwd))
        })
        ThreadScheduleUtils.simpleScheduleThread(observable)
                .subscribe(object : Observer<Boolean> {
                    override fun onCompleted() {

                    }

                    override fun onError(e: Throwable) {
                        promise?.resolve(false)
                    }

                    override fun onNext(aBoolean: Boolean?) {
                        promise!!.resolve(aBoolean)
                    }
                })
    }
    

    /**
     * 导出私钥
     * @return 私钥
     */
    fun exportPrivateKey(id: String, passwd: String, promise: Promise?) {
        if (StringUtils.isEmpty(id)) {
            promise?.reject(IllegalArgumentException("id is null"))
            return
        }
        if (StringUtils.isEmpty(passwd)) {
            promise?.reject(IllegalArgumentException("password is null"))
            return
        }
        val observable = Observable.create(Observable.OnSubscribe<String> { subscriber ->
            kotlin.run {
                val account = queryWallet(id)
                val privateKey = Wallet.from(account, passwd).privateKey
                subscriber.onNext(privateKey)
            }
        })
        ThreadScheduleUtils.simpleScheduleThread(observable)
                .subscribe(object : Observer<String> {
                    override fun onCompleted() {
                    }

                    override fun onNext(t: String?) {
                        val jsonObject = JSONObject()
                        jsonObject.put("privateKey", t)
                        promise?.resolve(RNUtils.convertJsonToMap(jsonObject))
                    }

                    override fun onError(e: Throwable?) {
                        promise?.reject(e)
                    }

                })

    }

    /**
     * 导出KeyStore
     * @return eth标准keyStore格式
     */
    fun exportKeyStore(id: String, passwd: String, promise: Promise?) {
        if (StringUtils.isEmpty(id)) {
            promise?.reject(IllegalArgumentException("id is null"))
            return
        }
        if (StringUtils.isEmpty(passwd)) {
            promise?.reject(IllegalArgumentException("password is null"))
            return
        }
        ThreadScheduleUtils.simpleScheduleThread(
                Observable.create(Observable.OnSubscribe<Wallet> { subscriber -> subscriber.onNext(Wallet.from(queryWallet(id), passwd)) })
                        .map { wallet: Wallet -> EthWalletHelper.convert2KeyStore(wallet, passwd) })
                .subscribe(object : Observer<String> {
                    override fun onError(e: Throwable?) {
                        promise?.reject(e)
                    }

                    override fun onCompleted() {
                    }

                    override fun onNext(t: String?) {
                        val keyStore = JSONObject(t)
                        val result = WritableNativeMap()
                        result.putString("keyStore", t)
                        promise?.resolve(result)
                    }
                })
    }

    /**
     * 导出助记词
     * @return 助记词, 按空格分隔
     */
    fun exportMnemonic(id: String, passwd: String, promise: Promise?) {
        if (StringUtils.isEmpty(id)) {
            promise?.reject(IllegalArgumentException("id is null"))
            return
        }
        if (StringUtils.isEmpty(passwd)) {
            promise?.reject(IllegalArgumentException("password is null"))
            return
        }
        ThreadScheduleUtils.simpleScheduleThread(
                Observable.create(Observable.OnSubscribe<String> { subscriber ->
                    subscriber.onNext(Wallet.from(queryWallet(id), passwd).mnemonic)
                }))
                .subscribe(object : Observer<String> {
                    override fun onCompleted() {}

                    override fun onError(e: Throwable?) {
                        promise?.reject(e)
                    }

                    override fun onNext(t: String?) {
                        val map = WritableNativeMap()
                        map.putString("mnemonic", t)
                        promise?.resolve(map)
                    }
                })


    }

    private fun convert2Account(wallet: Wallet, name: String, passwd: String, extra: String): Account {
        LogUtils.d(wallet)
        val account = Account()
        account.id = WalletEncryptUtils.getWalletId(wallet.address)
        account.name = name
        account.address = wallet.address
        account.type = wallet.type.accountType
        account.extra = extra
        try {
            account.mnemonic = WalletEncryptUtils.encrypt(wallet.mnemonic, account.id, passwd)
        } catch (e: Exception) {
            e.printStackTrace()
        }

        try {
            account.privateKey = WalletEncryptUtils.encrypt(wallet.privateKey, account.id, passwd)
        } catch (e: Exception) {
            e.printStackTrace()
        }
        return account
    }


    private fun queryWallet(id: String): Account {
        return WalletDbHelper.inst().query(id)
    }

    private inner class Convert2AccountFunc @JvmOverloads internal constructor(private val mName: String, private val mPassword: String, private val extra: String = "") : Func1<Wallet, Account> {

        override fun call(wallet: Wallet): Account {
            return convert2Account(wallet, mName, mPassword, extra)
        }
    }

    private inner class InsertDbFunc : Action1<Account> {
        override fun call(account: Account) {
            WalletDbHelper.inst().insertAccount(account)
        }
    }

    fun importPrivateKey(pk: String, pwd: String, name: String, promise: Promise?) {
        if (StringUtils.isEmpty(pk)) {
            promise?.reject(IllegalArgumentException("私钥为空"))
            return
        }
        if (StringUtils.isEmpty(pwd)) {
            promise?.reject(IllegalArgumentException("密码为空"))
            return
        }
        if (StringUtils.isEmpty(name)) {
            promise?.reject(IllegalArgumentException("钱包名称为空"))
            return
        }
        val observable = Observable
                .create(Observable.OnSubscribe<Wallet> { subscriber -> subscriber.onNext(EthWalletHelper.importWalletFromPrivateKey(pk)) })
                .map { wallet -> convert2Account(wallet, name, pwd, "") }
                .doOnNext { account -> WalletDbHelper.inst().insertAccount(account) }
        ThreadScheduleUtils.simpleScheduleThread(observable)
                .subscribe(object : Observer<Account> {
                    override fun onError(e: Throwable?) {
                        promise?.reject(e)
                    }

                    override fun onNext(account: Account?) {
                        val map = WritableNativeMap()
                        map.putString("id", account!!.id)
                        map.putInt("type", account.type)
                        map.putString("address", account.address)
                        promise?.resolve(map)
                    }

                    override fun onCompleted() {

                    }
                })
    }

    fun importKeystore(ks: String, pwd: String, name: String, promise: Promise?) {
        if (StringUtils.isEmpty(ks)) {
            promise?.reject(IllegalArgumentException("keyStore为空"))
            return
        }
        if (StringUtils.isEmpty(pwd)) {
            promise?.reject(IllegalArgumentException("密码为空"))
            return
        }
        if (StringUtils.isEmpty(name)) {
            promise?.reject(IllegalArgumentException("钱包名称为空"))
            return
        }
        val observable = Observable
                .create(Observable.OnSubscribe<String> { subscriber -> subscriber.onNext(EthWalletHelper.keyStoreConvert2PrivateKey(ks, pwd)) })
                .map { privateKey -> EthWalletHelper.importWalletFromPrivateKey(privateKey) }
                .map { wallet -> convert2Account(wallet, name, pwd, "") }
                .doOnNext { account -> WalletDbHelper.inst().insertAccount(account) }
        ThreadScheduleUtils.simpleScheduleThread(observable)
                .subscribe(object : Observer<Account> {
                    override fun onError(e: Throwable?) {
                        promise?.reject(e)
                    }

                    override fun onNext(account: Account?) {
                        val map = WritableNativeMap()
                        map.putString("id", account!!.id)
                        map.putInt("type", account.type)
                        map.putString("address", account.address)
                        promise?.resolve(map)
                    }

                    override fun onCompleted() {

                    }
                })
    }

    fun sendContractTransaction(id: String, contract: String, amount: String, data: String, gasLimit: String, gasPrice: String,
                                nonce: String, broadcast: Boolean, passwd: String, promise: Promise?) {
        if (TextUtils.isEmpty(id)
                || TextUtils.isEmpty(contract)
                || TextUtils.isEmpty(gasLimit)
                || TextUtils.isEmpty(gasPrice)
                || TextUtils.isEmpty(passwd)
        ) {
            promise?.reject(IllegalArgumentException("argument is null"))
            return
        }
        if (!NetworkUtils.isConnected()) {
            promise?.reject(Exception(Constants.ERROR_NETWORK))
            return
        }
        val observable = Observable.create<Transaction> { subscriber ->
            run {
                try {
                    val wallet = Wallet.from(queryWallet(id), passwd)
                    subscriber.onNext(EthWalletHelper.sendContractTransaction(wallet, contract, data, BigInteger(amount),
                            BigInteger(gasLimit),
                            BigInteger(gasPrice), BigInteger(nonce), broadcast))

                } catch (e: Exception) {
                    e.printStackTrace()
                    subscriber.onError(e)
                }
            }
        }
        ThreadScheduleUtils.simpleScheduleThread(observable)
                .subscribe(object : Observer<Transaction> {
                    override fun onNext(t: Transaction) {
                        val jsonObject = JSONObject()
                        if (broadcast) {
                            jsonObject.put("txHash", t.transactionHash)
                        } else {
                            jsonObject.put("rawData", t.rawData)
                        }
                        jsonObject.put("nonce", t.nonce)

                        promise?.resolve(RNUtils.convertJsonToMap(jsonObject))
                    }

                    override fun onError(e: Throwable?) {
                        promise?.reject(e)
                    }

                    override fun onCompleted() {}

                })
    }
}
