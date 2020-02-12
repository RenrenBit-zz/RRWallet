//
//  DFWallet.h
//  rrwallet
//
//  Created by muhuai on 2018/4/2.
//  Copyright © 2018年 Facebook. All rights reserved.
//

#import <Foundation/Foundation.h>

typedef NS_ENUM(NSUInteger, DFWalletType) {
  DFWalletTypeEthereum = 1,
  DFWalletTypeBitcoin = 2
};

typedef enum : NSUInteger {
  DFWalletSourceMnemonic,
  DFWalletSourcePrivateKey,
  DFWalletSourceKeyStore,
} DFWalletSource;


@interface DFBaseWallet: NSObject
@property (nonatomic, strong) NSString *walletID;
@property (nonatomic, assign) DFWalletType type;
@property (nonatomic, assign) DFWalletSource source;

- (instancetype)initWithDictionary:(NSDictionary *)dict;

+ (instancetype)walletWithID:(NSString *)walletID;

+ (instancetype)walletWithID:(NSString *)walletID source:(DFWalletSource)source;

- (NSDictionary *)toDictionary;

- (NSString *)mnemonicWithPassword:(NSString *)pwd;

- (BOOL)unlock:(NSString *)pwd;

- (void)lock;

- (void)saveSeed:(NSData *)seed password:(NSString *)pwd;

- (NSData *)seedWithPassword:(NSString *)pwd;

- (void)dropSeedWithPassword:(NSString *)pwd;
@end
