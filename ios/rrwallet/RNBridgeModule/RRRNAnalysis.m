//
//  RRRNAnalysis.m
//  rrwallet
//
//  Created by muhuai on 2018/11/19.
//  Copyright © 2018 Facebook. All rights reserved.
//

#import "RRRNAnalysis.h"
#import <UMAnalytics/MobClick.h>

@implementation RRRNAnalysis
RCT_EXPORT_MODULE();

RCT_REMAP_METHOD(event, event:(NSString *)event attributes:(NSDictionary *)attributes) {
  if (attributes.count == 0) {
      [MobClick event:event];
  } else {
      [MobClick event:event attributes:attributes];
  }
}

RCT_REMAP_METHOD(counter, event:(NSString *)event attributes:(NSDictionary *)attributes counter:(NSString *)counter) {
  [MobClick event:event attributes:attributes counter:counter.intValue];
}

@end
