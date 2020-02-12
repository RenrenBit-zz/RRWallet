//
//  MFNetwork.m
//  rrwallet
//
//  Created by muhuai on 2018/2/16.
//  Copyright © 2018年 Facebook. All rights reserved.
//

#import "RRRNNetwork.h"
#import "DFNetworkManager.h"

@implementation RRRNNetwork

RCT_EXPORT_MODULE();

RCT_REMAP_METHOD(fetch,
                 fetch:(NSString *)url headers:(NSDictionary *)headers
                 resolver:(RCTPromiseResolveBlock)resolve
                 rejecter:(RCTPromiseRejectBlock)reject) {
  [[DFNetworkManager sharedInstance] requestForJSONWithURL:[NSURL URLWithString:url] param:headers callback:^(id jsonObj, NSError *error) {
    if (error) {
      reject(@(error.code).stringValue, error.description, error);
    } else {
      resolve(jsonObj);
    }
  }];
}

RCT_REMAP_METHOD(post,
                 post:(NSString *)url body:(NSDictionary *)body headers:(NSDictionary *)headers
                 resolver:(RCTPromiseResolveBlock)resolve
                 rejecter:(RCTPromiseRejectBlock)reject) {
  NSMutableDictionary *mutableBody = [body mutableCopy];
  [mutableBody setValue:headers forKey:@"__headers__"];
  body = [mutableBody copy];
  [[DFNetworkManager sharedInstance] requestFroJSONPost:url param:body callback:^(id jsonObj, NSError *error) {
    if (error) {
      reject(@(error.code).stringValue, error.description, error);
    } else {
      resolve(jsonObj);
    }
  }];
}

RCT_REMAP_METHOD(setRpcUrls,
                 setRpcUrls:(NSString *)eth :(NSString *)btc usdt:(NSString *)usdt
                 resolver:(RCTPromiseResolveBlock)resolve
                 rejecter:(RCTPromiseRejectBlock)reject) {
  
  if ([NSURL URLWithString:eth]) {
    [DFNetworkManager sharedInstance].ETHRPCURL = eth;
  }
  
  if ([NSURL URLWithString:btc]) {
    [DFNetworkManager sharedInstance].BTCRPCURL = btc;
  }
  
  if ([NSURL URLWithString:usdt]) {
    [DFNetworkManager sharedInstance].USDTRPCURL = usdt;
  }
  
  resolve(@(YES));

}

RCT_REMAP_METHOD(jsonrpc,
                 jsonrpc:(NSString *)url :(NSString *)method :(NSArray *)params :(NSDictionary *)headers
                 resolver:(RCTPromiseResolveBlock)resolve
                 rejecter:(RCTPromiseRejectBlock)reject) {
  
  [[DFNetworkManager sharedInstance] invokeMethod:method withParameters:params URL:url callback:^(id result, NSDictionary *resp, NSError *error) {
    if (error) {
      if (reject) {
        reject(@(error.code).stringValue, error.description, error);
      }
      return;
    }
    if (resolve) {
      resolve(resp);
    }
  }];
}
- (dispatch_queue_t)methodQueue {
  return dispatch_get_main_queue();
}
@end
