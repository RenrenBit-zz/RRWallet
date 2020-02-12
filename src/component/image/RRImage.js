import React, { Component, PureComponent } from "react";
import FastImage from "react-native-fast-image";
import { StyleSheet, Dimensions } from "react-native";
import _ from "lodash";

const CONFIG = {
  resize: 1,
  webp: 1,
};

const RESIZE_FLAG = parseInt(CONFIG.resize);
const WEBP_FLAG = parseInt(CONFIG.webp);

const { scale } = Dimensions.get("window");

class RRImage extends PureComponent {
  get source() {
    const { source, resize } = this.props;
    if (_.isNumber(source)) {
      return source;
    }

    if (!source.uri || !_.isString(source.uri)) {
      return undefined;
    }

    if (RESIZE_FLAG == 0 && WEBP_FLAG == 0) {
      return source;
    }

    const clone = _.cloneDeep(source);
    const uri = clone.uri;
    let [url, query] = uri.split("?");

    query = `${query ? query + "&" : ""}x-oss-process=image`;

    if (RESIZE_FLAG) {
      let width, height;

      if (resize && this.size) {
        width = this.size.width;
        height = this.size.height;
      } else {
        const style = StyleSheet.flatten(this.props.style);
        width = style.width;
        height = style.height;
      }
      if (width && height) {
        query = `${query}/resize,m_lfit,w_${Math.floor(width * scale)},h_${Math.floor(height * scale)}`;
      }
    }

    if (WEBP_FLAG) {
      query = `${query}/format,webp`;
    }

    clone.uri = `${url}?${query}`;

    return clone;
  }
  get size() {
    const { source, resize } = this.props;
    if (!resize || _.isNumber(source) || !source.uri) {
      return undefined;
    }

    const [, width, height] = /(\d+)x(\d+)\.\w*$/.exec(source.uri) || [];
    if (!width || !height) {
      return undefined;
    }

    return { width: parseInt(width / scale), height: parseInt(height / scale) };
  }
  render() {
    return <FastImage {...this.props} source={this.source} style={[this.props.style, this.size]} />;
  }
}

export default RRImage;
