//
//  RRRNSplash.m
//  rrwallet
//
//  Created by muhuai on 2018/12/19.
//  Copyright © 2018 Facebook. All rights reserved.
//

#import "RRRNSplash.h"
#import "RRSplashViewController.h"

NSString * const RRRNSplashIsFirstLaunch = @"RRRNSplashIsFirstLaunch__";

@interface RRRNSplash ()

@property (nonatomic, assign) BOOL isFirstLaunch;

@end

@implementation RRRNSplash


RCT_EXPORT_MODULE();

static UIWindow *window;
static UIWindow *backupKeyWindow;

- (instancetype)init {
  self = [super init];
  if (self) {
    self.isFirstLaunch = ![[NSUserDefaults standardUserDefaults] objectForKey:RRRNSplashIsFirstLaunch];
    [[NSUserDefaults standardUserDefaults] setObject:@(YES) forKey:RRRNSplashIsFirstLaunch];
  }
  return self;
}

- (BOOL)requiresMainQueueSetup {
  return YES;
}

- (dispatch_queue_t)methodQueue {
  return dispatch_get_main_queue();
}

+ (void)show {
  backupKeyWindow = [UIApplication sharedApplication].keyWindow;
  window = [[UIWindow alloc] initWithFrame:[UIScreen mainScreen].bounds];
  window.windowLevel = UIWindowLevelAlert + 1;
  BOOL isFirstLaunch = ![[NSUserDefaults standardUserDefaults] objectForKey:RRRNSplashIsFirstLaunch];
  isFirstLaunch = NO;
  window.rootViewController = [[RRSplashViewController alloc] initWithFirstLaunch:isFirstLaunch];
  
  window.hidden = NO;
  
}

RCT_EXPORT_METHOD(dismiss) {
  [UIView animateWithDuration:0.35f animations:^{
    window.alpha = 0.f;
  } completion:^(BOOL finished) {
    window.frame = CGRectZero;
    window.hidden = YES;
    window = nil;
    [backupKeyWindow makeKeyAndVisible];
    backupKeyWindow = nil;
  }];
}

- (NSDictionary *)constantsToExport {
  return @{
           @"isFirstLaunch": @(self.isFirstLaunch)
           };
}

@end
