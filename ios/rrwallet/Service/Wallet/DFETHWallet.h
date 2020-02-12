//
//  DFAccount.h
//  rrwallet
//
//  Created by muhuai on 2018/2/28.
//  Copyright © 2018年 Facebook. All rights reserved.
//

#import <Foundation/Foundation.h>
#import <ethers/ethers.h>
#import "DFBaseWallet.h"
#import "DFWalletDefine.h"

@interface DFETHWallet : DFBaseWallet

@property (nonatomic, strong, readonly) NSString *address;
@property (nonatomic, strong, readonly) NSString *mnemonicPhrase;

- (instancetype)initRandom;

- (instancetype)initWithPhrase:(NSString *)phrase;

- (instancetype)initWithPrivateKey:(NSString *)privateKey;

+ (void)decryptWithKeyStore:(NSString *)keystore password:(NSString *)pwd completion:(void (^)(DFETHWallet *))completion;

- (BOOL)isVaildPassword:(NSString *)pwd;

- (void)updatePassword:(NSString *)pwd orig:(NSString *)orig error:(NSError **)error;

- (void)lock;

- (NSData *)sign:(Transaction *)transcation password:(NSString *)pwd;

- (NSData *)toData;

- (void)getKeyStore:(NSString *)pwd callback:(void (^)(NSString *json))callback;

- (NSString *)getPrivateKey:(NSString *)pwd;

@end
