//
//  MFNetworkManager.h
//  rrwallet
//
//  Created by muhuai on 16/7/19.
//  Copyright © 2016年 MH. All rights reserved.
//

#import <Foundation/Foundation.h>
#import <UIKit/UIKit.h>
#import "DFNetworkDefine.h"

typedef NS_ENUM(NSUInteger, DFNetworkEnv) {
  DFNetworkEnvRelease = 0,
  DFNetworkEnvDebug = 1
};

@interface DFNetworkManager : NSObject

@property (nonatomic, strong) NSString *BTCRPCURL;
@property (nonatomic, strong) NSString *ETHRPCURL;
@property (nonatomic, strong) NSString *USDTRPCURL;
@property (nonatomic, assign) DFNetworkEnv env;

+ (instancetype)sharedInstance;

- (NSURLSessionDataTask *)requestForJSONWithURL:(NSURL *)URL
                                          param:(id)param
                                       callback:(DFNetworkJSONCallback)callback;

- (NSURLSessionDataTask *)requestFroJSONPost:(NSString *)url
                                       param:(NSDictionary *)param
                                    callback:(DFNetworkJSONCallback)callback;

- (NSURLSessionDataTask *)requestFroKVPost:(NSURL *)URL
                                       param:(NSDictionary *)param
                                    callback:(DFNetworkJSONCallback)callback;

- (void)invokeMethod:(NSString *)method
      withParameters:(NSObject *)parameters
                 URL:(NSString *)url
            callback:(DFNetworkRPCCallback)callback;
@end
