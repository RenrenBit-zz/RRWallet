//
//  RRBTCTransactionOutput.h
//  rrwallet
//
//  Created by muhuai on 2018/11/27.
//  Copyright © 2018 Facebook. All rights reserved.
//

#import <Foundation/Foundation.h>
#import <CoreBitcoin/CoreBitcoin.h>

NS_ASSUME_NONNULL_BEGIN

@interface RRBTCutxo : NSObject

@property (nonatomic, copy) NSString *address;
@property (nonatomic, copy) NSString *path;
@property (nonatomic, copy) NSString *txid;
@property (nonatomic, copy) NSString *rawSigHash;
@property (nonatomic) NSInteger vout;
@property (nonatomic, copy) NSString *scriptPubKey;
@property (nonatomic) float amount;
@property (nonatomic) NSInteger satoshis;
@property (nonatomic) NSInteger height;
@property (nonatomic) NSInteger confirmations;
@property (nonatomic) NSInteger sigHashType;

@property (nonatomic, strong, readonly) BTCScript *script;

- (instancetype)initWithDictionary:(NSDictionary *)dictionary;

@end

NS_ASSUME_NONNULL_END
