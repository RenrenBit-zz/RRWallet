//
//  DFBaseWallet.m
//  rrwallet
//
//  Created by muhuai on 2018/4/12.
//  Copyright © 2018年 Facebook. All rights reserved.
//

#import "DFBaseWallet.h"
#import "NSDictionary+MFCategory.h"
#import <CocoaSecurity/CocoaSecurity.h>
#import <SAMKeychain/SAMKeychain.h>
#import <CocoaSecurity/Base64.h>

#define KEYCHAIN_ACCOUNT @"com.rrwallet.account.keychain.seed"
#define AES_KEY [@[@"xQs2Q", @"rmo2avqd", @"GLssO0vn", @"6jsb5rs^"] componentsJoinedByString:@"Oo00O"]

@implementation DFBaseWallet

- (instancetype)initWithDictionary:(NSDictionary *)dict {
  self = [super init];
  if (self) {
    self.walletID = [dict mf_stringValueForKey:@"id"];
    self.type = [dict mf_integerValueForKey:@"type"];
    self.source = [dict mf_integerValueForKey:@"source"];
  }
  return self;
}

+ (instancetype)walletWithID:(NSString *)walletID {
  NSDictionary *dict = [[NSUserDefaults standardUserDefaults] dictionaryForKey:walletID];
  DFBaseWallet *wallet = [[self alloc] initWithDictionary:dict];
  if (self) {
    
    wallet.walletID = walletID;
  }
  
  return wallet;
}

+ (instancetype)walletWithID:(NSString *)walletID source:(DFWalletSource)source {
  DFBaseWallet *wallet = [[self alloc ]init];
  if (self) {
    wallet.walletID = walletID;
    wallet.source = source;
  }
  
  return wallet;
}

- (NSDictionary *)toDictionary {
  return @{
           @"id": self.walletID,
           @"type" : @(self.type),
           @"source": @(self.source)
           };
}

- (BOOL)unlock:(NSString *)pwd {
  return NO;
}

- (void)lock {
  
}

- (void)saveSeed:(NSData *)seed password:(NSString *)pwd {
  CocoaSecurityResult *result = [CocoaSecurity aesEncrypt:[seed base64EncodedStringWithOptions:0] key:[CocoaSecurity sha256:pwd].hex];
  result = [CocoaSecurity aesEncrypt:result.base64 key:AES_KEY];
  [SAMKeychain setPassword:result.base64 forService:KEYCHAIN_ACCOUNT account:self.walletID];
}

- (NSData *)seedWithPassword:(NSString *)pwd {
  NSString *base64 = [SAMKeychain passwordForService:KEYCHAIN_ACCOUNT account:self.walletID];
  CocoaSecurityResult *result = [CocoaSecurity aesDecryptWithBase64:base64 key:AES_KEY];
  result = [CocoaSecurity aesDecryptWithBase64:result.utf8String key:[CocoaSecurity sha256:pwd].hex];
  return [NSData dataWithBase64EncodedString:result.utf8String];
}

- (void)dropSeedWithPassword:(NSString *)pwd {
  [SAMKeychain deletePasswordForService:KEYCHAIN_ACCOUNT account:self.walletID];
}
@end
