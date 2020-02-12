//
//  DFBTCWallet.m
//  rrwallet
//
//  Created by muhuai on 2018/4/11.
//  Copyright © 2018年 Facebook. All rights reserved.
//

#import "DFBTCWallet.h"
#import "DFWallet.h"
#import "DFNetworkManager.h"
#import "NSDictionary+MFCategory.h"
#import <SAMKeychain/SAMKeychain.h>
#import <CocoaSecurity/CocoaSecurity.h>
#import <CocoaSecurity/Base64.h>
#import <CoreBitcoin/CoreBitcoin+Categories.h>
#import "DFHexCategory.h"
#import "RRBTCutxo.h"

#define KEYCHAIN_ACCOUNT @"com.dfund.account.keychain.btc"

@interface DFBTCWallet ()
  
@property (nonatomic, strong) BTCKeychain *keychain;
@property (nonatomic, strong) BTCKey *key;
@end

@implementation DFBTCWallet

- (NSDictionary *)toDictionary {
  NSMutableDictionary *dic = [[super toDictionary] mutableCopy];
  [dic setValue:self.address forKey:@"address"];
  
  [[NSUserDefaults standardUserDefaults] setObject:({
    NSMutableDictionary *mutable = [dic mutableCopy];
    [mutable removeObjectForKey:@"mnemonic"];
    mutable;
  }) forKey:self.walletID];
  
  return [dic copy];
}

- (instancetype)initWithDictionary:(NSDictionary *)dict {
  self = [super initWithDictionary:dict];
  if (self) {
    _address = [dict mf_stringValueForKey:@"address"];
    self.source = [dict mf_integerValueForKey:@"source"];
  }
  return self;
}
- (instancetype)init {
  self = [super init];
  if (self) {
    self.type = DFWalletTypeBitcoin;
  }
  
  return self;
}

- (instancetype)initWithMnemonic:(NSString *)mnemonic password:(NSString *)pwd name:(NSString *)name {
  self = [self init];
  
  NSArray *words = [mnemonic componentsSeparatedByString:@" "];
  if (words.count != 12 && words.count != 15) {
    return nil;
  }
  BTCMnemonicWordListType mnemonicWordType = BTCMnemonicWordListTypeEnglish;
  int wordChar = [mnemonic characterAtIndex:0];
  if (wordChar > 0x4e00 && wordChar < 0x9fff) {
    mnemonicWordType = BTCMnemonicWordListTypeChinese;
  }
  BTCMnemonic *btc = [[BTCMnemonic alloc] initWithWords:words password:nil wordListType:mnemonicWordType];
  
  if (!btc) {
    return nil;
  }
  
  if ([self isTestNet]) {
    _address = [[btc.keychain.bitcoinTestnetKeychain keychainForAccount:0] externalKeyAtIndex:0].addressTestnet.string;
  } else {
    _address = [[btc.keychain.bitcoinMainnetKeychain keychainForAccount:0] externalKeyAtIndex:0].compressedPublicKeyAddress.string;
  }
  
  _name = name;
  self.walletID = [self md5:_address];
  self.source = DFWalletSourceMnemonic;
  [self saveSeed:btc.dataWithSeed password:pwd];
  
  return self;
}

- (instancetype)initWithMnemonic:(NSString *)mnemonic {
  self = [self init];
  
  NSArray *words = [mnemonic componentsSeparatedByString:@" "];
  if (words.count != 12) {
    return nil;
  }
  BTCMnemonic *btc = [[BTCMnemonic alloc] initWithWords:words password:nil wordListType:BTCMnemonicWordListTypeEnglish];
  
  if (!btc) {
    return nil;
  }
  
  if ([self isTestNet]) {
    _address = [[btc.keychain.bitcoinTestnetKeychain keychainForAccount:0] externalKeyAtIndex:0].addressTestnet.string;
  } else {
    _address = [[btc.keychain.bitcoinMainnetKeychain keychainForAccount:0] externalKeyAtIndex:0].compressedPublicKeyAddress.string;
  }
  self.walletID = [self md5:_address];
  self.source = DFWalletSourceMnemonic;
  return self;
} 

- (instancetype)initWitPrivateKey:(NSString *)privatekey password:(NSString *)pwd {
  self = [self init];
  
  BTCPrivateKeyAddress *pk = [BTCPrivateKeyAddress addressWithString:privatekey];
  BTCKey *key = pk.key;
  
  if (!key) {
    return nil;
  }
  
  
  if ([self isTestNet]) {
    _address = key.addressTestnet.string;
  } else {
    _address = key.compressedPublicKeyAddress.string;
  }
  
  self.walletID = [self md5:_address];
  self.source = DFWalletSourcePrivateKey;
  
  [self saveSeed:privatekey.dataFromBase58 password:pwd];
  
  return self;
}

