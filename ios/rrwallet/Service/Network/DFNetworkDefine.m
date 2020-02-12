//
//  DFNetworkDefine.m
//  MeiFan-iOS
//
//  Created by muhuai on 16/9/17.
//  Copyright © 2016年 MH. All rights reserved.
//

#import "DFNetworkDefine.h"
#define MF_URL(urlstr) [NSURL URLWithString:[[self baseURL] stringByAppendingString:urlstr]];

NSString *const kDFNetworkErrorMsgUserInfoKey = @"errMsg";

@implementation DFNetworkDefine

+ (NSString *)baseURL {
#if (defined DEBUG) || (defined INHOUSE)
    return @"http://pre.api.meifanapp.com";
#endif
    return @"https://api.meifanapp.com";
}
@end
