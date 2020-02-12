//
//  DFRNWallet.m
//  rrwallet
//
//  Created by muhuai on 2018/2/25.
//  Copyright © 2018年 Facebook. All rights reserved.
//

#import "RRRNEthereum.h"
#import "DFWallet.h"
#import "DFEthereumRPCProvider.h"
#import "DFContractTransaction.h"

@implementation RRRNEthereum

RCT_EXPORT_MODULE();

static DFETHWallet *tmpAccount;

- (dispatch_queue_t)methodQueue {
  return dispatch_get_main_queue();
}

RCT_REMAP_METHOD(createRandomAccount,
                  createRandomAccount:(NSString *)name pwd:(NSString *)pwd note:(NSString *)note resolver:(RCTPromiseResolveBlock)resolve
                 rejecter:(RCTPromiseRejectBlock)reject) {
  tmpAccount = [[DFETHWallet alloc] initRandom];
  NSDictionary *data = [tmpAccount toDictionary];
  NSError *error;
  [tmpAccount updatePassword:pwd orig:nil error:&error];
  if (error) {
    reject(@(error.code).stringValue, error.localizedDescription, error);
  } else {
    resolve(data);
  }
  
}

RCT_REMAP_METHOD(backupMnemonic,
                 backupMnemonic:(NSString *)phrase resolver:(RCTPromiseResolveBlock)resolve
                 rejecter:(RCTPromiseRejectBlock)reject) {
  DFETHWallet *act = [[DFETHWallet alloc] initWithPhrase:phrase];
  [act lock];
  if (act.address) {
    [tmpAccount lock];
    NSDictionary *data = [tmpAccount toDictionary];
    tmpAccount = nil;
    resolve(data);
  } else {
    reject(@"-2001", @"助记词不正确, 请检查", [NSError errorWithDomain:NSURLErrorDomain code:-2001 userInfo:@{NSLocalizedDescriptionKey: @"助记词不正确, 请检查"}]);
  }
}

RCT_REMAP_METHOD(importAccount,
                  importAccountPhrase:(NSString *)phrase pwd:(NSString *)pwd name:(NSString *)name resolver:(RCTPromiseResolveBlock)resolve
                 rejecter:(RCTPromiseRejectBlock)reject) {
  DFETHWallet *account = [[DFETHWallet alloc] initWithPhrase:phrase];
  NSError *error;
  [account updatePassword:pwd orig:nil error:&error];
  [account lock];
  if (account && !error) {
      resolve([account toDictionary]);
  } else {
      reject(@"-2002", @"助记词不正确, 请检查", [NSError errorWithDomain:NSURLErrorDomain code:-2001 userInfo:@{NSLocalizedDescriptionKey: @"助记词不正确, 请检查"}]);
  }
  
}

RCT_REMAP_METHOD(importPrivatekey,
                 importPrivatekey:(NSString *)privatekey pwd:(NSString *)pwd name:(NSString *)name resolver:(RCTPromiseResolveBlock)resolve
                 rejecter:(RCTPromiseRejectBlock)reject) {
  DFETHWallet *account = [[DFETHWallet alloc] initWithPrivateKey:privatekey];
  NSError *error;
  [account updatePassword:pwd orig:nil error:&error];
  [account lock];
  if (account && !error) {
    resolve([account toDictionary]);
  } else {
    reject(@"-2002", @"私钥不正确, 请检查", [NSError errorWithDomain:NSURLErrorDomain code:-2001 userInfo:@{NSLocalizedDescriptionKey: @"私钥不正确, 请检查"}]);
  }
  
}

