import React from "react";
import { StyleSheet, View, NativeModules, Dimensions, Platform } from "react-native";
import Screen from "../Screen";
import { RNCamera } from "react-native-camera";
import { Svg, ClipPath, Rect, Defs, Polygon, Path } from "react-native-svg";
import _ from "lodash";
import Header from "../../component/common/Header";
import theme from "../../util/Theme";
import Tip from "../../component/common/Tip";
import i18n from "../../module/i18n/i18n";

const { width, height } = Dimensions.get("window");
const paddingHorizontal = 58;
const rectWidth = width - 2 * paddingHorizontal;
const rectHeight = rectWidth;

const reactX = paddingHorizontal;
const reactY = Math.ceil((height - rectHeight) / 2) - 30;
const polygonPoints = `${reactX},${reactY} ${reactX},${reactY + rectHeight} ${reactX + rectWidth},${reactY +
  rectHeight} ${reactX + rectWidth},${reactY}`;

const RRRNQRDecoder = NativeModules.RRRNQRDecoder;

const ImagePicker = require("react-native-image-picker");

const imagePickerOptions = {
  title: i18n.common("choose-picture"),
  cancelButtonTitle: i18n.common("cancel"),
  takePhotoButtonTitle: i18n.mine("camera"),
  chooseFromLibraryButtonTitle: i18n.mine("camera-roll"),
  cameraType: "back",
  mediaType: "photo",
  videoQuality: "high",
  durationLimit: 10,
  maxWidth: 1200,
  maxHeight: 1200,
  aspectX: 2,
  aspectY: 1,
  quality: 0.7,
  angle: 0,
  allowsEditing: false,
  noData: true,
  storageOptions: {
    skipBackup: true,
    path: "images",
  },
  permissionDenied: {
    title: i18n.common("photo-permission-title"),
    text: i18n.common("photo-permission-text"),
    reTryTitle: i18n.common("photo-permission-retry"),
    okTitle: i18n.common("confirm"),
  },
};

export default class ScanQRCodeScreen extends Screen {
  static get screenID() {
    return "ScanQRCodeScreen";
  }

  static navigatorStyle = {
    navBarHidden: true,
    tabBarHidden: true,
    statusBarTextColorSchemeSingleScreen: "light",
  };

  static navigatorButtons = {
    leftButtons: [
      {
        ...Screen.navigatorButtons.leftButtons[0],
        buttonColor: "#FFFFFF",
      },
    ],
    rightButtons: [
      {
        id: "cameraRoll",
        buttonColor: "#fff",
        title: i18n.common("album"),
      },
    ],
  };

  detected = false;
  lastDetectedCode = "";
  constructor(props) {
    super(props);

    this.camera = null;

    this.state = {
      camera: {
        type: RNCamera.Constants.Type.back,
        flashMode: RNCamera.Constants.FlashMode.off,
      },
      flag: true,
    };
    this.onBarCodeRead = this.onBarCodeRead.bind(this);
    this.props.navigator.addOnNavigatorEvent(this.onNavigatorEvent.bind(this));
  }
  onNavigatorEvent(event) {
    if (event.type == "NavBarButtonPress") {
      if (event.id == "cameraRoll") {
        this.openCameraRoll();
      }
    } else {
      switch (event.id) {
        case "willAppear":
          break;
        case "didAppear":
          this.detected = false;
          this.lastDetectedCode = "";
          break;
        case "willDisappear":
          break;
        case "didDisappear":
          break;
        case "willCommitPreview":
          break;
      }
    }
  }

