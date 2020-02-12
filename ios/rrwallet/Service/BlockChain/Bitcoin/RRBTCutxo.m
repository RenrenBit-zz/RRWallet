//
//  RRBTCTransactionOutput.m
//  rrwallet
//
//  Created by muhuai on 2018/11/27.
//  Copyright © 2018 Facebook. All rights reserved.
//

#import "RRBTCutxo.h"

@interface RRBTCutxo()

@property (nonatomic, strong, readwrite) BTCScript *script;

@end
@implementation RRBTCutxo

- (instancetype)initWithDictionary:(NSDictionary *)dictionary {
  self = [super init];
  if (self) {
    self.address = dictionary[@"address"];
    self.path = dictionary[@"path"];
    self.satoshis = [dictionary[@"satoshis"] longLongValue];
    self.amount = [dictionary[@"amount"] floatValue];
    self.scriptPubKey = dictionary[@"scriptPubKey"];
    self.vout = [dictionary[@"vout"] intValue];
    self.confirmations = [dictionary[@"confirmations"]  integerValue];
    self.txid = dictionary[@"txid"];
    self.rawSigHash = dictionary[@"rawSigHash"];
    self.sigHashType = [dictionary[@"sigHashType"] integerValue];
    
    self.script = [[BTCScript alloc] initWithData:BTCDataFromHex(self.scriptPubKey)];
  }
  
  return self;
}
@end
