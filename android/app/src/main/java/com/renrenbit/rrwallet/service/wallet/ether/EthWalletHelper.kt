package com.renrenbit.rrwallet.service.wallet.ether

import com.blankj.utilcode.util.StringUtils
import com.renrenbit.rrwallet.service.wallet.CoinType
import com.renrenbit.rrwallet.service.wallet.Transaction
import com.renrenbit.rrwallet.service.wallet.Wallet
import com.renrenbit.rrwallet.service.wallet.WalletCreatorFactory
import com.renrenbit.rrwallet.utils.Constants
import com.renrenbit.rrwallet.utils.StringOutputStream
import org.web3j.crypto.*
import org.web3j.protocol.ObjectMapperFactory
import org.web3j.protocol.Web3j
import org.web3j.protocol.Web3jFactory
import org.web3j.protocol.core.methods.response.Web3ClientVersion
import org.web3j.protocol.http.HttpService
import org.web3j.utils.Numeric
import java.math.BigInteger
import java.util.concurrent.Future

/**
 * Created by jackQ on 2018/6/2.
 */

class EthWalletHelper private constructor() {


    companion object {

        private var ADDRESS_HTTP_SERVER = Constants.ETH_RPC_URL

        private var mWeb3: Web3j

        private var future: Future<Web3ClientVersion>

        init {
            mWeb3 = Web3jFactory.build(HttpService(ADDRESS_HTTP_SERVER))
            future = mWeb3.web3ClientVersion().sendAsync()
        }

        fun createWalletAccount(): Wallet {
            return WalletCreatorFactory.getCreator(CoinType.eth).createNewWallet()
        }

        fun setEthAddress(address: String) {
            if (StringUtils.isEmpty(address)) {
                return
            }
            ADDRESS_HTTP_SERVER = address
            mWeb3 = Web3jFactory.build(HttpService(address))
            future = mWeb3.web3ClientVersion().sendAsync()
        }

        fun importWallet(mnemonic: String): Wallet {
            return WalletCreatorFactory.getCreator(CoinType.eth).createWalletFromWords(mnemonic)
        }


        fun convert2KeyStore(wallet: Wallet, passwd: String): String {
            val walletFile = org.web3j.crypto.Wallet.createLight(passwd, ECKeyPair.create(Numeric.toBigInt(wallet.privateKey)))
            val stream = StringOutputStream()
            ObjectMapperFactory.getObjectMapper().writeValue(stream, walletFile)
            return stream.toString()
        }

        fun keyStoreConvert2PrivateKey(keyStore: String, passwd: String): String? {
            val walletFile = ObjectMapperFactory.getObjectMapper().readValue(keyStore, WalletFile::class.java)
            val credentials = Credentials.create(org.web3j.crypto.Wallet.decrypt(passwd, walletFile))
            return Numeric.toHexStringWithPrefix(credentials.ecKeyPair.privateKey)
        }

        fun importWalletFromPrivateKey(privateKey: String): Wallet {
            return WalletCreatorFactory.getCreator(CoinType.eth).createWallet(privateKey)
        }

        fun sendContractTransaction(wallet: Wallet, contract: String,
                                    data: String, amount: BigInteger,
                                    gasLimit: BigInteger, gasPrice: BigInteger,
                                    nonce: BigInteger, broadcast: Boolean): Transaction? {
            return RawTransactionIT.sendContractTransaction(
                    mWeb3,
                    Credentials.create(wallet.privateKey),
                    contract,data,amount,
                    gasLimit, gasPrice, nonce, broadcast)
        }
    }
}
