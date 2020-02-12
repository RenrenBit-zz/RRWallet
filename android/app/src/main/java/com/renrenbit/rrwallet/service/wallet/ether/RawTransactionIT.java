package com.renrenbit.rrwallet.service.wallet.ether;

import com.blankj.utilcode.util.StringUtils;
import com.renrenbit.rrwallet.service.wallet.Transaction;

import org.jetbrains.annotations.NotNull;
import org.jetbrains.annotations.Nullable;
import org.web3j.crypto.Credentials;
import org.web3j.crypto.RawTransaction;
import org.web3j.crypto.TransactionEncoder;
import org.web3j.protocol.Web3j;
import org.web3j.protocol.core.methods.response.EthSendTransaction;
import org.web3j.utils.Numeric;

import java.io.IOException;
import java.math.BigInteger;
import java.util.concurrent.ExecutionException;

/**
 * Created by jackQ on 2018/6/7.
 */
class RawTransactionIT {


    private static RawTransaction createTransaction(BigInteger number,
                                                    BigInteger nonce,
                                                    String toAddress,
                                                    BigInteger gasLimit,
                                                    BigInteger gasPrice,
                                                    String data) throws IOException {

        return RawTransaction.createTransaction(
                nonce, gasPrice, gasLimit, toAddress, number, data);
    }


    @Nullable
    public static Transaction sendContractTransaction(@NotNull Web3j web3j, @NotNull Credentials from,
                                                      @NotNull String contract, @NotNull String data, @NotNull BigInteger amount,
                                                      @NotNull BigInteger gasLimit, @NotNull BigInteger gasPrice, BigInteger nonce, boolean broadcast) throws IOException, ExecutionException, InterruptedException {
        RawTransaction rawTransaction = createTransaction(amount,
                nonce, contract, gasLimit, gasPrice, data);

        byte[] signedMessage = TransactionEncoder.signMessage(rawTransaction, from);
        String hexValue = Numeric.toHexString(signedMessage);

        Transaction transaction = new Transaction();
        transaction.nonce = nonce;
        transaction.contract = contract;
        transaction.from = from.getAddress();
        transaction.gasLimit = gasLimit;
        transaction.gasPrice = gasPrice;
        transaction.rawData = hexValue;

        if (!broadcast) {
            return transaction;
        }

        EthSendTransaction ethSendTransaction =
                web3j.ethSendRawTransaction(hexValue).sendAsync().get();
        if (StringUtils.isEmpty(ethSendTransaction.getTransactionHash())) {
            throw new IllegalArgumentException(ethSendTransaction.getError().getMessage());
        }

        transaction.transactionHash = ethSendTransaction.getTransactionHash();

        return transaction;

    }
}
