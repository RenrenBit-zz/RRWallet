package com.renrenbit.rrwallet.service.wallet;

import java.math.BigInteger;

/**
 * Created by jackQ on 2018/6/14.
 */

public class Transaction {
    public String transactionHash;
    public BigInteger nonce;
    public String contract;
    public String from;
    public String to;
    public BigInteger amount;
    public BigInteger gasLimit;
    public BigInteger gasPrice;
    public String rawData;
}