- (instancetype)initWithName:(NSString *)name password:(NSString *)pwd {
  self = [self init];
  BTCMnemonic *btc = [[BTCMnemonic alloc] initWithEntropy:BTCRandomDataWithLength(16) password:nil wordListType:BTCMnemonicWordListTypeEnglish];
  if ([self isTestNet]) {
    _address = [[btc.keychain.bitcoinTestnetKeychain keychainForAccount:0] externalKeyAtIndex:0].addressTestnet.string;
  } else {
    _address = [[btc.keychain.bitcoinMainnetKeychain keychainForAccount:0] externalKeyAtIndex:0].compressedPublicKeyAddress.string;
  }
  
  self.walletID = [self md5:_address];
  self.source = DFWalletSourceMnemonic;
  [self saveSeed:btc.dataWithSeed password:pwd];
//  CocoaSecurityResult *result = [CocoaSecurity aesEncrypt:BTCBase58CheckStringWithData(btc.dataWithSeed) key:pwd];
//  [SAMKeychain setPassword:result.base64 forService:KEYCHAIN_ACCOUNT account:self.walletID];
  
  
  return self;
}

- (NSString *)mnemonicWithPassword:(NSString *)pwd {
  if (!pwd.length) {
    return nil;
  }
  
  NSData *seed = [self seedWithPassword:pwd];
  BTCMnemonic *mnemonic = [[BTCMnemonic alloc] initWithData:seed];
  return [mnemonic.words componentsJoinedByString:@" "];
}

- (NSString *)getPrivateKeyWithPassword:(NSString *)pwd {
  NSString *pk = nil;
  
  if (![self unlock:pwd]) {
    return nil;
  }

  pk = [self isTestNet]? [self.key.privateKeyAddressTestnet.string copy]: [self.key.privateKeyAddress.string copy];
  
  [self lock];
  
  return pk;
}

- (NSString *)exportExtendedPublicKeyWithPath:(NSString *)path net:(NSInteger)net password:(NSString *)pwd {
  
  if (![self unlock:pwd net:net]) {
    return nil;
  }
  
  BTCKeychain *destKeychain = [self.keychain derivedKeychainWithPath:path];
  
  return destKeychain.extendedPublicKey;
}

- (void)lock {
  _keychain = nil;
  _key = nil;
}

- (BOOL)unlock:(NSString *)pwd {
  return [self unlock:pwd net:[self isTestNet]? 2: 1];
}

- (BOOL)unlock:(NSString *)pwd net:(NSInteger)net {
  BOOL success = NO;
  NSData *seed = [self seedWithPassword:pwd];
  
  if (!seed) {
    return NO;
  }
  
  switch (self.source) {
    case DFWalletSourceMnemonic: {
      BTCMnemonic *mnemonic = [[BTCMnemonic alloc] initWithData:seed];
      
      BTCKeychain *keychain = [[BTCKeychain alloc] initWithSeed:mnemonic.seed network: net == 2? [BTCNetwork testnet]: [BTCNetwork mainnet]];
      _keychain = [keychain copy];
      _key = net == 2? [[keychain.bitcoinTestnetKeychain keychainForAccount:0] externalKeyAtIndex:0]: [[keychain.bitcoinMainnetKeychain keychainForAccount:0] externalKeyAtIndex:0];
      _keychain = [keychain copy];
      success = !!_key;
      break;
    }
    case DFWalletSourcePrivateKey: {
      _key = [BTCPrivateKeyAddress addressWithString:seed.base58String].key;
      success = !!_key;
      break;
    }
    default:
    success = NO;
    break;
  }
  return success;
}

- (BOOL)isVaildPassword:(NSString *)pwd {
  return !![self seedWithPassword:pwd];
}

- (NSString *)md5:(NSString *)string{
  const char *cStr = [string UTF8String];
  unsigned char digest[CC_MD5_DIGEST_LENGTH];
  
  CC_MD5(cStr, (CC_LONG)strlen(cStr), digest);
  
  NSMutableString *result = [NSMutableString stringWithCapacity:CC_MD5_DIGEST_LENGTH * 2];
  for (int i = 0; i < CC_MD5_DIGEST_LENGTH; i++) {
    [result appendFormat:@"%02X", digest[i]];
  }
  
  return result;
}

- (NSArray<NSString *> *)fetchAddressesWithPaths:(NSArray<NSString *> *)paths
                               extendedPublicKey:(NSString *)extendedKey
                                            type:(NSInteger)type
                                             net:(NSInteger)net {
  BTCKeychain *keychain = [[BTCKeychain alloc] initWithExtendedKey:extendedKey];
  NSMutableArray *addresss = [[NSMutableArray alloc] initWithCapacity:paths.count];
  for (NSString *path in paths) {
    BTCKey *key = [keychain keyWithPath:path];
    NSString *address;
    switch (type) {
      case 1:
        address = net == 2? key.addressTestnet.string: key.address.string;
        break;
      case 2:
        address = net == 2? key.scriptHashAddressTestnet.string: key.scriptHashAddress.string;
        break;
    }
    [addresss addObject:address];
  }
  
  return [addresss copy];
}

#pragma mark - transaction