  async openCameraRoll() {
    this.camera.pausePreview();
    ImagePicker.launchImageLibrary(imagePickerOptions, res => {
      if (res) {
        try {
          if (res.uri) {
            let path;
            if (Platform.OS === "ios") {
              path = res.uri;
            } else {
              path = res.path;
            }
            this.decodeWithPath(path);
          } else {
            if (!res.didCancel) {
              this.tip && this.tip.showInfo(res.error);
            }
            this.camera.resumePreview();
          }
        } catch (error) {
          this.tip && this.tip.showError("识别图像失败");
          this.camera.resumePreview();
        }
      } else {
        this.tip && this.tip.showError("打开相册失败");
        this.camera.resumePreview();
      }
    });
  }

  decodeWithPath = async path => {
    RRRNQRDecoder.decode(path)
      .then(val => {
        let data = val;
        this.props.onBarCodeRead({ data }, this.tip);
      })
      .catch(error => {
        this.tip && this.tip.showError("未识别到二维码");
        this.camera.resumePreview();
      });
  };

  onBarCodeRead = e => {
    if (!_.isString(e.data)) {
      return;
    }

    if (this.detected) {
      return;
    }

    if (e.data === this.lastDetectedCode) {
      return;
    }

    this.lastDetectedCode = e.data;

    this.detected = this.props.onBarCodeRead(e, this.tip);
  };

  render() {
    return (
      <View style={styles.container}>
        <RNCamera
          ref={cam => {
            this.camera = cam;
          }}
          style={styles.preview}
          type={this.state.camera.type}
          flashMode={this.state.camera.flashMode}
          autoFocus={RNCamera.Constants.AutoFocus.on}
          onBarCodeRead={this.onBarCodeRead.bind(this)}
          permissionDialogTitle={"请求使用相机"}
          permissionDialogMessage={"App需要获得使用相机的许可"}
        />
        <View style={styles.overlay}>
          <Svg height={height} width={width} style={styles.svg}>
            <Defs>
              <ClipPath id="clip" height={height} width={width}>
                <Rect x="0" y="0" height={height} width={width} />
                <Polygon points={polygonPoints} />
              </ClipPath>
            </Defs>
            <Path
              x={reactX}
              y={reactY}
              d={`M0 1.5 L20 1.5 M1.5 0 L1.5 20`}
              fill="none"
              stroke={theme.brandColor}
              strokeWidth="3"
            />
            <Path
              x={reactX + rectWidth}
              y={reactY}
              d={`M0 1.5 L-20 1.5 M-1.5 0 L-1.5 20`}
              fill="none"
              stroke={theme.brandColor}
              strokeWidth="3"
            />
            <Path
              x={reactX + rectWidth}
              y={reactY + rectHeight}
              d={`M0 -1.5 L-20 -1.5 M-1.5 0 L-1.5 -20`}
              fill="none"
              stroke={theme.brandColor}
              strokeWidth="3"
            />
            <Path
              x={reactX}
              y={reactY + rectHeight}
              d={`M0 -1.5 L20 -1.5 M1.5 0 L1.5 -20`}
              fill="none"
              stroke={theme.brandColor}
              strokeWidth="3"
            />
            <Rect x="0" y="0" width="100%" height="100%" fill="#000000" opacity="0.6" clipPath="url(#clip)" />
          </Svg>
          <Header
            title={i18n.wallet("title-scan")}
            titleColor={"#FFFFFF"}
            leftButtons={ScanQRCodeScreen.navigatorButtons.leftButtons}
            rightButtons={ScanQRCodeScreen.navigatorButtons.rightButtons}
            navigator={this.props.navigator}
            style={styles.header}
          />
          <Tip ref={o => (this.tip = o)} />
        </View>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  preview: {
    width: width,
    height: height,
    justifyContent: "flex-end",
    alignItems: "center",
  },
  overlay: {
    position: "absolute",
    right: 0,
    left: 0,
    top: 0,
    bottom: 0,
  },
  svg: {
    position: "absolute",
  },
  header: {
    backgroundColor: "transparent",
  },
  typeButton: {
    padding: 5,
  },
  flashButtonflashButton: {
    padding: 5,
  },
  buttonsSpace: {
    width: 10,
  },
});
