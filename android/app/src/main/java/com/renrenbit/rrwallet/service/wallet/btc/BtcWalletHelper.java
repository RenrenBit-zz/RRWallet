package com.renrenbit.rrwallet.service.wallet.btc;

import android.support.annotation.WorkerThread;

import com.renrenbit.rrwallet.service.wallet.CoinType;
import com.renrenbit.rrwallet.service.wallet.Wallet;
import com.renrenbit.rrwallet.service.wallet.WalletCreatorFactory;
import com.renrenbit.rrwallet.service.wallet.WalletException;
import com.renrenbit.rrwallet.service.wallet.btc.net.BtcEnv;
import com.renrenbit.rrwallet.service.wallet.btc.net.FormalEnv;
import com.renrenbit.rrwallet.service.wallet.btc.net.TestEnv;
import com.facebook.react.bridge.ReadableArray;
import com.facebook.react.bridge.ReadableMap;

import org.bitcoinj.core.Address;
import org.bitcoinj.core.Coin;
import org.bitcoinj.core.ECKey;
import org.bitcoinj.core.NetworkParameters;
import org.bitcoinj.core.Sha256Hash;
import org.bitcoinj.core.Transaction;
import org.bitcoinj.core.TransactionInput;
import org.bitcoinj.core.TransactionOutPoint;
import org.bitcoinj.core.TransactionOutput;
import org.bitcoinj.crypto.DeterministicKey;
import org.bitcoinj.crypto.HDUtils;
import org.bitcoinj.crypto.TransactionSignature;
import org.bitcoinj.params.MainNetParams;
import org.bitcoinj.params.TestNet3Params;
import org.bitcoinj.script.ScriptBuilder;
import org.bitcoinj.wallet.DeterministicKeyChain;
import org.bitcoinj.wallet.DeterministicSeed;
import org.jetbrains.annotations.NotNull;
import org.jetbrains.annotations.Nullable;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.HashMap;
import java.util.List;

import static org.bitcoinj.core.Utils.HEX;

/**
 * Created by jackQ on 2018/6/16.
 */

public class BtcWalletHelper {

    private static BtcEnv env = new FormalEnv();

    @WorkerThread
    public static Wallet createAccount() {
        return WalletCreatorFactory.getCreator(getBtcCoinType()).createNewWallet();
    }

    @WorkerThread
    public static Wallet importWallet(String mnemonic) {
        return WalletCreatorFactory.getCreator(getBtcCoinType()).createWalletFromWords(mnemonic);
    }


    public static Wallet importWalletFromPrivateKey(String privateKey) throws WalletException {
        return Wallet.Builder.create(getBtcCoinType()).privateKey(privateKey).build();
    }

    public static CoinType getBtcCoinType() {
        return env.getCoinType();
    }

    @Nullable
    public static NetworkParameters getNetParams() {
        return env.getNetParams();
    }

    @NotNull
    public static String getPath() {
        return env.getPath();
    }

    public static void setEnv(boolean useTest) {
        if (useTest) {
            env = new TestEnv();
        } else {
            env = new FormalEnv();
        }
    }

