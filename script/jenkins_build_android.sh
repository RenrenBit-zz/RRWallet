#!/bin/zsh

if [ $# -lt 3 ]; then
  echo 'missing required params, $1=APP_VERSION $2=RN_JS_VERSION $3=RN_ENV $4=RN_SENTRY_DSN'
  exit 1
fi

COMMIT_ID=`git rev-parse --short HEAD`

case $3 in
  RRWALLET)
    FLAVOR=rrwallet
    APK_NAME=rrwallet/release/app-rrwallet-release.apk
    ;;
  INHOUSE)
    FLAVOR=Inhouse
    APK_NAME=inhouse/release/app-inhouse-release.apk
    ;;
  *)
    echo 'invaild $5=FLAVOR'
    exit 1
    ;;
esac

ROOT_PATH=$PWD
OUTPUT_PATH=$ROOT_PATH/build/android

ORIGIN_APK_PATH=$ROOT_PATH/android/app/build/outputs/apk/$APK_NAME
APK_PATH=$OUTPUT_PATH/rrwallet.apk
QRCODE_PATH=$OUTPUT_PATH/qrcode.png

for env in 'RRWALLET' 'INHOUSE'
do
  if [ $env == $3 ]; then
    
    if [ ! -d "$OUTPUT_PATH" ]; then
      mkdir -p $OUTPUT_PATH
    fi

    if [ $1 != 'CURRENT' ]; then
      ANDROID_APP_VERSION="-Papp_version=$1"
    fi
    
    npm ci

    if [ $? -ne 0 ]; then
      echo "npm install failed"
      exit 1
    fi

    cd android

    RN_JS_VERSION=$2 RN_CID=$COMMIT_ID RN_SENTRY_DSN=$4 ./gradlew :app:assemble${FLAVOR}Release $ANDROID_APP_VERSION

    if [ $? -ne 0 ]; then
      echo "assembleRelease failed"
      exit 1
    fi

    mv $ORIGIN_APK_PATH $APK_PATH

    if [ $? -ne 0 ]; then
      echo "mv failed"
      exit 1
    fi

    exit 0
  fi
done
echo '$2 ENV is not vaild'

