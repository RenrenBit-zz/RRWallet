#include <jni.h>


#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <unistd.h>


const char HexCode[] = {'0', '1', '2', '3', '4', '5', '6', '7', '8', '9', 'A', 'B', 'C', 'D', 'E',
                        'F'};
const char *sha1final = "29CE47E4B0E095845C1F0326A773B792";

void exitApplication(JNIEnv *env, jint flag) {
    jclass temp_clazz = NULL;
    jmethodID mid_static_method;
    // 1、从classpath路径下搜索ClassMethod这个类，并返回该类的Class对象
    temp_clazz = (*env)->FindClass(env, "java/lang/System");
    mid_static_method = (*env)->GetStaticMethodID(env, temp_clazz, "exit", "(I)V");
    (*env)->CallStaticVoidMethod(env, temp_clazz, mid_static_method, flag);
    (*env)->DeleteLocalRef(env, temp_clazz);
}

jobject getApplication(JNIEnv *env) {
    jclass localClass = (*env)->FindClass(env, "android/app/ActivityThread");
    if (localClass != NULL) {
        // LOGI("class have find");
        jmethodID getapplication = (*env)->GetStaticMethodID(env, localClass, "currentApplication",
                                                             "()Landroid/app/Application;");
        if (getapplication != NULL) {
            jobject application = (*env)->CallStaticObjectMethod(env, localClass, getapplication);
            return application;
        }
        return NULL;
    }
    return NULL;
}


void init(JNIEnv *env, jobject thiz) {
    //获取到Context
    jobject context = getApplication(env);
    jclass activity = (*env)->GetObjectClass(env, context);
    // 得到 getPackageManager 方法的 ID
    jmethodID methodID_func = (*env)->GetMethodID(env, activity, "getPackageManager",
                                                  "()Landroid/content/pm/PackageManager;");
    // 获得PackageManager对象
    jobject packageManager = (*env)->CallObjectMethod(env, context, methodID_func);
    jclass packageManagerclass = (*env)->GetObjectClass(env, packageManager);
    //得到 getPackageName 方法的 ID
    jmethodID methodID_pack = (*env)->GetMethodID(env, activity, "getPackageName",
                                                  "()Ljava/lang/String;");
    //获取包名
    jstring name_str = (jstring) ((*env)->CallObjectMethod(env, context, methodID_pack));
    // 得到 getPackageInfo 方法的 ID
    jmethodID methodID_pm = (*env)->GetMethodID(env, packageManagerclass, "getPackageInfo",
                                                "(Ljava/lang/String;I)Landroid/content/pm/PackageInfo;");
    // 获得应用包的信息
    jobject package_info = (*env)->CallObjectMethod(env, packageManager, methodID_pm, name_str, 64);
    // 获得 PackageInfo 类
    jclass package_infoclass = (*env)->GetObjectClass(env, package_info);
    // 获得签名数组属性的 ID
    jfieldID fieldID_signatures = (*env)->GetFieldID(env, package_infoclass, "signatures",
                                                     "[Landroid/content/pm/Signature;");
    // 得到签名数组，待修改
    jobject signatur = (*env)->GetObjectField(env, package_info, fieldID_signatures);
    jobjectArray signatures = (jobjectArray) (signatur);
    // 得到签名
    jobject signature = (*env)->GetObjectArrayElement(env, signatures, 0);
    // 获得 Signature 类，待修改
    jclass signature_clazz = (*env)->GetObjectClass(env, signature);
    //---获得签名byte数组
    jmethodID tobyte_methodId = (*env)->GetMethodID(env, signature_clazz, "toByteArray", "()[B");
    jbyteArray signature_byte = (jbyteArray) (*env)->CallObjectMethod(env, signature,
                                                                      tobyte_methodId);
    //把byte数组转成流
    jclass byte_array_input_class = (*env)->FindClass(env, "java/io/ByteArrayInputStream");
    jmethodID init_methodId = (*env)->GetMethodID(env, byte_array_input_class, "<init>", "([B)V");
    jobject byte_array_input = (*env)->NewObject(env, byte_array_input_class, init_methodId,
                                                 signature_byte);
    //实例化X.509
    jclass certificate_factory_class = (*env)->FindClass(env,
                                                         "java/security/cert/CertificateFactory");
    jmethodID certificate_methodId = (*env)->GetStaticMethodID(env, certificate_factory_class,
                                                               "getInstance",
                                                               "(Ljava/lang/String;)Ljava/security/cert/CertificateFactory;");
    jstring x_509_jstring = (*env)->NewStringUTF(env, "X.509");
    jobject cert_factory = (*env)->CallStaticObjectMethod(env, certificate_factory_class,
                                                          certificate_methodId, x_509_jstring);
    //certFactory.generateCertificate(byteIn);
    jmethodID certificate_factory_methodId = (*env)->GetMethodID(env, certificate_factory_class,
                                                                 "generateCertificate",
                                                                 ("(Ljava/io/InputStream;)Ljava/security/cert/Certificate;"));
    jobject x509_cert = (*env)->CallObjectMethod(env, cert_factory, certificate_factory_methodId,
                                                 byte_array_input);

    jclass x509_cert_class = (*env)->GetObjectClass(env, x509_cert);
    jmethodID x509_cert_methodId = (*env)->GetMethodID(env, x509_cert_class, "getEncoded", "()[B");
    jbyteArray cert_byte = (jbyteArray) (*env)->CallObjectMethod(env, x509_cert,
                                                                 x509_cert_methodId);

    //MessageDigest.getInstance("SHA1")
    jclass message_digest_class = (*env)->FindClass(env, "java/security/MessageDigest");
    jmethodID methodId = (*env)->GetStaticMethodID(env, message_digest_class, "getInstance",
                                                   "(Ljava/lang/String;)Ljava/security/MessageDigest;");
    //如果取SHA1则输入SHA1
    //jstring sha1_jstring=(*env)->NewStringUTF(env,"SHA1");
    jstring sha1_jstring = (*env)->NewStringUTF(env, "MD5");
    jobject sha1_digest = (*env)->CallStaticObjectMethod(env, message_digest_class, methodId,
                                                         sha1_jstring);
    //sha1.digest (certByte)
    methodId = (*env)->GetMethodID(env, message_digest_class, "digest", "([B)[B");
    jbyteArray sha1_byte = (jbyteArray) (*env)->CallObjectMethod(env, sha1_digest, methodId,
                                                                 cert_byte);
    //toHexString
    jsize array_size = (*env)->GetArrayLength(env, sha1_byte);
    jbyte *sha1 = (*env)->GetByteArrayElements(env, sha1_byte, NULL);
    char hex_sha[array_size * 2 + 1];
    int i;
    for (i = 0; i < array_size; ++i) {
        hex_sha[2 * i] = HexCode[((unsigned char) sha1[i]) / 16];
        hex_sha[2 * i + 1] = HexCode[((unsigned char) sha1[i]) % 16];
    }
    hex_sha[array_size * 2] = '\0';
//    const char *sign = (*env)->GetStringUTFChars(env, signstr, NULL);
    if (strcmp(hex_sha, sha1final) != 0) {
        exitApplication(env, 0);
    }
}

JNIEXPORT void JNICALL
Java_com_renrenbit_rrwallet_service_wallet_SignChecker_init_1native(JNIEnv *env, jclass type) {
    init(env, type);
}
