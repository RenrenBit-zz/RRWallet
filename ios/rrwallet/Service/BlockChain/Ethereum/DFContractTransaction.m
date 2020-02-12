//
//  DFContractTransaction.m
//  rrwallet
//
//  Created by muhuai on 2018/8/19.
//  Copyright © 2018 Facebook. All rights reserved.
//

#import "DFContractTransaction.h"
#import "DFHexCategory.h"
#import "DFWallet.h"
#import "DFNetworkManager.h"
#import "DFEthereumRPCProvider.h"

@interface DFContractTransaction()

@property (nonatomic, strong, readwrite) NSString *from;
@property (nonatomic, strong, readwrite) NSString *contract;
@property (nonatomic, strong, readwrite) NSString *amount;
@property (nonatomic, strong, readwrite) NSString *data;
@property (nonatomic, strong, readwrite) NSString *gasLimit;
@property (nonatomic, strong, readwrite) NSString *gasPrice;
@property (nonatomic, assign, readwrite) NSInteger chainID;

@end

@implementation DFContractTransaction

- (instancetype)initWithFrom:(NSString *)from
                    contract:(NSString *)contract
                       amount:(NSString *)amount
                        data:(NSString *)data
                    gasLimit:(NSString *)gasLimit
                    gasPrice:(NSString *)gasPrice
                       nonce:(NSInteger)nonce
                     chainID:(NSInteger)chainID {
  self = [super init];
  if (self) {
    _from = from;
    _contract = contract;
    _amount = amount;
    _data = data;
    _gasLimit = gasLimit;
    _gasPrice = gasPrice;
    _nonce = nonce;
    _chainID = chainID;
  }
  return self;
}

- (Transaction *)origTransaction {
  Transaction *transaction = [Transaction transaction];
  transaction.toAddress = [Address addressWithString:self.contract];
  transaction.gasLimit = [BigNumber bigNumberWithDecimalString:self.gasLimit];
  transaction.gasPrice = [BigNumber bigNumberWithDecimalString:self.gasPrice];
  transaction.value = [BigNumber bigNumberWithDecimalString:self.amount];
  transaction.chainId = self.chainID;
  transaction.nonce = self.nonce;
  
  transaction.data = [NSData df_dataWithHexString:self.data];
  
  return transaction;
}
@end
