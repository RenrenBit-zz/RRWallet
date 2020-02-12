package com.renrenbit.rrwallet.service.wallet;

import org.web3j.crypto.LinuxSecureRandom;

import java.security.SecureRandom;

/**
 * Created by jackQ on 2018/6/4.
 */

public class SecureRandomUtils {
    private static final SecureRandom SECURE_RANDOM;
    // Taken from BitcoinJ implementation
    // https://github.com/bitcoinj/bitcoinj/blob/3cb1f6c6c589f84fe6e1fb56bf26d94cccc85429/core/src/main/java/org/bitcoinj/core/Utils.java#L573
    private static int isAndroid = -1;

    static {
        if (isAndroidRuntime()) {
            new LinuxSecureRandom();
        }
        SECURE_RANDOM = new SecureRandom();
    }

    private SecureRandomUtils() {
    }

    public static SecureRandom secureRandom() {
        return SECURE_RANDOM;
    }

    static boolean isAndroidRuntime() {
        if (isAndroid == -1) {
            final String runtime = System.getProperty("java.runtime.name");
            isAndroid = (runtime != null && runtime.equals("Android Runtime")) ? 1 : 0;
        }
        return isAndroid == 1;
    }
}
