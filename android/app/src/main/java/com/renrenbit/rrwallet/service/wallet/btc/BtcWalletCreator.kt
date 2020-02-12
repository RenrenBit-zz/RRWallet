package com.renrenbit.rrwallet.service.wallet.btc

import com.renrenbit.rrwallet.service.wallet.*
import com.renrenbit.rrwallet.service.wallet.btc.BtcWalletHelper.getBtcCoinType
import com.renrenbit.rrwallet.utils.Constants
import com.renrenbit.rrwallet.utils.WalletEncryptUtils
import org.bitcoinj.core.DumpedPrivateKey
import org.bitcoinj.core.ECKey
import org.bitcoinj.core.NetworkParameters
import org.bitcoinj.crypto.HDUtils
import org.bitcoinj.wallet.DeterministicKeyChain
import org.bitcoinj.wallet.DeterministicSeed
import org.web3j.utils.Numeric
import java.math.BigInteger
import java.util.*

/**
 * Created by jackQ on 2018/6/16.
 */

class BtcWalletCreator : IWalletCreator {
    override fun createWallet(privateKey: String?): Wallet {
        return Wallet.Builder.create(getBtcCoinType()).privateKey(privateKey).build()
    }

    override fun getPublicKey(privateKey: String?): String {
        val key = DumpedPrivateKey.fromBase58(getNetParams(), privateKey).key
        return Numeric.toHexStringNoPrefixZeroPadded(BigInteger(key.pubKey), 66)
    }

    override fun getAddress(privateKey: String?): String {
        val key = DumpedPrivateKey.fromBase58(getNetParams(), privateKey).key
        return key.toAddress(getNetParams()).toString()
    }

    private val secureRandom = SecureRandomUtils.secureRandom()

    override fun createNewWallet(): Wallet {
        return createWalletFromWords(makeMnemonic())
    }

    override fun createWalletFromWords(mnemonic: String): Wallet {
        return Wallet.Builder.create(getBtcCoinType()).mnemonic(mnemonic).build()
    }

    override fun getPrivateKey(mnemonic: String): String {
        if(!WalletEncryptUtils.isValidMnemonic(mnemonic)){
            throw WalletException(Constants.WRONG_MNEMONIC)
        }

        val wordsList = Arrays.asList(*mnemonic.split("\\s+".toRegex()).dropLastWhile { it.isEmpty() }.toTypedArray())
        val deterministicSeed = DeterministicSeed(wordsList, null,
                "", 0)
        val deterministicKeyChain = DeterministicKeyChain.builder().seed(deterministicSeed).build()
        val privateKeyBtc = deterministicKeyChain.getKeyByPath(HDUtils.parsePath(convert2bitCoinjPath(BtcWalletHelper.getPath())), true).privKey
        val ecKey = ECKey.fromPrivate(privateKeyBtc)
        val params = getNetParams()
        Numeric.toHexStringNoPrefixZeroPadded(privateKeyBtc, 66)

        return ecKey.getPrivateKeyEncoded(params).toString()
    }

    private fun getNetParams(): NetworkParameters? {
        return BtcWalletHelper.getNetParams()
    }

    private fun makeMnemonic(): String {
        val initialEntropy = ByteArray(16)
        secureRandom.nextBytes(initialEntropy)
        return AndroidMnemonicUtils.generateMnemonic(initialEntropy)
    }

    private fun convert2bitCoinjPath(path: String): String {
        return path.toUpperCase().replace("'", "H")
    }
}
