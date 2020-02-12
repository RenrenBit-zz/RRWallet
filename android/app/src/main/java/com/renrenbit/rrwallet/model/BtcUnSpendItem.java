package com.renrenbit.rrwallet.model;

import com.google.gson.annotations.SerializedName;

public class BtcUnSpendItem {

    /**
     * address : mvF8zL9dGdnm6A62nTQZGJ8ChTmo6Zo9Pg
     * txid : 9f2d54f8ed92ec41d4b2689387f5a7acf556c15358080c698f1ce64b639eef86
     * vout : 0
     * scriptPubKey : 76a914a18c289be423c18cc33b32bd2b2e000475debbbf88ac
     * amount : 1.89201418
     * satoshis : 189201418
     * height : 1414481
     * confirmations : 1
     */
    @SerializedName("address")
    private String address;
    @SerializedName("txid")
    private String txid;
    @SerializedName("vout")
    private int vout;
    @SerializedName("scriptPubKey")
    private String scriptPubKey;
    @SerializedName("amount")
    private double amount;
    @SerializedName("satoshis")
    private int satoshis;
    @SerializedName("height")
    private int height;
    @SerializedName("confirmations")
    private int confirmations;

    public String getAddress() {
        return address;
    }

    public void setAddress(String address) {
        this.address = address;
    }

    public String getTxid() {
        return txid;
    }

    public void setTxid(String txid) {
        this.txid = txid;
    }

    public int getVout() {
        return vout;
    }

    public void setVout(int vout) {
        this.vout = vout;
    }

    public String getScriptPubKey() {
        return scriptPubKey;
    }

    public void setScriptPubKey(String scriptPubKey) {
        this.scriptPubKey = scriptPubKey;
    }

    public double getAmount() {
        return amount;
    }

    public void setAmount(double amount) {
        this.amount = amount;
    }

    public int getSatoshis() {
        return satoshis;
    }

    public void setSatoshis(int satoshis) {
        this.satoshis = satoshis;
    }

    public int getHeight() {
        return height;
    }

    public void setHeight(int height) {
        this.height = height;
    }

    public int getConfirmations() {
        return confirmations;
    }

    public void setConfirmations(int confirmations) {
        this.confirmations = confirmations;
    }
}
