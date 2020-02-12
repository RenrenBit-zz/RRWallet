package com.renrenbit.rrwallet.utils;

import java.io.IOException;
import java.io.OutputStream;

/**
 * Created by jackQ on 2018/6/14.
 */

public class StringOutputStream extends OutputStream {
    private StringBuilder string = new StringBuilder();

    @Override
    public void write(int b) throws IOException {
        this.string.append((char) b);
    }

    public String toString() {
        return this.string.toString();
    }
}
