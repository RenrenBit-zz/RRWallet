//
//  DFAccount.m
//  rrwallet
//
//  Created by muhuai on 2018/2/28.
//  Copyright © 2018年 Facebook. All rights reserved.
//

#import "DFETHWallet.h"
#import <ethers/ethers.h>
#import "NSDictionary+MFCategory.h"
#import "DFHexCategory.h"
#import <CocoaSecurity/Base64.h>
#import <CommonCrypto/CommonDigest.h>

#define KEYCHAIN_ACCOUNT @"com.dfund.account.keychain1"

@interface DFETHWallet()

@property (nonatomic, strong) Account *account;

@property (nonatomic, strong, readwrite) NSString *address;

@end

@implementation DFETHWallet

- (instancetype)init {
  self = [super init];
  if (self) {
    self.type = DFWalletTypeEthereum;
  }
  return self;
}

- (instancetype)initRandom {
  self = [self init];
  if (self) {
    Account *tmp = [Account randomMnemonicAccount];
    _account = tmp;
    _address = [tmp.address.checksumAddress copy];
    self.source = DFWalletSourceMnemonic;
    self.walletID = [self md5:_address];
  }
  
  return self;
}

- (instancetype)initWithDictionary:(NSDictionary *)dict {
  self = [super initWithDictionary:dict];
  if (self) {
    _address = [dict mf_stringValueForKey:@"address"];
  }
  
  return self;
}

- (instancetype)initWithPhrase:(NSString *)phrase {
  self = [self init];
  if (self) {
    Account *tmp = [Account accountWithMnemonicPhrase:phrase];
    if (!tmp.address.checksumAddress.length) {
      return nil;
    }
    _account = tmp;
    _address = tmp.address.checksumAddress;
    self.source = DFWalletSourceMnemonic;
    self.walletID = [self md5:_address];
  }
  return self;
}

- (instancetype)initWithPrivateKey:(NSString *)privateKey {
  self = [self init];
  if (self) {
    
    Account *tmp = [Account accountWithPrivateKey:[NSData df_dataWithHexString:privateKey]];
    if (!tmp.address.checksumAddress.length) {
      return nil;
    }
    _account = tmp;
    _address = tmp.address.checksumAddress;
    self.source = DFWalletSourcePrivateKey;
    self.walletID = [self md5:_address];
  }
  return self;
}

+ (void)decryptWithKeyStore:(NSString *)keystore password:(NSString *)pwd completion:(void (^)(DFETHWallet *))completion {
  [Account decryptSecretStorageJSON:keystore password:pwd callback:^(Account *account, NSError *NSError) {
    if (!NSError) {
      DFETHWallet *wallet = [[DFETHWallet alloc] init];
      wallet.account = account;
      wallet.source = DFWalletSourceKeyStore;
      wallet.address = account.address.checksumAddress;
      wallet.walletID = [wallet md5:wallet.address];
      if (completion) {
        completion(wallet);
      }
    } else {
      if (completion) {
        completion(nil);
      }
    }
    
  }];
}

- (BOOL)unlock:(NSString *)pwd {
  BOOL success = NO;
  NSData *seed = [self seedWithPassword:pwd];
  
  if (!seed) {
    return NO;
  }
  
  switch (self.source) {
      case DFWalletSourceMnemonic: {
        NSString *mnemonicStr = [[NSString alloc] initWithData:seed encoding:NSUTF8StringEncoding];
        if (mnemonicStr) {
            _account = [Account accountWithMnemonicPhrase:mnemonicStr];
        } else {
            _account = [Account accountWithMnemonicData:seed];
            NSData *mnemonicData = [_account.mnemonicPhrase dataUsingEncoding:NSUTF8StringEncoding];
          if (_account && mnemonicData) {
            [self saveSeed:mnemonicData password:pwd];
          }
        }
        
        success = !!_account;
        break;
      }
      case DFWalletSourceKeyStore:
      case DFWalletSourcePrivateKey: {
        _account = [Account accountWithPrivateKey:seed];
        success = !!_account;
        break;
      }
    default:
      success = NO;
      break;
  }
  return success;
}

- (void)lock {
  _account = nil;
}

