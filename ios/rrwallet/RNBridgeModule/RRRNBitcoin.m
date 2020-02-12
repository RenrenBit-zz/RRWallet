//
//  DFRNBTCWallet.m
//  rrwallet
//
//  Created by muhuai on 2018/4/11.
//  Copyright © 2018年 Facebook. All rights reserved.
//

#import "RRRNBitcoin.h"
#import "DFBTCWallet.h"
#import "DFWallet.h"

@implementation RRRNBitcoin
RCT_EXPORT_MODULE();

static DFBTCWallet *tmp;

- (dispatch_queue_t)methodQueue {
  return dispatch_get_main_queue();
}

RCT_REMAP_METHOD(createRandomAccount,
                 createRandomAccount:(NSString *)name pwd:(NSString *)pwd note:(NSString *)note resolver:(RCTPromiseResolveBlock)resolve
                 rejecter:(RCTPromiseRejectBlock)reject) {
  tmp = [[DFBTCWallet alloc] initWithName:name password:pwd];
  NSDictionary *data = [tmp toDictionary];
  NSString *mnemonic = [tmp mnemonicWithPassword:pwd];
  NSMutableDictionary *mutable = [data mutableCopy];
  [mutable setValue:mnemonic forKey:@"mnemonic"];
  resolve([mutable copy]);
}

RCT_REMAP_METHOD(importAccount,
                 importAccount:(NSString *)mnemonic :(NSString *)pwd :(NSString *)name :(RCTPromiseResolveBlock)resolve
                 rejecter:(RCTPromiseRejectBlock)reject) {
  DFBTCWallet *account = [[DFBTCWallet alloc] initWithMnemonic:mnemonic password:pwd name:name];
  [account lock];
  if (account) {
    resolve([account toDictionary]);
  } else {
    reject(@"-2002", @"助记词不正确, 请检查", [NSError errorWithDomain:NSURLErrorDomain code:-2001 userInfo:@{NSLocalizedDescriptionKey: @"助记词不正确, 请检查"}]);
  }
}

RCT_REMAP_METHOD(importPrivatekey,
                 importPrivatekey:(NSString *)pk :(NSString *)pwd :(NSString *)name :(RCTPromiseResolveBlock)resolve
                 rejecter:(RCTPromiseRejectBlock)reject) {
  DFBTCWallet *account = [[DFBTCWallet alloc] initWitPrivateKey:pk password:pwd];
  [account lock];
  if (account) {
    resolve([account toDictionary]);
  } else {
    reject(@"-2002", @"私钥不正确, 请检查", [NSError errorWithDomain:NSURLErrorDomain code:-2001 userInfo:@{NSLocalizedDescriptionKey: @"私钥不正确, 请检查"}]);
  }
}

RCT_REMAP_METHOD(backupMnemonic,
                 backupMnemonic:(NSString *)mnemonic resolver:(RCTPromiseResolveBlock)resolve
                 rejecter:(RCTPromiseRejectBlock)reject) {
  DFBTCWallet *account = [[DFBTCWallet alloc] initWithMnemonic:mnemonic];
  [account lock];
  if (account.address.length) {
    tmp = nil;
    resolve([account toDictionary]);
  } else {
    reject(@"-2002", @"助记词不正确, 请检查", [NSError errorWithDomain:NSURLErrorDomain code:-2001 userInfo:@{NSLocalizedDescriptionKey: @"助记词不正确, 请检查"}]);
  }
}

RCT_REMAP_METHOD(exportPrivateKey,
                 exportPrivateKey:(NSString *)walletID :(NSString *)pws WithResolver:(RCTPromiseResolveBlock)resolve
                 rejecter:(RCTPromiseRejectBlock)reject) {
  
  NSString *pk = [[DFBTCWallet walletWithID:walletID] getPrivateKeyWithPassword:pws];
  if (pk) {
    resolve(pk);
  } else {
    reject(@"-2101", @"密码错误", [NSError errorWithDomain:NSURLErrorDomain code:-2101 userInfo:@{NSLocalizedDescriptionKey: @"密码错误"}]);
  }
}

