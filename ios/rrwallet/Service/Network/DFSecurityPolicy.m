//
//  DFSecurityPolicy.m
//  rrwallet
//
//  Created by muhuai on 2018/7/24.
//  Copyright © 2018 Facebook. All rights reserved.
//

#import "DFSecurityPolicy.h"
@interface DFSecurityPolicy()

@property (nonatomic, strong) AFSecurityPolicy *innerPolicy;
@end
@implementation DFSecurityPolicy

- (instancetype)init {
  self = [super init];
  _innerPolicy = [AFSecurityPolicy defaultPolicy];
  return self;
}

- (BOOL)evaluateServerTrust:(SecTrustRef)serverTrust
                  forDomain:(nullable NSString *)domain {
  if ([domain containsString:@"gateway.d.cash"] || [domain containsString:@"gateway.bitrenren.com"]) {
    return [super evaluateServerTrust:serverTrust forDomain:domain];
  } else {
    return [self.innerPolicy evaluateServerTrust:serverTrust forDomain:domain];
  }
}
@end
