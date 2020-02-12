//
//  RRSplashViewController.m
//  rrwallet
//
//  Created by muhuai on 2018/12/19.
//  Copyright © 2018 Facebook. All rights reserved.
//

#import "RRSplashViewController.h"

@interface RRSplashViewController ()

@property (nonatomic, strong) UIImageView *logo;
@property (nonatomic, assign) BOOL isFirstLaunch;

@end

@implementation RRSplashViewController

- (instancetype)initWithFirstLaunch:(BOOL)isFirstLaunch {
  self = [super init];
  if (self) {
    self.isFirstLaunch = isFirstLaunch;
  }
  return self;
}

- (void)viewDidLoad {
  [super viewDidLoad];
  
  CGSize window = self.view.frame.size;
  
  self.view.backgroundColor = [UIColor colorWithRed:255.f / 255 green:255.f / 255 blue:255.f / 255 alpha:1.f];
  
  if (self.isFirstLaunch) {
  } else {
    self.logo = [[UIImageView alloc] initWithImage:[UIImage imageNamed:@"splash_logo"]];
    self.logo.frame = CGRectMake((window.width - self.logo.frame.size.width) / 2, (window.height - self.logo.frame.size.height) / 2 - 100, self.logo.frame.size.width, self.logo.frame.size.height);
    
    [self.view addSubview:self.logo];
  }
}

- (UIStatusBarStyle)preferredStatusBarStyle{
  return UIStatusBarStyleLightContent;
}
@end
