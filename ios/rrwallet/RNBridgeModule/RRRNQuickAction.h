//
//  RRRNQuickAction.h
//  rrwallet
//
//  Created by muhuai on 2019/4/23.
//  Copyright © 2019 Facebook. All rights reserved.
//

#import <Foundation/Foundation.h>
#import <UIKit/UIKit.h>
#import <React/RCTEventEmitter.h>
NS_ASSUME_NONNULL_BEGIN

@interface RRRNQuickAction : RCTEventEmitter

+ (void)onQuickActionPress:(UIApplicationShortcutItem *) shortcutItem completionHandler:(void (^)(BOOL succeeded)) completionHandler;

@end

NS_ASSUME_NONNULL_END
