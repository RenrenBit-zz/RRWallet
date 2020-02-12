//
//  RCCTabBarController+Swizzle.m
//  rrwallet
//
//  Created by muhuai on 2018/3/23.
//  Copyright © 2018年 Facebook. All rights reserved.
//

#import "RCCTabBarController+Swizzle.h"
#import <React/RCTUtils.h>

@implementation RCCTabBarController (Swizzle)

+ (void)load {
  static dispatch_once_t onceToken;
  dispatch_once(&onceToken, ^{
    RCTSwapInstanceMethods([RCCTabBarController class], @selector(initWithProps:children:globalProps:bridge:), @selector(mf_initWithProps:children:globalProps:bridge:));
  });
}

- (instancetype)mf_initWithProps:(NSDictionary *)props children:(NSArray *)children globalProps:(NSDictionary *)globalProps bridge:(RCTBridge *)bridge {
  [self mf_initWithProps:props children:children globalProps:globalProps bridge:bridge];
  
  for (UIViewController *controller in self.viewControllers) {
    if (controller.tabBarItem.selectedImage) {
      controller.tabBarItem.selectedImage = [controller.tabBarItem.selectedImage imageWithRenderingMode:UIImageRenderingModeAlwaysOriginal];
    }
    if (controller.tabBarItem.image) {
      controller.tabBarItem.image = [controller.tabBarItem.image imageWithRenderingMode:UIImageRenderingModeAlwaysOriginal];
    }
  }
  
  self.tabBar.backgroundImage = [UIImage new];
  self.tabBar.shadowImage = [UIImage new];
  
  self.tabBar.layer.shadowColor = [UIColor blackColor].CGColor;
  self.tabBar.layer.shadowOffset = CGSizeMake(0, -4);
  self.tabBar.layer.shadowOpacity = 0.04;
  self.tabBar.layer.shadowRadius = 3;
  
  return self;
}
@end
