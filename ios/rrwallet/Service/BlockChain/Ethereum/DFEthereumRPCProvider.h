//
//  DFEthereumJsonPRCClient.h
//  rrwallet
//
//  Created by muhuai on 2018/3/1.
//  Copyright © 2018年 Facebook. All rights reserved.
//

#import <Foundation/Foundation.h>
#import "DFWalletDefine.h"
@class DFContractTransaction;

typedef void (^DFEthereumJsonRPCCompletion)(NSDictionary *result, NSError *error);

typedef enum : unsigned char {
  DFEthereumTypeHomestead = 0x01,
  DFEthereumTypeMorden    = 0x02,
  DFEthereumTypeRopsten   = 0x03,
  DFEthereumTypeRinkeby   = 0x04
} DFEthereumType;

@interface DFEthereumRPCProvider : NSObject

@property (nonatomic, assign, readonly) DFWalletEnv env;

- (instancetype)initWithURL:(NSString *)url;

- (instancetype)initWithEnv:(DFWalletEnv)env;

- (void)getTransactionCount:(NSString *)address completion:(void (^)(NSInteger count, NSError *error))completion;

- (void)sendContractTransaction:(DFContractTransaction *)transcation
                       walletID:(NSString *)walletID
                      broadcast:(BOOL)broadcast
                       password:(NSString *)password
                     completion:(void (^)(NSString *txHash, NSInteger nonce, NSError *error))completion;
@end
