//
//  MFJSONResponseSerializer.m
//  rrwallet
//
//  Created by muhuai on 2017/12/28.
//  Copyright © 2017年 MH. All rights reserved.
//

#import "DFJSONResponseSerializer.h"

@implementation DFJSONResponseSerializer

#pragma mark - AFURLResponseSerialization

- (id)responseObjectForResponse:(NSURLResponse *)response
                           data:(NSData *)data
                          error:(NSError *__autoreleasing *)error {
    id responseObject = [super responseObjectForResponse:response data:data error:error];
    if ((*error).code == 3840) {
        NSString *str = [[NSString alloc] initWithData:data encoding:NSUTF8StringEncoding];
        NSString *DC4Hex = [NSString stringWithFormat:@"%c", 0x14];
        str = [str stringByReplacingOccurrencesOfString:DC4Hex withString:@""];
        *error = nil;
        responseObject = [super responseObjectForResponse:response data:[str dataUsingEncoding:NSUTF8StringEncoding] error:error];
        if ((*error).code == 3840) {
          if ([str hasPrefix:@"<"] && [str hasSuffix:@">"] && [response isKindOfClass:[NSHTTPURLResponse class]]) {
            NSHTTPURLResponse *httpResp = (NSHTTPURLResponse *)response;
            *error = [NSError errorWithDomain:NSURLErrorDomain code:httpResp.statusCode userInfo:@{NSLocalizedDescriptionKey: @(httpResp.statusCode)}];
            return str;
          }
          *error = nil;
          return str;
        }
    }
    return responseObject;
}
@end
