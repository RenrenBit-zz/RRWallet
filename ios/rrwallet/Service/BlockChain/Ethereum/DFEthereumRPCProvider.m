//
//  DFEthereumJsonPRCClient.m
//  rrwallet
//
//  Created by muhuai on 2018/3/1.
//  Copyright © 2018年 Facebook. All rights reserved.
//

#import "DFEthereumRPCProvider.h"
#import "DFNetworkManager.h"
#import "DFWallet.h"
#import "DFHexCategory.h"
#import "DFContractTransaction.h"
#import <ethers/ethers.h>

#define HEX_VALUE(INT) [NSString stringWithFormat:@"0x%llX", (long long)INT]
#define INT_VALUE()
@interface DFEthereumRPCProvider()
@property (nonatomic, assign, readwrite) DFWalletEnv env;
@property (nonatomic, strong) JsonRpcProvider *provider;
@end

@implementation DFEthereumRPCProvider

- (instancetype)initWithURL:(NSString *)url {
  self = [super init];
  if (self) {
//    _provider = [[JsonRpcProvider alloc] initWithChainId:0 url:[NSURL URLWithString:url]];
  }
  return self;
}

- (instancetype)initWithEnv:(DFWalletEnv)env {
  self = [self initWithURL:[DFEthereumRPCProvider urlWithEnv:env]];
  if (self) {
    _env = env;
  }
  return self;
}

#pragma mark - eth_getTransactionCount
- (void)getTransactionCount:(NSString *)address completion:(void (^)(NSInteger count, NSError *error))completion {
  [[DFNetworkManager sharedInstance] invokeMethod:@"eth_getTransactionCount" withParameters:@[address, @"pending"] URL:[DFNetworkManager sharedInstance].ETHRPCURL callback:^(id obj, NSDictionary *resp, NSError *error) {
    
    NSString *hexCount = [obj isKindOfClass:[NSString class]]? (NSString *)obj: nil;
    NSInteger count = [hexCount df_hexToInt];
    
    if (completion) {
      completion(count, error);
    }
  }];
}

#pragma mark - eth_sendTransaction

- (void)sendContractTransaction:(DFContractTransaction *)transcation
                    walletID:(NSString *)walletID
                    broadcast:(BOOL)broadcast
                    password:(NSString *)password
                  completion:(void (^)(NSString *txHash, NSInteger nonce, NSError *error))completion {
  if (!transcation.contract.length) {
    if (completion) {
      completion(nil, transcation.nonce, [NSError errorWithDomain:NSURLErrorDomain code:-10000 userInfo:@{NSLocalizedDescriptionKey: @"目标地址, 合约地址都不能为空"}]);
    }
    return;
  }
  
  if (transcation.nonce < 0 && transcation.retryCount == 0) {
    [self getTransactionCount:transcation.from completion:^(NSInteger count, NSError *error) {
      if (error) {
        if (completion) {
          completion(nil, count, error);
        }
        return;
      }
      transcation.nonce = count;
      transcation.retryCount++;
      [self sendContractTransaction:transcation walletID:walletID broadcast:broadcast password:password completion:completion];
    }];
    return;
  }
  
  Transaction *origTransaction = [transcation origTransaction];
  
  NSData *signature = [[DFETHWallet walletWithID:walletID] sign:origTransaction password:password];
  
  if (!signature.length) {
    if (completion) {
      completion(nil, transcation.nonce, [NSError errorWithDomain:NSURLErrorDomain code:-10000 userInfo:@{NSLocalizedDescriptionKey: @"密码错误"}]);
    }
    return;
  }
  
  NSString *hexSignature = [SecureData dataToHexString:signature];
  
  if (!broadcast) {
    if (completion) {
      completion(hexSignature, transcation.nonce, nil);
    }
    return;
  }
  
  [[DFNetworkManager sharedInstance] invokeMethod:@"eth_sendRawTransaction" withParameters:@[hexSignature] URL:[DFNetworkManager sharedInstance].ETHRPCURL callback:^(id obj, NSDictionary *resp, NSError *error) {
    if ([error.localizedDescription isEqualToString:@"replacement transaction underpriced"] && transcation.retryCount < 20) {
      transcation.retryCount++;
      transcation.nonce++;
      [self sendContractTransaction:transcation walletID:walletID broadcast:broadcast password:password completion:completion];
      return;
    }
    
    if (completion) {
      completion(obj, transcation.nonce, error);
    }
  }];
}

#pragma mark - getter & setter
+ (NSString *)urlWithEnv:(DFWalletEnv)env {
  return [DFNetworkManager sharedInstance].ETHRPCURL;
}
@end
