//
//  DFWallet.h
//  rrwallet
//
//  Created by muhuai on 2018/2/28.
//  Copyright © 2018年 Facebook. All rights reserved.
//

#import <Foundation/Foundation.h>
#import "DFETHWallet.h"
#import "DFBTCWallet.h"
#import "DFEthereumRPCProvider.h"
#import "DFWalletDefine.h"

@interface DFWallet : NSObject

@property (nonatomic, strong, readonly) DFETHWallet *ethAccount;
@property (nonatomic, strong, readonly) NSArray *accounts;
@property (nonatomic, strong, readonly) DFEthereumRPCProvider *rpc;
@property (nonatomic, assign) DFWalletEnv env;
+ (instancetype)sharedInstance;


@end
