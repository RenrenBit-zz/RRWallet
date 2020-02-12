import React, { Component } from "react";
import { StyleSheet, View, TouchableHighlight, Image, Text } from "react-native";
import { observer } from "mobx-react";
import { computed } from "mobx";

@observer
class FunctionSection extends Component {
  @computed get data() {
    return this.props.data;
  }
  render() {
    return (
      <View style={styles.main}>
        {this.data.map(el => (
          <TouchableHighlight underlayColor="transparent" activeOpacity={0.7} onPress={el.onPress} key={el.name}>
            <View style={styles.item}>
              <View style={styles.iconWrap}>
                <Image source={el.icon} />
              </View>
              <Text style={styles.title}>{el.name}</Text>
            </View>
          </TouchableHighlight>
        ))}
      </View>
    );
  }
}

const styles = StyleSheet.create({
  main: {
    paddingTop: 20,
    paddingBottom: 20,
    paddingHorizontal: 30,
    flexDirection: "row",
    justifyContent: "space-between",
    backgroundColor: "#FFFFFF",
  },
  item: {
    alignItems: "center",
    height: 77,
  },
  iconWrap: {
    height: 52,
    width: 52,
    borderRadius: 18,
    backgroundColor: "#fff4df",
    justifyContent: "center",
    alignItems: "center",
  },
  icon: {},
  title: {
    marginTop: 8,
    fontSize: 12,
    color: "#3B3939",
  },
});
export default FunctionSection;
