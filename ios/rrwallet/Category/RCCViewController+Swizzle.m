//
//  RCCViewController+Swizzle.m
//  rrwallet
//
//  Created by muhuai on 2018/8/3.
//  Copyright © 2018 Facebook. All rights reserved.
//

#import "RCCViewController+Swizzle.h"
#import <React/RCTUtils.h>

@implementation RCCViewController (Swizzle)

+ (void)load {
  static dispatch_once_t onceToken;
  dispatch_once(&onceToken, ^{
    RCTSwapInstanceMethods([RCCViewController class], @selector(gestureRecognizer:shouldRecognizeSimultaneouslyWithGestureRecognizer:), @selector(rr_gestureRecognizer:shouldRecognizeSimultaneouslyWithGestureRecognizer:));
     RCTSwapInstanceMethods([RCCViewController class], @selector(preferredStatusBarStyle), @selector(rr_preferredStatusBarStyle));
  });
}

-(BOOL)rr_gestureRecognizer:(UIGestureRecognizer *)gestureRecognizer shouldRecognizeSimultaneouslyWithGestureRecognizer:(UIGestureRecognizer *)otherGestureRecognizer{
  if ([self rr_gestureRecognizer:gestureRecognizer shouldRecognizeSimultaneouslyWithGestureRecognizer:otherGestureRecognizer]) {
    if ([otherGestureRecognizer.view isKindOfClass:NSClassFromString(@"RCTCustomScrollView")] && otherGestureRecognizer.state == UIGestureRecognizerStateBegan) {
      [otherGestureRecognizer requireGestureRecognizerToFail:gestureRecognizer];
      return NO;
    }
    return YES;
  }
  return NO;
}

- (UIStatusBarStyle)rr_preferredStatusBarStyle {
  UIStatusBarStyle style = [self rr_preferredStatusBarStyle];
  if (style == UIStatusBarStyleDefault) {
    if (@available(iOS 13.0, *)) {
      return UIStatusBarStyleDarkContent;
    }
  }
  return style;
}
@end
