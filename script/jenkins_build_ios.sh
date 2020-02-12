#!/bin/zsh

if [ $# -lt 3 ]; then
  echo 'missing required params, $1=APP_VERSION $2=RN_JS_VERSION $3=RN_ENV $4=RN_SENTRY_DSN'
  exit 1
fi

COMMIT_ID=`git rev-parse --short HEAD`

case $3 in
  RRWALLET)
    SCHEME=rrwallet
    ;;
  INHOUSE)
    SCHEME=rrwallet-inhouse
    ;;
  *)
    echo 'invaild $5=SCHEME'
    exit 1
    ;;
esac

ROOT_PATH=$PWD/ios 
WORKSPACE_PATH=$ROOT_PATH/rrwallet.xcworkspace
TARGET_PATH=$ROOT_PATH/dfund-wallet/Target/$SCHEME
INFO_PLIST_PATH=$TARGET_PATH/$SCHEME-info.plist
EXPORT_OPTIONS_PLIST_PATH=$TARGET_PATH/ExportOptions.plist
EXPORT_PATH=$ROOT_PATH/../build/ios

ARCHIVE_PATH=$EXPORT_PATH/$SCHEME.xcarchive
DSYMS_PATH=$ARCHIVE_PATH/dSYMs
DSYMS_ZIP_PATH=$EXPORT_PATH/dsyms.zip
IPA_PATH=$EXPORT_PATH/$SCHEME.ipa
MANIFEST_PATH=$EXPORT_PATH/manifest.plist
QRCODE_PATH=$EXPORT_PATH/qrcode.png

for env in 'RRWALLET' 'INHOUSE'
do
  startTime=`date +%s`

  if [ $env == $3 ]; then
    if [ ! -d "$EXPORT_PATH" ]; then
      mkdir -p $EXPORT_PATH
    fi

    npm ci

    if [ $? -ne 0 ]; then
      echo "npm install failed"
      exit 1
    fi

    npmTime=`date +%s`

    cd ios

    bundle install

    if [ $? -ne 0 ]; then
      echo "bundle install failed"
      exit 1
    fi

    bundle exec pod install

    if [ $? -ne 0 ]; then
      echo "bundle exec pod install failed"
      exit 1
    fi

    podTime=`date +%s`

    if [ $1 != 'CURRENT' ]; then
      if !(echo $1 | grep -E '^\d+(\.\d+){2}$'); then
  
        echo 'invaild $1 APP_VERSION'
        exit 1
      fi

      /usr/libexec/Plistbuddy -c "Set CFBundleShortVersionString $1" "$INFO_PLIST_PATH"

      if [ $? -ne 0 ]; then
        echo "Plistbuddy failed"
        exit 1
      fi
    fi

    xcodebuild clean -workspace $WORKSPACE_PATH -scheme $SCHEME -sdk iphoneos -configuration release -allowProvisioningUpdates

    if [ $? -ne 0 ]; then
      echo "xcodebuild clean failed"
      exit 1
    fi

    cleanTime=`date +%s`

    RN_JS_VERSION=$2 RN_CID=$COMMIT_ID RN_SENTRY_DSN=$4 xcodebuild archive -workspace $WORKSPACE_PATH -scheme $SCHEME -sdk iphoneos -configuration release -archivePath $ARCHIVE_PATH -allowProvisioningUpdates | bundle exec xcpretty

    if [ ${PIPESTATUS[0]} -ne 0 ]; then
      echo "xcodebuild archive failed"
      exit 1
    fi

    archiveTime=`date +%s`

    xcodebuild -exportArchive -archivePath $ARCHIVE_PATH -exportPath $EXPORT_PATH -exportOptionsPlist $EXPORT_OPTIONS_PLIST_PATH -allowProvisioningUpdates

    if [ $? -ne 0 ]; then
      echo "xcodebuild export failed"
      exit 1
    fi

    exportTime=`date +%s`
    
    zip -r $DSYMS_ZIP_PATH $DSYMS_PATH

    endTime=exportTime

    echo "total: "$((endTime-startTime))"s"
    echo "npm: "$((npmTime-startTime))"s"
    echo "pod: "$((podTime-npmTime))"s"
    echo "clean: "$((cleanTime-podTime))"s"
    echo "archive: "$((archiveTime-cleanTime))"s"
    echo "export: "$((exportTime-archiveTime))"s"

    exit 0
  fi
done