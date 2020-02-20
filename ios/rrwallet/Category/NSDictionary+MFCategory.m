//
//  NSDictionary+MFCategory.m
//  rrwallet
//
//  Created by muhuai on 06/02/2017.
//  Copyright © 2017 MH. All rights reserved.
//

#import "NSDictionary+MFCategory.h"

@implementation NSDictionary(MFCategory)

- (id)mf_objectForKey:(id)aKey ofClass:(Class)aClass defaultObj:(id)defaultObj {
    id obj = [self objectForKey:aKey];
    return (obj && [obj isKindOfClass:aClass]) ? obj : defaultObj;
}

- (BOOL)mf_boolValueForKey:(NSString *)key {
    return [self mf_integerValueForKey:key defaultValue:0] != 0;
}

- (int)intValueForKey:(NSString *)key defaultValue:(int)defaultValue {
    id value = [self objectForKey:key];
    if (value && [value isKindOfClass:[NSString class]]) {
        return [(NSString *)value intValue];
    }
    return (value && [value isKindOfClass:[NSNumber class]]) ? [value intValue] : defaultValue;
}

- (NSInteger)mf_integerValueForKey:(NSString *)key defaultValue:(NSInteger)defaultValue {
    id value = [self objectForKey:key];
    if (value && [value isKindOfClass:[NSString class]]) {
        return [(NSString *)value integerValue];
    }
    return (value && [value isKindOfClass:[NSNumber class]]) ? [value integerValue] : defaultValue;
}

- (NSInteger)mf_integerValueForKey:(NSString *)key {
    return [self mf_integerValueForKey:key defaultValue:0];
}

- (NSString *)mf_stringValueForKey:(NSString *)key defaultValue:(NSString *)defaultValue {
    id value = [self objectForKey:key];
    if (value && [value isKindOfClass:[NSString class]]) {
        return value;
    }else if(value && [value isKindOfClass:[NSNumber class]]){
        return [value stringValue];
    }else{
        return defaultValue;
    }
}

- (NSString *)mf_stringValueForKey:(NSString *)key {
    return [self mf_stringValueForKey:key defaultValue:nil];
}

- (NSArray *)mf_arrayValueForKey:(NSString *)key defaultValue:(NSArray *)defaultValue {
    id value = [self objectForKey:key];
    return (value && [value isKindOfClass:[NSArray class]]) ? value : defaultValue;
}

- (NSArray *)mf_arrayValueForKey:(NSString *)key {
    return  [self mf_arrayValueForKey:key defaultValue:nil];
}

- (NSDictionary *)mf_dictionaryValueForKey:(NSString *)key defalutValue:(NSDictionary *)defaultValue {
    id value = [self objectForKey:key];
    return (value && [value isKindOfClass:[NSDictionary class]]) ? value : defaultValue;
}

- (NSDictionary *)mf_dictionaryValueForKey:(NSString *)key {
    return [self mf_dictionaryValueForKey:key defalutValue:nil];
}
@end
