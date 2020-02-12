package com.renrenbit.rrwallet.utils;

import android.text.TextUtils;
import android.util.Base64;
import android.util.Pair;

import com.blankj.utilcode.util.EncryptUtils;
import com.blankj.utilcode.util.StringUtils;

import java.io.UnsupportedEncodingException;
import java.security.NoSuchAlgorithmException;
import java.util.Arrays;

/**
 * Created by jackQ on 2018/6/12.
 */

public class WalletEncryptUtils {
    private static final String CipherMode = "AES/CFB/NoPadding";
    private static String PUBLIC_KEY = "MIIBtjCCASsGByqGSM44BAEwggEeAoGBANUM+pyh6bWPgS963DYk+Ba606hqnO8MoC/U7wFmfYLh";

    public static String encrypt(String data, String walletId, String passwd) throws Exception {
        if (TextUtils.isEmpty(data)) {
            return data;
        }
        byte[] bytesDataAES = data.getBytes("UTF-8");
        Pair<byte[], byte[]> firstTimeEncryptKey = genKey(passwd);
        Pair<byte[], byte[]> secondTimeKey = genKey(Md5.md5(walletId + PUBLIC_KEY));
        byte[] firstEncryptData = EncryptUtils.encryptAES(bytesDataAES, firstTimeEncryptKey.first,
                CipherMode, firstTimeEncryptKey.second);
        byte[] encrypted = EncryptUtils.encryptAES(firstEncryptData, secondTimeKey.first, CipherMode, secondTimeKey.second);
        return Base64.encodeToString(encrypted, Base64.NO_WRAP);
    }

    public static String decrypt(String origin, String walletId, String passwd) throws Exception {
        if (TextUtils.isEmpty(origin)) {
            return origin;
        }
        byte[] originData = Base64.decode(origin, Base64.NO_WRAP);
        Pair<byte[], byte[]> first = genKey(Md5.md5(walletId + PUBLIC_KEY));
        Pair<byte[], byte[]> second = genKey(passwd);
        byte[] firstEncryptData = EncryptUtils.decryptAES(originData, first.first, CipherMode, first.second);
        return new String(EncryptUtils.decryptAES(firstEncryptData, second.first, CipherMode, second.second), "UTF-8");
    }


    private static Pair<byte[], byte[]> genKey(String password) throws NoSuchAlgorithmException, UnsupportedEncodingException {
        byte[] encrypt = EncryptUtils.encryptSHA384(password.getBytes("UTF-8"));
        byte[] key = Arrays.copyOfRange(encrypt, 0, 32);
        byte[] iv = Arrays.copyOfRange(encrypt, 32, 48);
        return new Pair<>(key, iv);
//        KeyGenerator kgen = KeyGenerator.getInstance("AES");// 创建AES的Key生产者
//        kgen.init(128, new SecureRandom(password.getBytes("UTF-8")));// 利用用户密码作为随机数初始化出
//        SecretKey secretKey = kgen.generateKey();// 根据用户密码，生成一个密钥
//        return secretKey.getEncoded();// 返回基本编码格式的密钥，如果此密钥不支持编码，则返回 null
    }

    public static String getWalletId(String address) {
        return Md5.md5(address);
    }


    public static boolean isValidMnemonic(String mnemonic) {
        if (StringUtils.isEmpty(mnemonic)) {
            return false;
        }

        String[] words = mnemonic.split(" ");
        if (words.length != 12) {
            return false;
        }
        return  true;
    }
}
