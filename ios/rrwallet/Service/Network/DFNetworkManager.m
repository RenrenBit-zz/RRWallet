//
//  MFNetworkManager.m
//  rrwallet
//
//  Created by muhuai on 16/7/19.
//  Copyright © 2016年 MH. All rights reserved.
//

#import "DFNetworkManager.h"
#import "DFSecurityPolicy.h"
#import "DFJSONResponseSerializer.h"
#import "DFHTTPRequestSerializer.h"
#import "NSDictionary+MFCategory.h"
#import <AFNetworking/AFNetworking.h>
#import <CocoaSecurity/CocoaSecurity.h>

@interface DFNetworkManager()

@property (nonatomic, strong) AFHTTPSessionManager *afManager;
@property (nonatomic, strong) NSString *appVersion;
@property (nonatomic, strong) NSString *osVersion;

@end
@implementation DFNetworkManager
+ (instancetype)sharedInstance {
    static DFNetworkManager *manager;
    static dispatch_once_t onceToken;
    dispatch_once(&onceToken, ^{
        manager = [[DFNetworkManager alloc] init];
        manager.appVersion = ({
          NSBundle *bundle = [NSBundle mainBundle];
          NSString *marketingVersionNumber = [bundle objectForInfoDictionaryKey:@"CFBundleShortVersionString"];
          marketingVersionNumber;
        });
        manager.osVersion = [[[UIDevice currentDevice] systemVersion] copy];
      
        manager.afManager = [[AFHTTPSessionManager alloc] initWithBaseURL:[NSURL URLWithString:@"https://"]];
        manager.afManager.requestSerializer = [[DFHTTPRequestSerializer alloc] init];
        manager.afManager.requestSerializer.timeoutInterval = 60.f;
        [manager.afManager.requestSerializer setValue:[NSString stringWithFormat:@"RRWallet/%@", manager.appVersion] forHTTPHeaderField:@"User-Agent"];
      
        NSData *bitrenren = [NSData dataWithContentsOfFile:[[NSBundle mainBundle] pathForResource:@"bitrenren_ssl" ofType:@"cer"]];
        NSString *bitrenrenSignature = [CocoaSecurity sha1WithData:[CocoaSecurity md5WithData:[CocoaSecurity sha256WithData:bitrenren].data].data].hex;
        if (![bitrenrenSignature isEqualToString:@"4273BCE52CA3F97EA347611BC40B064B1235187E"]) {
          exit(-1);
        }

#ifndef DEBUG
      manager.afManager.securityPolicy = [DFSecurityPolicy policyWithPinningMode:AFSSLPinningModePublicKey withPinnedCertificates:[NSSet setWithObjects:bitrenren, nil]];
#endif
      
        [manager.afManager.requestSerializer setValue:@"application/json" forHTTPHeaderField:@"Content-Type"];
        NSMutableSet *set = [[NSMutableSet alloc] initWithSet:manager.afManager.responseSerializer.acceptableContentTypes];
        [set addObject:@"text/plain"];
        [set addObject:@"text/html"];
        manager.afManager.responseSerializer = [DFJSONResponseSerializer serializer];
        manager.afManager.responseSerializer.acceptableContentTypes = set;
        
    });
    return manager;
}

- (NSURLSessionDataTask *)requestForJSONWithURL:(NSURL *)URL
                                          param:(id)param
                                       callback:(DFNetworkJSONCallback)callback {
    if (!URL) {
        return nil;
    }
  
    if (!param) {
        param = [[NSMutableDictionary alloc] init];
    }
    if ([param isKindOfClass:[NSDictionary class]]) {
        param = [param mutableCopy];
    }

    NSURLSessionDataTask *task = [_afManager GET:URL.absoluteString parameters:param progress:nil success:^(NSURLSessionDataTask * _Nonnull task, id  _Nullable responseObject) {
        if (callback) {
            callback(responseObject, nil);
        }
    } failure:^(NSURLSessionDataTask * _Nullable task, NSError * _Nonnull error) {
        error = [NSError errorWithDomain:error.domain? :NSURLErrorDomain code:error.code userInfo:({
            NSMutableDictionary *mutableUserInfo = error.userInfo.mutableCopy? :[[NSMutableDictionary alloc] initWithCapacity:2];
            [mutableUserInfo setValue:@"服务器开小差了,请稍后再试" forKey:@"errMsg"];
            [mutableUserInfo copy];
        })];
        if (callback) {
            callback(nil, error);
        }
    }];
    
    return task;
}

- (NSURLSessionDataTask *)requestFroJSONPost:(NSString *)url
                                       param:(NSDictionary *)param
                                    callback:(DFNetworkJSONCallback)callback {
  [self requestFroJSONPost:url param:param needRetry:NO callback:callback];
  return nil;
}

- (void)requestFroJSONPost:(NSString *)url
                                       param:(NSDictionary *)param
                                   needRetry:(BOOL)retry
                                    callback:(DFNetworkJSONCallback)callback {
  param = ({
    NSMutableDictionary *mutable = [param mutableCopy];
    [mutable setValue:@"json" forKey:@"post_type_df"];
    [mutable copy];
  });
  [_afManager POST:url parameters:param progress:nil success:^(NSURLSessionDataTask * _Nonnull task, id  _Nullable responseObject) {
    if (callback) {
      callback(responseObject, nil);
    }
  } failure:^(NSURLSessionDataTask * _Nullable task, NSError * _Nonnull error) {
    if (retry) {
      [self requestFroJSONPost:url param:param needRetry:NO callback:callback];
      return;
    }
    if (callback) {
      callback(nil, error);
    }
  }];
}

