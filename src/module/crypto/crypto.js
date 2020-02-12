import JSEncrypt from "jsencrypt";
import _ from "lodash";
const CryptoJS = require("crypto-js");

export default {
  getRandomString(len) {
    len = len || 64; // 默认为32
    // Math.pow(chars.length, len) 即为chars.length的len次幂。
    // 若len传10，即产生得复概率为 62的10次幂分之1
    let chars = "ABCDEFGHJKMNPQRSTWXYZabcdefhijkmnprstwxyz0123456789";
    let maxPos = chars.length;
    let pwd = "";
    for (let i = 0; i < len; i++) {
      pwd += chars.charAt(Math.floor(Math.random() * maxPos));
    }
    return pwd;
  },
  rsaPubkeyEncrypt(data, publicKey) {
    const encrypt = new JSEncrypt();
    encrypt.setPublicKey(publicKey);
    return encrypt.encrypt(data);
  },
  publicEncrypt(data, publicKey) {
    if (typeof data == "object") {
      data = JSON.stringify(data);
    }
    let secretKey = this.getRandomString(32);
    let ciphertext = CryptoJS.AES.encrypt(data, CryptoJS.enc.Utf8.parse(secretKey), {
      mode: CryptoJS.mode.ECB,
      padding: CryptoJS.pad.Pkcs7,
    }).toString();

    let encrypt = new JSEncrypt();
    encrypt.setPublicKey(publicKey);
    let code = encrypt.encrypt(secretKey);

    let result = {
      code: code,
      encrypto: ciphertext,
    };

    return result;
  },
  aesEncrypt(data, secretKey) {
    return CryptoJS.AES.encrypt(data, CryptoJS.enc.Utf8.parse(secretKey), {
      mode: CryptoJS.mode.ECB,
      padding: CryptoJS.pad.Pkcs7,
    }).toString();
  },
  aesDecrypt(data, secretKey) {
    return CryptoJS.AES.decrypt(data, CryptoJS.enc.Utf8.parse(secretKey), {
      mode: CryptoJS.mode.ECB,
      padding: CryptoJS.pad.Pkcs7,
    }).toString(CryptoJS.enc.Utf8);
  },
  hash160(data, { asByte = false } = {}) {
    if (asByte && _.isString(data)) {
      data = CryptoJS.enc.Hex.parse(data);
    }
    return CryptoJS.RIPEMD160(this.sha256(data));
  },
  sha256(data, { asByte = false } = {}) {
    if (asByte && _.isString(data)) {
      data = CryptoJS.enc.Hex.parse(data);
    }
    return CryptoJS.SHA256(data);
  },
  sha3(data, length = 256) {
    return CryptoJS.SHA3(data, { outputLength: length });
  },
  sign(input, privateKey) {
    var sign = new JSEncrypt();
    sign.setPrivateKey(privateKey);
    var signature = sign.sign(CryptoJS.enc.Utf8.parse(CryptoJS.SHA256(input)), CryptoJS.SHA256, "sha256");
    return signature;
  },
  toWordsArray(hex) {
    return CryptoJS.enc.Hex.parse(hex);
  },
};
