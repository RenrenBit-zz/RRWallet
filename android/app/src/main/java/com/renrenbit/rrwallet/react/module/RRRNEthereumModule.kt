package com.renrenbit.rrwallet.react.module

import com.renrenbit.rrwallet.service.wallet.ether.EtherService
import com.renrenbit.rrwallet.utils.Constants.REACT_MODULE_NAME_DFRN_ETHER
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.module.annotations.ReactModule

/**
 * Created by jackQ on 2018/6/12.
 */
@ReactModule(name = REACT_MODULE_NAME_DFRN_ETHER)
class RRRNEthereumModule(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {
    private val mEtherService: EtherService = EtherService()

    override fun getName(): String {
        return REACT_MODULE_NAME_DFRN_ETHER
    }

    @ReactMethod
    fun createRandomAccount(name: String, passwd: String, note: String, promise: Promise?) {
        mEtherService.createRandomAccount(name, passwd, note, promise);
    }


    @ReactMethod
    fun backupMnemonic(mnemonic: String, promise: Promise?) {
        mEtherService.backupMnemonic(mnemonic, promise)
    }


    @ReactMethod
    fun importAccount(mnemonic: String, passwd: String, name: String, promise: Promise?) {
        mEtherService.importAccount(mnemonic, passwd, name, promise)
    }

    @ReactMethod
    fun importPrivatekey(Pk: String, pwd: String, name: String, promise: Promise?) {
        mEtherService.importPrivateKey(Pk, pwd, name, promise)

    }

    @ReactMethod
    fun importKeystore(ks: String, pwd: String, name: String, promise: Promise?) {
        mEtherService.importKeystore(ks, pwd, name, promise)

    }

    @ReactMethod
    fun isVaildPassword(id: String, passwd: String, promise: Promise?) {
        mEtherService.isVaildPassword(id, passwd, promise)
    }

    @ReactMethod
    fun drop(id: String, passwd: String, promise: Promise?) {
        mEtherService.drop(id, passwd, promise)
    }

    @ReactMethod
    fun exportPrivateKey(id: String, passwd: String, promise: Promise?) {
        mEtherService.exportPrivateKey(id, passwd, promise)

    }

    @ReactMethod
    fun exportKeyStore(id: String, passwd: String, promise: Promise?) {
        mEtherService.exportKeyStore(id, passwd, promise)
    }


    @ReactMethod
    fun exportMnemonic(id: String, passwd: String, promise: Promise?) {
        mEtherService.exportMnemonic(id, passwd, promise)
    }


    @ReactMethod
    fun sendContractTransaction(id: String, from: String, contract: String, amount: String,
                                data: String,
                                gasLimit: String, gasPrice: String, nonce: String, chainID: Int, broadcast: Boolean, passwd: String, promise: Promise?) {
        mEtherService.sendContractTransaction(id, contract, amount, data, gasLimit, gasPrice, nonce, broadcast, passwd, promise)
    }

}
