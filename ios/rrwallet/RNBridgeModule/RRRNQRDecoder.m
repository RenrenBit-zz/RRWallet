//
//  DFRNQRDecoder.m
//  rrwallet
//
//  Created by 杨然 on 2018/10/31.
//  Copyright © 2018 Facebook. All rights reserved.
//

#import "RRRNQRDecoder.h"
#import <UIKit/UIKit.h>
#import <CoreImage/CoreImage.h>

@implementation RRRNQRDecoder

RCT_EXPORT_MODULE();

RCT_REMAP_METHOD(decode, decode:(NSString *)path WithResolver:(RCTPromiseResolveBlock)resolve
                 rejecter:(RCTPromiseRejectBlock)reject) {
  UIImage *pickImage = [[UIImage alloc] initWithContentsOfFile:[path stringByReplacingOccurrencesOfString:@"file://" withString:@""]];
  NSData *imageData = UIImagePNGRepresentation(pickImage);
  CIImage *ciImage = [CIImage imageWithData:imageData];
  CIContext *context = [CIContext contextWithOptions:@{kCIContextUseSoftwareRenderer : @(YES)}]; // 软件渲染
  CIDetector *detector = [CIDetector detectorOfType: CIDetectorTypeQRCode context:context options: @{CIDetectorAccuracy : CIDetectorAccuracyLow}];
  
  NSArray *feature = [detector featuresInImage:ciImage];
  if (feature.count) {
    resolve(((CIQRCodeFeature *)feature[0]).messageString);
  } else {
    reject(@"-100", @"未识别到二维码", [NSError errorWithDomain:NSURLErrorDomain code:-100 userInfo:@{NSLocalizedDescriptionKey: @"未识别到二维码"}]);
  }
}

@end