RCT_REMAP_METHOD(importKeystore,
                 importKeystore:(NSString *)keystore pwd:(NSString *)pwd name:(NSString *)name resolver:(RCTPromiseResolveBlock)resolve
                 rejecter:(RCTPromiseRejectBlock)reject) {
  [DFETHWallet decryptWithKeyStore:keystore password:pwd completion:^(DFETHWallet *account) {
    NSError *error;
    [account updatePassword:pwd orig:nil error:&error];
    [account lock];
    if (account && !error) {
      resolve([account toDictionary]);
    } else {
      reject(@"-2002", @"KeyStore不正确, 请检查", [NSError errorWithDomain:NSURLErrorDomain code:-2001 userInfo:@{NSLocalizedDescriptionKey: @"KeyStore不正确, 请检查"}]);
    }
  }];
}

RCT_REMAP_METHOD(isVaildPassword,
                 isVaildPassword:(NSString *)walletID :(NSString *)pwd resolver:(RCTPromiseResolveBlock)resolve
                 rejecter:(RCTPromiseRejectBlock)reject) {
  resolve(@([[DFETHWallet walletWithID:walletID] isVaildPassword:pwd]));
}

RCT_REMAP_METHOD(sendContractTransaction,
                  sendContractTransaction:(NSString *)walletID from:(NSString *)from contract:(NSString *)contract amout:(NSString *)amount data:(NSString *)data gasLimit:(NSString *)gasLimit gasPrice:(NSString *)gasPrice nonce:(NSInteger)nonce chainID:(NSInteger)chainID broadcast:(BOOL)broadcast password:(NSString *)password Withresolver:(RCTPromiseResolveBlock)resolve
                 rejecter:(RCTPromiseRejectBlock)reject) {
  DFContractTransaction *transaction = [[DFContractTransaction alloc] initWithFrom:from contract:contract amount:amount data:data gasLimit:gasLimit gasPrice:gasPrice nonce:nonce chainID:chainID];
  NSString *key = broadcast? @"txHash": @"rawData";
  [[DFWallet sharedInstance].rpc sendContractTransaction:transaction walletID:walletID broadcast:broadcast password:password completion:^(NSString *txHash, NSInteger nonce, NSError *error) {
    if (error) {
      reject(@(error.code).stringValue, error.description, error);
    } else {
      resolve(@{ key: txHash,
                @"nonce": @(nonce)
                });
    }
  }];
}

RCT_REMAP_METHOD(exportPrivateKey, exportPrivateKey:(NSString *)walletID :(NSString *)pws WithResolver:(RCTPromiseResolveBlock)resolve
                 rejecter:(RCTPromiseRejectBlock)reject) {
  NSString *pk = [[DFETHWallet walletWithID:walletID] getPrivateKey:pws];
  if (pk) {
    resolve(pk);
  } else {
    reject(@"-2101", @"密码错误", [NSError errorWithDomain:NSURLErrorDomain code:-2101 userInfo:@{NSLocalizedDescriptionKey: @"密码错误"}]);
  }
}

RCT_REMAP_METHOD(exportKeyStore, exportKeyStore:(NSString *)walletID :(NSString *)pws WithResolver:(RCTPromiseResolveBlock)resolve
                 rejecter:(RCTPromiseRejectBlock)reject) {
  [[DFETHWallet walletWithID:walletID] getKeyStore:pws callback:^(NSString *json) {
    if (json) {
      resolve(json);
    } else {
      reject(@"-2102", @"获取KeyStore失败", [NSError errorWithDomain:NSURLErrorDomain code:-2102 userInfo:@{NSLocalizedDescriptionKey: @"获取KeyStore失败"}]);
    }
  }];
}

RCT_REMAP_METHOD(exportMnemonic,
                 exportMnemonic:(NSString *)walletID :(NSString *)pws WithResolver:(RCTPromiseResolveBlock)resolve rejecter:(RCTPromiseRejectBlock)reject) {
    NSString *mnemonic = [[DFETHWallet walletWithID:walletID] mnemonicWithPassword:pws];
    if (mnemonic.length) {
      resolve(mnemonic);
    } else {
      reject(@"-2101", @"密码错误", [NSError errorWithDomain:NSURLErrorDomain code:-2101 userInfo:@{NSLocalizedDescriptionKey: @"密码错误"}]);
    }
}

@end