    public static HashMap rawTransaction(Wallet wallet, ReadableArray utxos, ReadableArray outputs, Integer net) {
        NetworkParameters netParam = netParam(net);

        Transaction tx = new Transaction(netParam);

        String[] mnemonic = wallet.getMnemonic().split(" ");
        List wordsList = Arrays.asList(mnemonic);
        DeterministicSeed seed = new DeterministicSeed(wordsList, null, "", 0);
        DeterministicKeyChain keyChain = DeterministicKeyChain.builder().seed(seed).build();

        for (int i = 0; i < outputs.size(); i++) {
            ReadableMap output = outputs.getMap(i);
            Address address = Address.fromBase58(netParam, output.getString("address"));
            TransactionOutput txOutput = new TransactionOutput(netParam, tx, Coin.valueOf(Long.valueOf(output.getString("satoshis"))), address);
            tx.addOutput(txOutput);
        }

        for (int i = 0; i < utxos.size(); i++) {
            ReadableMap utxo = utxos.getMap(i);
            String txid = utxo.getString("txid");
            String path = utxo.getString("path");
            String rawSigHash = utxo.getString("rawSigHash");
            int sigHashFlags = utxo.getInt("sigHashType");
            int vout = Integer.valueOf(utxo.getString("vout"));
//            String scriptPubKey = utxo.getString("scriptPubKey");

            DeterministicKey key = keyChain.getKeyByPath(HDUtils.parsePath(parseBIP44Path(path)), true);

            ECKey ec = ECKey.fromPrivate(key.getPrivKey());
            TransactionOutPoint outPoint = new TransactionOutPoint(netParam, vout, Sha256Hash.wrap(txid));
//            Script script = new Script(HEX.decode(scriptPubKey));
            Sha256Hash hash = Sha256Hash.wrap(rawSigHash);
            ECKey.ECDSASignature ecSig = ec.sign(hash);
            TransactionSignature txSig = new TransactionSignature(ecSig.r, ecSig.s, sigHashFlags);

            TransactionInput input = new TransactionInput(netParam, tx, new byte[]{}, outPoint);
            input.setScriptSig(ScriptBuilder.createInputScript(txSig, ec));
            tx.addInput(input);
//            tx.addSignedInput(outPoint, script, ec, Transaction.SigHash.ALL, true);
        }


        HashMap result = new HashMap();
        result.put("txid", tx.getHashAsString());
        result.put("rawData", HEX.encode(tx.bitcoinSerialize()));

        return  result;
    }
    public static String signHash(Wallet wallet, String path, String hash, int sigHashType) {
        String[] mnemonic = wallet.getMnemonic().split(" ");
        List wordsList = Arrays.asList(mnemonic);
        DeterministicSeed seed = new DeterministicSeed(wordsList, null, "", 0);
        DeterministicKeyChain keyChain = DeterministicKeyChain.builder().seed(seed).build();
        DeterministicKey key = keyChain.getKeyByPath(HDUtils.parsePath(parseBIP44Path(path)), true);
        ECKey ec = ECKey.fromPrivate(key.getPrivKey());
        ECKey.ECDSASignature ecSig = ec.sign(Sha256Hash.wrap(hash));
        TransactionSignature txSig = new TransactionSignature(ecSig.r, ecSig.s, sigHashType);
        return HexUtils.toHex(txSig.encodeToBitcoin());
    }
    public static List<String> generateAddresses(ReadableArray paths, String extendedKey,
                                             Integer type, Integer net) {
        NetworkParameters netParam = netParam(net);
        DeterministicKey watchingKey = DeterministicKey.deserializeB58(extendedKey, netParam(net));
        DeterministicKeyChain keychain = DeterministicKeyChain.builder().watchingKey(watchingKey).build();
        List<String> addresses = new ArrayList<String>();

        for (int i = 0; i < paths.size(); i++) {
            String path = paths.getString(i);
            DeterministicKey key = keychain.getKeyByPath(HDUtils.parsePath(watchingKey.getPathAsString() + parseBIP44Path(path)), true);
            String address = key.toAddress(netParam).toBase58();
            addresses.add(address);
        }
        return addresses;
    }

    public static List<String> generatePublicKeys(String extendedKey, ReadableArray paths) {
        DeterministicKey watchingKey = DeterministicKey.deserializeB58(extendedKey, extendedKey.startsWith("t")? TestNet3Params.get(): MainNetParams.get());
        DeterministicKeyChain keychain = DeterministicKeyChain.builder().watchingKey(watchingKey).build();
        List<String> pubKeys = new ArrayList<String>();

        for (int i = 0; i < paths.size(); i++) {
            String path = paths.getString(i);
            DeterministicKey key = keychain.getKeyByPath(HDUtils.parsePath(watchingKey.getPathAsString() + parseBIP44Path(path)), true);
            String pubKey = key.getPublicKeyAsHex();
            pubKeys.add(pubKey);
        }
        return pubKeys;
    }

    public static String exportExtendedPublicKey(Wallet wallet, String path, Integer net) {
        String[] mnemonic = wallet.getMnemonic().split(" ");
        List wordsList = Arrays.asList(mnemonic);
        DeterministicSeed seed = new DeterministicSeed(wordsList, null, "", 0);
        DeterministicKeyChain keyChain = DeterministicKeyChain.builder().seed(seed).build();
        DeterministicKey key = keyChain.getKeyByPath(HDUtils.parsePath(parseBIP44Path(path)), true);
        return key.serializePubB58(netParam(net));
    }
    public static String parseBIP44Path(String path) {
        if (!path.startsWith("/")) {
            path = "/" + path;
        }
        return path.toUpperCase().replace("'", "H");
    }
    public static NetworkParameters netParam(Integer net) {
        if (net == 2) {
            return TestNet3Params.get();
        } else  {
            return MainNetParams.get();
        }
    }

}
