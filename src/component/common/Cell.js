import PropTypes from "prop-types";
import React, { Component } from "react";
import { StyleSheet, View, Text, Image, TouchableHighlight, ViewPropTypes } from "react-native";
import Theme from "../../util/Theme";

class Cell extends Component {
  static propTypes = {
    containerStyle: ViewPropTypes.style, // 容器样式，用来做边距时使用
    title: PropTypes.string, // 左侧提示文字
    renderTitle: PropTypes.func, // title的渲染函数
    content: PropTypes.string, // 右侧显示文字
    contentStyle: Text.propTypes.style, // 右侧文字样式
    bottomBorder: PropTypes.bool, // 是否有底部button
    onPress: PropTypes.any,
    noticeNum: PropTypes.oneOfType([PropTypes.string, PropTypes.number]), // 红点，传入数字或字符串
    imageUrl: PropTypes.string, // 左侧图片地址
    hideRightArrow: PropTypes.bool, // 是否隐藏右侧箭头
    rightNode: PropTypes.node, // 右侧节点
    cellHeight: PropTypes.oneOfType([PropTypes.number, PropTypes.string]), // cell 高度,
    titleStyle: Text.propTypes.style, // 标题样式
  };

  render() {
    const {
      containerStyle,
      cellContainer,
      cellHeight,
      title,
      titleStyle,
      content,
      contentStyle,
      imageUrl,
      imageStyle,
      noticeNum,
      hideRightArrow,
      bottomBorder,
      rightNode,
      onPress,
      source,
      detail,
      selectable = false,
      renderTitle,
    } = this.props;

    return (
      <View style={[styles.cellContainer, containerStyle]}>
        <TouchableHighlight onPress={onPress}>
          <View
            style={[
              styles.cell,
              cellHeight ? { height: cellHeight } : {},
              bottomBorder ? styles.cellBorderBottom : {},
              cellContainer ? cellContainer : {},
            ]}>
            <View style={[styles.flexRow]}>
              {imageUrl && (
                <Image
                  source={{ uri: imageUrl }}
                  style={[{ width: 20, height: 20, marginRight: 12 }, imageStyle || {}]}
                />
              )}
              {source && <Image source={source} style={{ marginRight: 12 }} />}
              {renderTitle && renderTitle()}
              {!!title && (
                <Text style={[styles.title, titleStyle]} selectable={selectable}>
                  {title}
                </Text>
              )}
            </View>
            <View style={[styles.detailWrap]}>
              {noticeNum !== undefined && noticeNum > 0 && (
                <View style={styles.redDot}>
                  <Text style={styles.redDotText}>{noticeNum}</Text>
                </View>
              )}
              {!!content && <Text style={[styles.content, contentStyle]}>{content}</Text>}
              {!!detail && (
                <Text ellipsizeMode="middle" style={styles.detail}>
                  {detail}
                </Text>
              )}
              {rightNode && rightNode}
              {!hideRightArrow && <Image style={{ marginLeft: 6 }} source={require("@img/icon/arrow-right.png")} />}
            </View>
          </View>
        </TouchableHighlight>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  cellContainer: {
    width: "100%",
    backgroundColor: Theme.white,
  },
  cell: {
    height: 57,
    display: "flex",
    flexDirection: "row",
    justifyContent: "space-between",
    marginHorizontal: 16,
  },
  cellBorderBottom: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Theme.borderColor,
  },
  flexRow: {
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
  },
  detailWrap: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
  },
  title: {
    fontSize: 16,
    color: Theme.textColor.primary,
  },
  content: {
    fontSize: 16,
    color: "#333",
  },
  cellLeft: {},
  cellRigth: {},
  redDot: {
    backgroundColor: Theme.assistColor_red,
    borderRadius: 11.8,
    paddingHorizontal: 6,
    display: "flex",
    height: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  redDotText: {
    color: Theme.white,
    fontSize: 14,
  },
  detail: {
    color: Theme.textColor.mainTitle,
    fontSize: 16,
  },
});

export default Cell;