- (NSString *)mnemonicWithPassword:(NSString *)pwd {
  if (!pwd.length) {
    return nil;
  }
  
  NSData *seed = [self seedWithPassword:pwd];
  if (!seed.length) {
    return nil;
  }
  
  Account *tmp = [Account accountWithMnemonicData:seed];
  
  return tmp.mnemonicPhrase;
}

- (void)getKeyStore:(NSString *)pwd callback:(void (^)(NSString *json))callback {
  BOOL success = [self unlock:pwd];
  if (!success) {
    if (callback) {
      callback(nil);
    }
  }
  [self.account encryptSecretStorageJSON:pwd callback:^(NSString *json) {
    callback(json);
    [self lock];
  }];
}

- (NSString *)getPrivateKey:(NSString *)pwd {
  
  BOOL success = [self unlock:pwd];
  if (!success) {
    return nil;
  }
  
  NSData *privateKey = self.account.privateKey;
  //NSString *privateKey = result.utf8String;
  NSString *priStr = [[NSString stringWithFormat:@"%@",privateKey] stringByReplacingOccurrencesOfString:@"<" withString:@""];
  priStr = [priStr stringByReplacingOccurrencesOfString:@">" withString:@""];
  priStr = [priStr stringByReplacingOccurrencesOfString:@" " withString:@""];
  [self lock];
  return priStr.lowercaseString;
}

- (BOOL)isVaildPassword:(NSString *)pwd {
  BOOL success = [self unlock:pwd];
  [self lock];
  return success;
}

- (void)updatePassword:(NSString *)pwd orig:(NSString *)orig error:(NSError **)error {
  if (!self.address.length) {
    *error = [NSError errorWithDomain:NSCocoaErrorDomain code:-1000 userInfo:@{NSLocalizedDescriptionKey: @"address must not be nil"}];
    return;
  }
  
  if (!pwd.length) {
    *error = [NSError errorWithDomain:NSCocoaErrorDomain code:-1000 userInfo:@{NSLocalizedDescriptionKey: @"password must not be nil"}];
    return;
  }
  
  if (_account) {
    NSData *seed = self.source == DFWalletSourceMnemonic? [_account.mnemonicPhrase dataUsingEncoding:NSUTF8StringEncoding]: _account.privateKey;
    [self saveSeed:seed password:pwd];
    _account = nil;
  } else {
    *error = [NSError errorWithDomain:NSCocoaErrorDomain code:-1000 userInfo:@{NSLocalizedDescriptionKey: @"account status has a problem"}];
  }
}

- (NSData *)sign:(Transaction *)transcation password:(NSString *)pwd {
  BOOL success = [self unlock:pwd];
  
  if (!success) {
    return nil;
  }
  
  [self.account sign:transcation];
  [self lock];
  return [transcation serialize];;
}

- (NSData *)toData {
  NSData *data = [NSJSONSerialization dataWithJSONObject:[self toDictionary] options:0 error:0];
  return data;
}

- (NSDictionary *)toDictionary {
  NSMutableDictionary *dict = [[super toDictionary] mutableCopy];
  [dict setValue:self.walletID forKey:@"id"];
  [dict setValue:self.address forKey:@"address"];
  [dict setValue:self.mnemonicPhrase forKey:@"mnemonic"];
  
  [[NSUserDefaults standardUserDefaults] setObject:({
    NSMutableDictionary *mutable = [dict mutableCopy];
    [mutable removeObjectForKey:@"mnemonic"];
    mutable;
  }) forKey:self.walletID];
  return [dict copy];
}

- (NSString *)address {
  if (!_address) {
    _address = self.account.address.checksumAddress;
  }
  return _address;
}

- (NSString *)mnemonicPhrase {
  return [self.account.mnemonicPhrase copy];
}

- (NSString *)md5:(NSString *)string{
  const char *cStr = [string UTF8String];
  unsigned char digest[CC_MD5_DIGEST_LENGTH];
  
  CC_MD5(cStr, (CC_LONG)strlen(cStr), digest);
  
  NSMutableString *result = [NSMutableString stringWithCapacity:CC_MD5_DIGEST_LENGTH * 2];
  for (int i = 0; i < CC_MD5_DIGEST_LENGTH; i++) {
    [result appendFormat:@"%02X", digest[i]];
  }
  
  return result;
}
@end
