package com.renrenbit.rrwallet.service.wallet.ether

import com.blankj.utilcode.util.LogUtils
import com.renrenbit.rrwallet.service.wallet.*
import org.bitcoinj.crypto.HDUtils.parsePath
import org.bitcoinj.wallet.DeterministicKeyChain
import org.bitcoinj.wallet.DeterministicSeed
import org.web3j.crypto.ECKeyPair
import org.web3j.crypto.Keys
import org.web3j.utils.Numeric
import java.util.*

/**
 * Created by jackQ on 2018/6/4.
 */
class EthWalletCreator : IWalletCreator {
    override fun createWallet(privateKey: String?): Wallet {
        return Wallet.Builder.create(CoinType.eth).privateKey(privateKey).build()
    }

    override fun getPublicKey(privateKey: String): String {
        return Numeric.toHexStringNoPrefix(ECKeyPair.create(Numeric.toBigInt(privateKey)).publicKey)
    }

    override fun getAddress(privateKey: String?): String {
        val ecKeyPair = ECKeyPair.create(Numeric.toBigInt(privateKey))
        return Numeric.prependHexPrefix(Keys.getAddress(ecKeyPair))
    }

    private val secureRandom = SecureRandomUtils.secureRandom()
    override fun createNewWallet(): Wallet {
        val wallet = createWalletFromWords(makeMnemonic())
        LogUtils.d("create wallet success : " + wallet)
        return wallet
    }

    private fun makeMnemonic(): String {
        val initialEntropy = ByteArray(16)
        secureRandom.nextBytes(initialEntropy)
        return AndroidMnemonicUtils.generateMnemonic(initialEntropy)
    }

    override fun createWalletFromWords(words: String): Wallet {
        return Wallet.Builder.create(CoinType.eth).mnemonic(words).build()
    }

    override fun getPrivateKey(words: String): String {
        val wordsList = Arrays.asList(*words.split("\\s+".toRegex()).dropLastWhile { it.isEmpty() }.toTypedArray())
        val deterministicSeed = DeterministicSeed(wordsList, null,
                "", 0)
        val deterministicKeyChain = DeterministicKeyChain.builder().seed(deterministicSeed).build()
        val privateKey = deterministicKeyChain.getKeyByPath(parsePath(convert2bitCoinjPath(CoinType.eth.path)), true).privKey
        return Numeric.toHexStringWithPrefix(privateKey)
    }

    private fun convert2bitCoinjPath(path: String): String {
        return path.toUpperCase().replace("'", "H")
    }
}
