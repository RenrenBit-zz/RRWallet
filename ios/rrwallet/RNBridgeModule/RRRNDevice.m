//
//  DFRNDevice.m
//  rrwallet
//
//  Created by muhuai on 2018/3/1.
//  Copyright © 2018年 Facebook. All rights reserved.
//

#import "RRRNDevice.h"
#import <UIKit/UIKit.h>
#import <SAMKeychain/SAMKeychain.h>
#import <Sentry/SentryCrashDynamicLinker.h>
#import <AdSupport/AdSupport.h>

#define DEVICE_ID_ACCOUNT @"df_deviceID"
#define DEVICE_ID_SERVICE @"com.rrwallet.base"

@implementation RRRNDevice

RCT_EXPORT_MODULE();

- (dispatch_queue_t)methodQueue {
  return dispatch_get_main_queue();
}

RCT_REMAP_METHOD(deviceID,
                 deviceIDWithResolver:(RCTPromiseResolveBlock)resolve
                 rejecter:(RCTPromiseRejectBlock)reject) {
  NSString *uuid = [SAMKeychain passwordForService:DEVICE_ID_SERVICE account:DEVICE_ID_ACCOUNT];
  if (!uuid) {
      uuid = [UIDevice currentDevice].identifierForVendor.UUIDString;
      [SAMKeychain setPassword:uuid forService:DEVICE_ID_SERVICE account:DEVICE_ID_ACCOUNT];
  }
  
  resolve(uuid);
}

RCT_EXPORT_METHOD(keepScreenOn:(BOOL)on) {
  [UIApplication sharedApplication].idleTimerDisabled = on;
}

RCT_REMAP_METHOD(isJailbreak,
                  isJailbreakWithResolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject) {
  resolve(@{@"isJailbreak": @(sentrycrashdl_imageNamed("MobileSubstrate", false) != UINT32_MAX)});
}

RCT_EXPORT_METHOD(setScreenBrightness:(float)value) {
  [[UIScreen mainScreen] setBrightness:value];
}

RCT_REMAP_METHOD(getScreenBrightness,
                 getScreenBrightnessWithResolver:(RCTPromiseResolveBlock)resolve
                 rejecter:(RCTPromiseRejectBlock)reject) {
  CGFloat value = [UIScreen mainScreen].brightness;
  resolve(@(value));
}

- (NSDictionary *)constantsToExport {
  NSString *idfa = [[[ASIdentifierManager sharedManager] advertisingIdentifier] UUIDString];
  return @{
           @"OO0o0OO00O00oOO0o0": @(sentrycrashdl_imageNamed("MobileSubstrate", false) != UINT32_MAX),
           @"idfa": idfa? :@"0"
           };
}
@end
