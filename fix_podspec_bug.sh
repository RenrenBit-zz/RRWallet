sed -i '' 's/Libraries\/Text\/\*\./Libraries\/Text\/**\/\*\./g' \
./node_modules/react-native/React.podspec
sed -i '' "s/\'ios\/\*\.{h,m}\'/\'ios\/RN\/**\/\*\.{h,m}\', \'ios\/RCT\/**\/\*\.{h,m}\'/g" \
./node_modules/react-native-camera/react-native-camera.podspec
sed -i "" "/^  s.resources/d" \
./node_modules/react-native-vector-icons/RNVectorIcons.podspec