RCT_REMAP_METHOD(exportMnemonic,
                 exportMnemonic:(NSString *)walletID :(NSString *)pws WithResolver:(RCTPromiseResolveBlock)resolve
                 rejecter:(RCTPromiseRejectBlock)reject) {
  NSString *mnemonic = [[DFBTCWallet walletWithID:walletID] mnemonicWithPassword:pws];
  if (mnemonic.length) {
    resolve(mnemonic);
  } else {
    reject(@"-2101", @"密码错误", [NSError errorWithDomain:NSURLErrorDomain code:-2101 userInfo:@{NSLocalizedDescriptionKey: @"密码错误"}]);
  }
}

RCT_REMAP_METHOD(sendRawTransaction,
                 sendRawTransaction:(NSString *)walletID :(NSArray *)inputs :(NSArray *)outputs :(NSInteger)net :(NSString *)pwd :(RCTPromiseResolveBlock)resolve :(RCTPromiseRejectBlock)reject) {
  [[DFBTCWallet walletWithID:walletID] sendRawTransaction:inputs outputs:outputs net:net password:pwd completion:^(NSDictionary *result, NSError *error) {
    if (result) {
      resolve(result);
    } else {
      reject(@(error.code).stringValue, error.description, error);
    }
  }];
}

RCT_REMAP_METHOD(isVaildPassword,
                 isVaildPassword:(NSString *)walletID :(NSString *)pwd resolver:(RCTPromiseResolveBlock)resolve
                 rejecter:(RCTPromiseRejectBlock)reject) {
  resolve(@([[DFBTCWallet walletWithID:walletID] isVaildPassword:pwd]));
}

RCT_REMAP_METHOD(exportExtendedPublicKey,
                 exportExtendedPublicKey:(NSString *)walletID :(NSString *)path :(NSInteger)net :(NSString *)pwd resolver:(RCTPromiseResolveBlock)resolve
                 rejecter:(RCTPromiseRejectBlock)reject) {
  NSString *extendedPublicKey = [[DFBTCWallet walletWithID:walletID] exportExtendedPublicKeyWithPath:path net:net password:pwd];
  resolve(extendedPublicKey);
}

RCT_REMAP_METHOD(fetchAddresses,
                 fetchAddresses:(NSString *)walletID :(NSArray *)paths :(NSString *)extendedKey :(NSInteger)type :(NSInteger)net resolver:(RCTPromiseResolveBlock)resolve
                 rejecter:(RCTPromiseRejectBlock)reject) {
  NSArray *array = [[DFBTCWallet walletWithID:walletID] fetchAddressesWithPaths:paths extendedPublicKey:extendedKey type:type net:net];
  resolve(array);
}

RCT_REMAP_METHOD(publicKeys,
                 publicKeys:(NSString *)extendedKey :(NSArray *)paths resolver:(RCTPromiseResolveBlock)resolve
                 rejecter:(RCTPromiseRejectBlock)reject) {
  
  NSArray *array = [DFBTCWallet generatePublickKeys:extendedKey paths:paths];
  resolve(array);
}

RCT_REMAP_METHOD(signHash,
                 signHash:(NSString *)walletID :(NSString *)hash :(NSInteger)sigHashType :(NSString *)path :(NSString *)pwd resolver:(RCTPromiseResolveBlock)resolve
                 rejecter:(RCTPromiseRejectBlock)reject) {
  [[DFBTCWallet walletWithID:walletID] signHash:hash hashType:sigHashType path:path password:pwd completion:^(NSString *result, NSError *error) {
    if (result) {
      resolve(result);
    } else {
      reject(@(error.code).stringValue, error.description, error);
    }
  }];
}
@end
