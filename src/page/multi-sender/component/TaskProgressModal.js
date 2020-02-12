import React, { Component } from "react";
import { StyleSheet, Image, View, Text, TouchableHighlight } from "react-native";
import { Button } from "react-native-elements";
import Theme from "../../../util/Theme";
import Modal from "react-native-modal";
import { padding } from "../../../util/UIAdapter";
import { BigNumber } from "bignumber.js";
import { computed } from "mobx";
import i18n from "../../../module/i18n/i18n";
import { observer } from "mobx-react";

@observer
export default class TaskProgressModal extends Component {
  constructor(props) {
    super(props);
    this.state = {
      showLoading: true,
    };
  }

  componentDidMount() {
    setTimeout(() => {
      this.setState({
        showLoading: false,
      });
    }, 2000);
  }

  @computed get recipients() {
    return this.props.recipients;
  }

  @computed get completedRecipients() {
    return this.recipients.filter(recipient => recipient.txhash && recipient.txhash.length > 0);
  }

  @computed get percent() {
    if (this.completedRecipients.length > 0) {
      return new BigNumber(this.completedRecipients.length)
        .multipliedBy(100)
        .div(this.recipients.length)
        .toString(10);
    }
    return 0;
  }

  cancel() {
    this.props.onCancel && this.props.onCancel();
  }

  async confirm(errorMessage) {
    if (errorMessage) {
      this.props.onError && this.props.onError();
    } else {
      this.props.onSuccess && this.props.onSuccess();
    }
  }

  renderSending() {
    return (
      <View style={[styles.contentWrap, { height: 230, paddingTop: 43, flexDirection: "row" }]}>
        <View style={{ flex: 1 }}>
          <View style={{ alignItems: "center" }}>
            <Text style={{ fontSize: 24, lineHeight: 24, fontWeight: "500", color: "#000000" }}>
              <Text style={{ color: "#7ED321", fontFamily: Theme.alphanumericFontFamily }}>
                {this.completedRecipients.length}
              </Text>
              <Text style={{ fontFamily: Theme.alphanumericFontFamily }}>/{this.recipients.length}</Text>
            </Text>
          </View>
          <View style={{ flex: 1, justifyContent: "center" }}>
            <View style={{ backgroundColor: "#F5F5F5", borderRadius: 8, width: "100%" }}>
              <View
                style={{
                  height: 8,
                  borderRadius: 8,
                  backgroundColor: "#7ED321",
                  width: this.percent + "%",
                }}></View>
            </View>
          </View>
          <Text style={{ color: "#FEA900", fontSize: 14, paddingBottom: 16, textAlign: "center" }}>
            {i18n.t("qunfabao-sending-tip")}
          </Text>
        </View>
      </View>
    );
  }

  renderSuc() {
    return (
      <View style={styles.contentWrap} key={"suc"}>
        <View style={{ alignItems: "center" }}>
          <Image source={require("@img/qunfabao/icon_suc.png")} />
        </View>
        <Text style={{ color: "#53CA45", fontSize: 16, paddingTop: 14, textAlign: "center" }}>
          {i18n.t("qunfabao-send-success")}
        </Text>
      </View>
    );
  }

  rendError() {
    const { errorMessage } = this.props;
    return (
      <View style={styles.contentWrap} key={"err"}>
        <View style={{ alignItems: "center" }}>
          <Image source={require("@img/qunfabao/icon_no.png")} />
        </View>
        <Text style={{ color: "#EB4E3D", fontSize: 16, paddingTop: 14, textAlign: "center" }}>{errorMessage}</Text>
      </View>
    );
  }

  renderBtn() {
    const { errorMessage } = this.props;
    return (
      <View style={styles.foot} key={"foot"}>
        <Button
          title={i18n.t("qunfabao-tip-btn-ok")}
          containerStyle={styles.nextButtonContainer}
          buttonStyle={[styles.nextButton, {}]}
          onPress={this.confirm.bind(this, errorMessage)}
        />
      </View>
    );
  }

  renderTpl() {
    const { errorMessage } = this.props;
    if (!errorMessage) {
      if (this.completedRecipients.length < this.recipients.length) {
        return this.renderSending();
      } else {
        return [this.renderSuc(), this.renderBtn()];
      }
    } else {
      return [this.rendError(), this.renderBtn()];
    }
  }

  render() {
    const { errorMessage } = this.props;
    const canClose = !!errorMessage || this.completedRecipients.length == this.recipients.length;
    return (
      <Modal visible={this.state.visible} style={styles.modal}>
        <View style={styles.container}>
          <View style={styles.wrap}>
            <View style={styles.titleWrap}>
              <View
                style={{
                  paddingLeft: 16,
                }}>
                {canClose ? (
                  <TouchableHighlight activeOpacity={0.6} underlayColor="transparent" onPress={this.cancel.bind(this)}>
                    <Image source={require("@img/qunfabao/icon_x.png")}></Image>
                  </TouchableHighlight>
                ) : null}
              </View>
              <Text style={styles.title}>
                {canClose ? i18n.t("qunfabao-sending-fabi") : i18n.t("qunfabao-sending-fabi")}&nbsp;&nbsp;&nbsp;&nbsp;
              </Text>
            </View>
            {this.renderTpl()}
          </View>
        </View>
      </Modal>
    );
  }
}

const styles = StyleSheet.create({
  contentWrap: {
    paddingTop: 34,
    paddingHorizontal: 16,
    alignItems: "center",
    // paddingBottom: 90
    // justifyContent: 'center'
  },

  modal: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.4)",
    margin: 0,
  },
  container: {},

  wrap: {
    marginHorizontal: padding(36),
    backgroundColor: "#fff",
    borderRadius: 12,
    overflow: "hidden",
    shadowRadius: 10,
    shadowOpacity: 0.5,
    shadowColor: "#27347D",
    shadowOffset: {
      h: 2,
      w: 0,
    },
  },
  titleWrap: {
    borderColor: Theme.borderColor,
    borderBottomWidth: StyleSheet.hairlineWidth,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontSize: 18,
    color: "#000",
    textAlign: "center",
    // paddingTop: 12,
    // paddingBottom: 12,
    height: 56,
    lineHeight: 56,
    flex: 1,
    fontWeight: "500",
  },
  foot: {
    paddingBottom: 30,
    paddingTop: 20,
    paddingHorizontal: 16,
  },
  nextButtonContainer: {},
  nextButton: {
    height: 45,
    width: "100%",
    borderRadius: 6,
    backgroundColor: Theme.linkColor,
    elevation: 0,
  },
});
