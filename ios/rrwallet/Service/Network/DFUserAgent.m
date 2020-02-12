//
//  DFUserAgent.m
//  rrwallet
//
//  Created by muhuai on 2018/3/5.
//  Copyright © 2018年 Facebook. All rights reserved.
//

#import "DFUserAgent.h"
#import <UIKit/UIKit.h>

@implementation DFUserAgent
static NSString *s_origAgent;
+ (void)registerUserAgent {
  NSString *ua = [self customUserAgent];
  
  NSDictionary *dictionary = [NSDictionary dictionaryWithObjectsAndKeys:ua, @"UserAgent", ua, @"User-Agent", ua, @"User_Agent", nil];
  [[NSUserDefaults standardUserDefaults] registerDefaults:dictionary];
}

+ (NSString *)customUserAgent {
  
  static dispatch_once_t onceToken;
  dispatch_once(&onceToken, ^{
    UIWebView *webView = [[UIWebView alloc] init];
    s_origAgent = [webView stringByEvaluatingJavaScriptFromString:@"navigator.userAgent"];
  });
  NSString *ua = [s_origAgent copy];
  NSBundle *bundle = [NSBundle bundleForClass:[self class]];
  
  NSString *marketingVersionNumber = [bundle objectForInfoDictionaryKey:@"CFBundleShortVersionString"];
  
  ua = [ua stringByAppendingFormat:@" RRWallet/%@", marketingVersionNumber];
  return ua;
}

@end
