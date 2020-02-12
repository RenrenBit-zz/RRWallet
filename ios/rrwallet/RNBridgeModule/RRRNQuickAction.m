//
//  RRRNQuickAction.m
//  rrwallet
//
//  Created by muhuai on 2019/4/23.
//  Copyright © 2019 Facebook. All rights reserved.
//

#import "RRRNQuickAction.h"
#import <React/RCTUtils.h>

NSString *const RCTShortcutItemClicked = @"ShortcutItemClicked";

NSDictionary *RNQuickAction(UIApplicationShortcutItem *item) {
  if (!item) return nil;
  return @{
           @"type": item.type,
           @"title": item.localizedTitle,
           @"userInfo": item.userInfo ?: @{}
           };
}

@interface RRRNQuickAction ()

@property (nonatomic, strong) NSDictionary *initialAction;

@end


@implementation RRRNQuickAction

RCT_EXPORT_MODULE();

- (instancetype)init {
  if ((self = [super init])) {
    [[NSNotificationCenter defaultCenter] addObserver:self
                                             selector:@selector(handleQuickActionPress:)
                                                 name:RCTShortcutItemClicked
                                               object:nil];
  }
  return self;
}

- (void)dealloc {
  [[NSNotificationCenter defaultCenter] removeObserver:self];
}

- (dispatch_queue_t)methodQueue {
  return dispatch_get_main_queue();
}

+ (BOOL)requiresMainQueueSetup {
  return YES;
}

- (NSArray<NSString *> *)supportedEvents {
  return @[@"quickActionShortcut"];
}

- (void)handleQuickActionPress:(NSNotification *)notification {
  [self sendEventWithName:@"quickActionShortcut" body:notification.userInfo];
}

+ (void)onQuickActionPress:(UIApplicationShortcutItem *) shortcutItem completionHandler:(void (^)(BOOL succeeded)) completionHandler {
  [[NSNotificationCenter defaultCenter] postNotificationName:RCTShortcutItemClicked
                                                      object:self
                                                    userInfo:RNQuickAction(shortcutItem)];
  
  completionHandler(YES);
}

RCT_REMAP_METHOD(getInitialAction,
                 getInitialActionWithResolver:(RCTPromiseResolveBlock)resolve
                                     rejecter:(RCTPromiseRejectBlock)reject) {
  UIApplicationShortcutItem *item = self.bridge.launchOptions[UIApplicationLaunchOptionsShortcutItemKey];
  resolve(RCTNullIfNil(RNQuickAction(item)));
  return;
}
@end
