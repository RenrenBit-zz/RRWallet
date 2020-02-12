//
//  DFContractTransaction.h
//  rrwallet
//
//  Created by muhuai on 2018/8/19.
//  Copyright © 2018 Facebook. All rights reserved.
//

#import <Foundation/Foundation.h>
#import <ethers/ethers.h>

@interface DFContractTransaction : NSObject

@property (nonatomic, assign) NSInteger retryCount;
@property (nonatomic, assign) NSInteger nonce;

@property (nonatomic, strong, readonly) NSString *from;
@property (nonatomic, strong, readonly) NSString *contract;
@property (nonatomic, strong, readonly) NSString *amount;
@property (nonatomic, strong, readonly) NSString *data;
@property (nonatomic, strong, readonly) NSString *gasLimit;
@property (nonatomic, strong, readonly) NSString *gasPrice;
@property (nonatomic, assign, readonly) NSInteger chainID;

- (instancetype)initWithFrom:(NSString *)from
                    contract:(NSString *)contract
                       amount:(NSString *)amount
                        data:(NSString *)data
                    gasLimit:(NSString *)gasLimit
                    gasPrice:(NSString *)gasPrice
                       nonce:(NSInteger)nonce
                     chainID:(NSInteger)chain;

- (Transaction *)origTransaction;

@end