- (void)invokeMethod:(NSString *)method
      withParameters:(NSObject *)parameters
                 URL:(NSString *)url
            callback:(DFNetworkRPCCallback)callback {
  [self invokeMethod:method withParameters:parameters URL:url needRetry:NO callback:callback];
}

- (void)invokeMethod:(NSString *)method
      withParameters:(NSObject *)parameters
                 URL:(NSString *)url
           needRetry:(BOOL)retry
            callback:(DFNetworkRPCCallback)callback {
  static NSInteger requestId = 0;
  
  NSMutableDictionary *JSONRPCStruct = [[NSMutableDictionary alloc] initWithCapacity:4];
  [JSONRPCStruct setValue:@"2.0" forKey:@"jsonrpc"];
  [JSONRPCStruct setValue:method forKey:@"method"];
  [JSONRPCStruct setValue:parameters forKey:@"params"];
  [JSONRPCStruct setValue:@(requestId++) forKey:@"id"];
  
  [_afManager POST:url parameters:JSONRPCStruct progress:nil success:^(NSURLSessionDataTask * _Nonnull task, id  _Nullable responseObject) {
    NSInteger errorCode = 0;
    NSString *errorMessage = nil;
    
    if ([responseObject isKindOfClass:[NSDictionary class]]) {
      id result = [responseObject objectForKey:@"result"];
      id error = [responseObject objectForKey:@"error"];
      if (!error && result == [NSNull null]) {
        if (callback) {
          callback(nil, responseObject, nil);
        }
        return;
      }
      if (result && result != [NSNull null]) {
        if (callback) {
          callback(result, responseObject, nil);
        }
      } else if (error && error != [NSNull null]) {
        if ([error isKindOfClass:[NSDictionary class]] && [error objectForKey:@"code"] && [error objectForKey:@"message"]) {
          errorCode = [[error objectForKey:@"code"] intValue];
          errorMessage = [error objectForKey:@"message"];
        } else {
          errorMessage = @"Unknown error";
        }
      } else {
        errorMessage = @"Unknown json-rpc response";
      }
    } else {
      errorMessage = @"Unknown json-rpc response";
    }
    
    if (errorMessage && callback) {
      NSDictionary *userInfo = [NSDictionary dictionaryWithObjectsAndKeys:errorMessage, NSLocalizedDescriptionKey, nil];
      NSError *error = [NSError errorWithDomain:NSURLErrorDomain code:errorCode userInfo:userInfo];
      callback(nil, responseObject, error);
    }
  } failure:^(NSURLSessionDataTask * _Nullable task, NSError * _Nonnull error) {
    NSData *data = error.userInfo[AFNetworkingOperationFailingURLResponseDataErrorKey];
    NSError *jsonError = nil;
    NSDictionary *json = data? [NSJSONSerialization JSONObjectWithData:data options:NSJSONReadingAllowFragments error:&jsonError]: nil;
    NSDictionary *rpcError = json[@"error"];
    if ([rpcError isKindOfClass:[NSDictionary class]] && rpcError[@"message"]) {
      error = [NSError errorWithDomain:NSCocoaErrorDomain code:[rpcError[@"code"] integerValue] userInfo:@{NSLocalizedDescriptionKey: rpcError[@"message"]}];
    }
    
    if (retry) {
      [self invokeMethod:method withParameters:parameters URL:url needRetry:NO callback:callback];
      return;
    }
    if (callback) {
      callback(json, nil, error);
    }
  }];
}

- (NSMutableURLRequest *)requestWithURL:(NSURL *)url
                                 method:(NSString *)method
                                parameters:(NSObject *)parameters
{
  static NSInteger requestId = 0;
  
  NSString *charset = (NSString *)CFStringConvertEncodingToIANACharSetName(CFStringConvertNSStringEncodingToEncoding(NSUTF8StringEncoding));
  
  NSMutableURLRequest *request = [NSMutableURLRequest requestWithURL:url];
  [request setHTTPMethod:@"POST"];
  [request setValue:[NSString stringWithFormat:@"application/json; charset=%@", charset] forHTTPHeaderField:@"Content-Type"];
  
  NSMutableDictionary *JSONRPCStruct = [[NSMutableDictionary alloc] initWithCapacity:4];
  [JSONRPCStruct setValue:@"2.0" forKey:@"jsonrpc"];
  [JSONRPCStruct setValue:method forKey:@"method"];
  [JSONRPCStruct setValue:parameters forKey:@"params"];
  [JSONRPCStruct setValue:@(requestId++).stringValue forKey:@"id"];
  
  NSError *error = nil;
  NSData *JSONData = [NSJSONSerialization dataWithJSONObject:JSONRPCStruct options:0 error:&error];
  if (!error) {
    [request setHTTPBody:JSONData];
  }
  
  return request;
}
@end
