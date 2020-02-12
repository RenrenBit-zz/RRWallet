//
//  RCTStatusBarManager+Swizzle.m
//  rrwallet
//
//  Created by muhuai on 2018/8/4.
//  Copyright © 2018 Facebook. All rights reserved.
//

#import "RCTStatusBarManager+Swizzle.h"
#import <React/RCTUtils.h>

@implementation RCTStatusBarManager (Swizzle)

+ (void)load {
  static dispatch_once_t onceToken;
  dispatch_once(&onceToken, ^{
    RCTSwapInstanceMethods([RCTStatusBarManager class], @selector(setStyle:animated:), @selector(df_setStyle:animated:));
    RCTSwapInstanceMethods([RCTStatusBarManager class], @selector(setHidden:withAnimation:), @selector(df_setHidden:withAnimation:));
  });
}

- (void)df_setStyle:(UIStatusBarStyle)statusBarStyle animated:(BOOL)animated {
  [RCTSharedApplication() setStatusBarStyle:statusBarStyle animated:animated];
}

- (void)df_setHidden:(BOOL)hidden withAnimation:(UIStatusBarAnimation)animation {
  [RCTSharedApplication() setStatusBarHidden:hidden withAnimation:animation];
}
@end