- (void)sendRawTransaction:(NSArray<RRBTCutxo *> *)utxos
                outputs:(NSArray *)outputs
                    net:(NSInteger)net
               password:(NSString *)pwd
             completion:(void (^)(NSDictionary *result, NSError *error))completion {
  BTCTransaction *tx = [[BTCTransaction alloc] init];
  utxos = ({
    NSMutableArray *arr = [[NSMutableArray alloc] initWithCapacity:utxos.count];
    [utxos enumerateObjectsUsingBlock:^(id  _Nonnull obj, NSUInteger idx, BOOL * _Nonnull stop) {
      [arr addObject:[[RRBTCutxo alloc] initWithDictionary:obj]];
    }];
    [arr copy];
  });
  NSData *seed = [self seedWithPassword:pwd];
  BTCMnemonic *mnemonic = [[BTCMnemonic alloc] initWithData:seed];
  
  if (!mnemonic) {
    if (completion) {
      completion(nil, [NSError errorWithDomain:NSCocoaErrorDomain code:-10001 userInfo:@{NSLocalizedDescriptionKey: @"密码错误"}]);
    }
    return;
  }
  
  for (RRBTCutxo *utxo in utxos) {
    BTCTransactionInput *input = [[BTCTransactionInput alloc] init];
    input.previousIndex = (uint32_t)utxo.vout;
    input.previousHash = BTCReversedData(BTCDataFromHex(utxo.txid));
    
    [tx addInput:input];
  }
  
  for (NSDictionary *dict in outputs) {
    BTCAmount amount = (BTCAmount)[dict mf_integerValueForKey:@"satoshis"];
    BTCAddress *address;
    NSString *addressStr = [dict mf_stringValueForKey:@"address"];
    if ([addressStr hasPrefix:@"3"] || [addressStr hasPrefix:@"2"]) {
      address = net == 2? [BTCScriptHashAddressTestnet addressWithString:addressStr]: [BTCScriptHashAddress addressWithString:addressStr];
    } else {
      address = net ==2? [BTCPublicKeyAddressTestnet addressWithString:addressStr]: [BTCPublicKeyAddress addressWithString:addressStr];
    }
    
    BTCTransactionOutput *output = [[BTCTransactionOutput alloc] initWithValue:amount address:address];
    [tx addOutput:output];
  }
  
  for (int i = 0; i < tx.inputs.count; i++) {
    RRBTCutxo *utxo = utxos[i];
    
    NSData *txHash = utxo.rawSigHash? BTCDataFromHex(utxo.rawSigHash): [tx signatureHashForScript:utxo.script inputIndex:i hashType:utxo.sigHashType error:nil];
    BTCKey *key = [mnemonic.keychain keyWithPath:utxo.path];
    NSData *sigData = [key signatureForHash:txHash hashType:utxo.sigHashType];
    BTCTransactionInput* input = tx.inputs[i];
    BTCScript *signatureScript = [[BTCScript alloc] init];
    [signatureScript appendData:sigData];
    [signatureScript appendData:key.publicKey];
    
    input.signatureScript = signatureScript;
  }
  
  if (completion) {
    completion(@{
                 @"txid": tx.transactionID,
                 @"rawData": BTCHexFromData(tx.data)
                 }, nil);
  }
}

- (void)signHash:(NSString *)hash
        hashType:(NSInteger)sigHashType
            path:(NSString *)path
        password:(NSString *)pwd
      completion:(void (^)(NSString *result, NSError *error))completion {
  
  NSData *seed = [self seedWithPassword:pwd];
  BTCMnemonic *mnemonic = [[BTCMnemonic alloc] initWithData:seed];
  
  if (!mnemonic) {
    if (completion) {
      completion(nil, [NSError errorWithDomain:NSCocoaErrorDomain code:-10001 userInfo:@{NSLocalizedDescriptionKey: @"密码错误"}]);
    }
    return;
  }
  
  BTCKey *key = [mnemonic.keychain keyWithPath:path];
  NSData *hashData = BTCDataFromHex(hash);
  NSData *sigData = [key signatureForHash:hashData hashType:sigHashType];
  
  if (completion) {
    completion(BTCHexFromData(sigData), nil);
  }
  
}

+ (NSArray<NSString *> *)generatePublickKeys:(NSString *)extendedKey paths:(NSArray<NSString *> *)paths {
  BTCKeychain *keychain = [[BTCKeychain alloc] initWithExtendedKey:extendedKey];
  NSMutableArray *publicKeys = [[NSMutableArray alloc] initWithCapacity:paths.count];
  for (NSString *path in paths) {
    BTCKey *key = [keychain keyWithPath:path];
    NSData *publicKey = key.publicKey;
    NSString *hex = BTCHexFromData(publicKey);
    if (hex.length > 0) {
      [publicKeys addObject:hex];
    }
  }
  
  return [publicKeys copy];
}

- (BOOL)isTestNet {
  return [DFNetworkManager sharedInstance].env == DFNetworkEnvDebug;
}
@end
