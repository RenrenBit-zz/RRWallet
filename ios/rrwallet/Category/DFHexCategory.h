//
//  DFHexCategory.h
//  rrwallet
//
//  Created by muhuai on 2018/3/3.
//  Copyright © 2018年 Facebook. All rights reserved.
//

#import <Foundation/Foundation.h>

NSData* MFDataFromHex(NSString* hex, NSInteger byteLength);
@interface NSData(df_hex)

+ (instancetype)df_dataWithHexString:(NSString *)hex;

- (NSString *)df_hexString;

- (NSData *)df_fillToLength:(NSInteger)length;

@end

@interface NSString(df_hex)

- (NSInteger)df_hexToInt;

@end
