RRWallet是一款On-Chain数字货币钱包, 支持多个币种, 可同时运行在iOS, Android上.



## 主要特点⚡️

* 支持BTC, USDT, ETH, BCH, BSV, ETC等多个币种
* 支持BTC和USDT多签
* 智能合约批量发送交易
* 助记词加密存储在本地
* 使用React Native开发, 一套代码同时支持iOS, Android
* 门限签名(即将支持)



## 本地运行🚀

确保已经安装了Node.js, iOS 和 Android开发环境

1.安装依赖

   ```shell
npm ci		#前端依赖
cd ios		#以下为iOS依赖, 如不需要可以跳过
pod install
   ```

2.启动服务

```shell
npm start
```

3.打开Xcode或者Android Studio 运行即可



## 编译Release😈
### iOS

```shell
#确保Xcode中的证书有效
npm run build-ios
```

### Android

```shell
#需要替换掉build.gradle中的Keystore以及对应的密码
npm run build-android
```



## License

MIT License

Copyright (c) 2020 RenrenBit

