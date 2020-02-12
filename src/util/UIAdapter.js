import { Dimensions, Platform } from "react-native";

const { width, height, scale } = Dimensions.get("screen");

const manualPadding = (x3, x2 = x3, ax3 = x3, ax2 = x2) => {
  let r;
  switch (scale) {
    case 3:
      r = Platform.select({ ios: x3, android: ax3 });
      break;
    case 2:
    default:
      r = Platform.select({ ios: x2, android: ax2 });
  }
  return Math.ceil(r);
};

const padding = length => {
  return manualPadding(length, length * 0.8);
};

const fontSize = size => {
  let r = size;
  switch (scale) {
    case 2:
      r = size * 0.8;
      break;
    case 3:
    default:
      r = size;
  }
  return Math.ceil(r);
};

export { manualPadding, padding, fontSize };
