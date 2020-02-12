package com.renrenbit.rrwallet.service.wallet.db.entry;

import com.renrenbit.rrwallet.utils.Constants;

import io.realm.RealmObject;
import io.realm.annotations.PrimaryKey;
import io.realm.annotations.RealmClass;
import io.realm.annotations.RealmField;
import io.realm.annotations.Required;

/**
 * Created by jackQ on 2018/6/12.
 */
@RealmClass(name = Constants.WALLET_DB_TABLE)
public class Account extends RealmObject {

    public static final int ETHER = 1;
    public static final int BTC = 2;
    public static final int BTC_TEST = -1;
    @PrimaryKey
    @RealmField(name = "id")
    protected String id;

    @Required
    @RealmField(name = "mnemonic")
    protected String mnemonic;

    @Required
    @RealmField(name = "name")
    protected String name;

    @RealmField(name = "type")
    protected int type;
    @RealmField(name = "private_key")
    protected String privateKey;
    @RealmField(name = "extra")
    protected String extra = "";
    @RealmField(name = "address")
    private String address;

    public String getPrivateKey() {
        return privateKey;
    }

    public void setPrivateKey(String privateKey) {
        this.privateKey = privateKey;
    }

    public String getMnemonic() {
        return mnemonic;
    }

    public void setMnemonic(String mnemonic) {
        this.mnemonic = mnemonic;
    }

    public String getAddress() {
        return address;
    }

    public void setAddress(String address) {
        this.address = address;
    }

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public int getType() {
        return type;
    }

    public void setType(int type) {
        this.type = type;
    }

    public String getExtra() {
        return extra;
    }

    public void setExtra(String extra) {
        if (extra == null) {
            extra = "";
        }
        this.extra = extra;
    }
}
