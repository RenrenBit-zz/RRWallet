//
//  DFBTCWallet.h
//  rrwallet
//
//  Created by muhuai on 2018/4/11.
//  Copyright © 2018年 Facebook. All rights reserved.
//

#import <Foundation/Foundation.h>
#import "DFBaseWallet.h"
#import "DFWalletDefine.h"

@interface DFBTCWallet : DFBaseWallet

@property (nonatomic, strong) NSString *name;
@property (nonatomic, strong) NSString *address;
@property (nonatomic, strong) NSArray<NSString *> *externalAddresss;
@property (nonatomic, strong) NSArray<NSString *> *changeAddresss;

- (instancetype)initWithMnemonic:(NSString *)mnemonic;

- (instancetype)initWithMnemonic:(NSString *)mnemonic password:(NSString *)pwd name:(NSString *)name;

- (instancetype)initWithName:(NSString *)name password:(NSString *)pwd;

- (instancetype)initWitPrivateKey:(NSString *)privatekey password:(NSString *)pwd;

- (void)lock;

- (BOOL)isVaildPassword:(NSString *)pwd;

- (NSString *)getPrivateKeyWithPassword:(NSString *)pwd;

- (NSString *)exportExtendedPublicKeyWithPath:(NSString *)path net:(NSInteger)net password:(NSString *)pwd;

- (NSArray<NSString *> *)fetchAddressesWithPaths:(NSArray<NSString *> *)paths
                               extendedPublicKey:(NSString *)extendedKey
                                            type:(NSInteger)type
                                             net:(NSInteger)net;

- (void)sendRawTransaction:(NSArray *)inputs
                   outputs:(NSArray *)outputs
                       net:(NSInteger)net
                  password:(NSString *)pwd
                completion:(void (^)(NSDictionary *result, NSError *error))completion;

- (void)signHash:(NSString *)hash
        hashType:(NSInteger)sigHashType
            path:(NSString *)path
        password:(NSString *)pwd
      completion:(void (^)(NSString *result, NSError *error))completion;

+ (NSArray<NSString *> *)generatePublickKeys:(NSString *)extendedKey paths:(NSArray<NSString *> *)paths;
@end
