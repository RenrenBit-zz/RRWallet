//
//  DFHTTPRequestSerializer.m
//  rrwallet
//
//  Created by muhuai on 2018/3/1.
//  Copyright © 2018年 Facebook. All rights reserved.
//

#import "DFHTTPRequestSerializer.h"

@implementation DFHTTPRequestSerializer

+ (instancetype)serializer {
  DFHTTPRequestSerializer *serializer = [[DFHTTPRequestSerializer alloc] init];
  serializer.timeoutInterval = 60.f;
  return serializer;
}
- (NSURLRequest *)requestBySerializingRequest:(NSURLRequest *)request
                               withParameters:(id)parameters
                                        error:(NSError *__autoreleasing  _Nullable *)error {
  
  if ([parameters isKindOfClass:[NSDictionary class]]) {
    NSDictionary *headers = [(NSDictionary *)parameters objectForKey:@"__headers__"];
    if ([headers isKindOfClass:[NSDictionary class]]) {
      NSMutableURLRequest *mutableReq = [request mutableCopy];
      [headers enumerateKeysAndObjectsUsingBlock:^(id  _Nonnull key, id  _Nonnull obj, BOOL * _Nonnull stop) {
        if ([key isKindOfClass:[NSString class]]) {
            [mutableReq setValue:obj forHTTPHeaderField:key];
        }
      }];
      request = [mutableReq copy];
      NSMutableDictionary *mutableParams = [parameters mutableCopy];
      [mutableParams removeObjectForKey:@"__headers__"];
      parameters = [mutableParams copy];
    }
  }
  if ([request.HTTPMethod isEqualToString:@"POST"] && ([parameters isKindOfClass:[NSDictionary class]])) {
    
    if ([[parameters objectForKey:@"post_type_df"] isEqualToString:@"json"] || [parameters objectForKey:@"jsonrpc"]) {
      
      parameters = [parameters mutableCopy];
      [parameters removeObjectForKey:@"post_type_df"];
      
      NSMutableURLRequest *mutableReq = [request mutableCopy];
//      mutableReq.allHTTPHeaderFields = [self.HTTPRequestHeaders copy];
      [mutableReq setValue:@"application/json" forHTTPHeaderField:@"Content-Type"];
      
      NSError *error = nil;
      NSData *JSONData = [NSJSONSerialization dataWithJSONObject:parameters options:0 error:&error];
      if (!error) {
        [mutableReq setHTTPBody:JSONData];
      }
      
      return [mutableReq copy];
      
    }
  }
  return [super requestBySerializingRequest:request withParameters:parameters error:error];
}
@end
