//
//  NSDictionary+MFCategory.h
//  rrwallet
//
//  Created by muhuai on 06/02/2017.
//  Copyright © 2017 MH. All rights reserved.
//

#import <Foundation/Foundation.h>
@interface NSDictionary(MFCategory)

- (id)mf_objectForKey:(id)aKey ofClass:(Class)aClass defaultObj:(id)defaultObj;

- (NSInteger)mf_integerValueForKey:(NSString *)key;
- (NSInteger)mf_integerValueForKey:(NSString *)key defaultValue:(NSInteger)defaultValue;

- (BOOL)mf_boolValueForKey:(NSString *)key;

- (NSString *)mf_stringValueForKey:(NSString *)key defaultValue:(NSString *)defaultValue;
- (NSString *)mf_stringValueForKey:(NSString *)key;

- (NSArray *)mf_arrayValueForKey:(NSString *)key defaultValue:(NSArray *)defaultValue;
- (NSArray *)mf_arrayValueForKey:(NSString *)key;

- (NSDictionary *)mf_dictionaryValueForKey:(NSString *)key defalutValue:(NSDictionary *)defaultValue;
- (NSDictionary *)mf_dictionaryValueForKey:(NSString *)key;

@end
