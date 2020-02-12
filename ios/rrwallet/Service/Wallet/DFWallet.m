
//
//  DFWallet.m
//  rrwallet
//
//  Created by muhuai on 2018/2/28.
//  Copyright © 2018年 Facebook. All rights reserved.
//

#import "DFWallet.h"
#import <ethers/ethers.h>
#import <SAMKeychain/SAMKeychain.h>
#import "DFETHWallet.h"

@interface DFWallet()

@property (nonatomic, strong, readwrite) DFEthereumRPCProvider *rpc;

@end

@implementation DFWallet

+ (instancetype)sharedInstance {
  static DFWallet *wallet;
  static dispatch_once_t onceToken;
  dispatch_once(&onceToken, ^{
    wallet = [[DFWallet alloc] init];
  });
  
  return wallet;
}

- (instancetype)init {
  self = [super init];
  if (self) {

    _env = DFWalletEnvRelease;
    
#if WALLET_ENV_DEBUG
    _env = DFWalletEnvDebug;
#endif
    
#if DEBUG
    _env = DFWalletEnvDebug;
#endif
    
    
    _rpc = [[DFEthereumRPCProvider alloc] initWithEnv:_env];
  }
  return self;
}
@end
