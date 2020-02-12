//
//  DFHexCategory.m
//  rrwallet
//
//  Created by muhuai on 2018/3/3.
//  Copyright © 2018年 Facebook. All rights reserved.
//

#import "DFHexCategory.h"
#import <CoreBitcoin/BTCData.h>

NSData* MFDataFromHex(NSString* hex, NSInteger byteLength) {
  if (hex.length % 2 != 0) {
    hex = [@"0" stringByAppendingString:hex];
  }
  return [BTCDataFromHex(hex) df_fillToLength:byteLength];
}

@implementation NSData(df_hex)

+ (instancetype)df_dataWithHexString:(NSString *)hex {
  if (!hex.length) {
    return nil;
  }
  if ([hex.lowercaseString hasPrefix:@"0x"]) {
    hex = [hex substringFromIndex:2];
  }
  char buf[3];
  buf[2] = '\0';
  NSAssert(0 == [hex length] % 2, @"Hex strings should have an even number of digits (%@)", hex);
  unsigned char *bytes = malloc([hex length]/2);
  unsigned char *bp = bytes;
  for (CFIndex i = 0; i < [hex length]; i += 2) {
    buf[0] = [hex characterAtIndex:i];
    buf[1] = [hex characterAtIndex:i+1];
    char *b2 = NULL;
    *bp++ = strtol(buf, &b2, 16);
    NSAssert(b2 == buf + 2, @"String should be all hex digits: %@ (bad digit around %ld)", hex, i);
  }
  
  return [NSData dataWithBytesNoCopy:bytes length:[hex length]/2 freeWhenDone:YES];
}

- (NSData *)df_fillToLength:(NSInteger)length {
  if (self.length >= length) {
    return self;
  }
  
  NSInteger offset = length - self.length;
  uint8_t data[offset];
  for (int i = 0; i < offset; i++) {
    data[i] = 0;
  }
  
  NSMutableData *mutableData = [[NSMutableData alloc] initWithCapacity:length];
  [mutableData appendBytes:data length:offset];
  [mutableData appendData:self];
  return [mutableData copy];
}

- (NSString *)df_hexString {
  if (self.length == 0) {
    return nil;
  }
  
  NSMutableString *hex = [[NSMutableString alloc] initWithCapacity:(self.length * 2 + 2)];
  [hex appendString:@"0x"];
  
  const uint8_t *bytes = self.bytes;
  for (int i = 0; i < self.length; i++) {
    [hex appendFormat:@"%02x", bytes[i]];
  }
  
  return [hex copy];
}

@end

@implementation NSString(df_hex)

- (NSInteger)df_hexToInt {
  
  unsigned int hexInt = 0;
  NSScanner *scanner = [NSScanner scannerWithString:self];
  
  [scanner setCharactersToBeSkipped:[NSCharacterSet characterSetWithCharactersInString:@"#"]];
  [scanner scanHexInt:&hexInt];
  
  return hexInt;
}

@end
