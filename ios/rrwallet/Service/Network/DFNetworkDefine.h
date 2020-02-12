//
//  DFNetworkDefine.h
//  MeiFan-iOS
//
//  Created by muhuai on 16/7/22.
//  Copyright © 2016年 MH. All rights reserved.
//

#import <Foundation/Foundation.h>

typedef void(^DFNetworkJSONCallback)(id jsonObj, NSError *error);
typedef void(^DFNetworkRPCCallback)(id result, NSDictionary *resp, NSError *error);

typedef enum : NSInteger {
    DFNetWorErrorCodeNotLoggedIn = 11,
} DFNetWorErrorCode;


extern NSString *const kDFNetworkErrorMsgUserInfoKey;
extern NSString *const kDFMainPageDomain;
extern NSString *const kDFAPIDomain;

@interface DFNetworkDefine : NSObject

+ (NSString *)baseURL;

@end
