import React, { useEffect, useRef } from "react";
import {
  Animated,
  Image,
  StyleSheet,
  Text,
  View,
} from "react-native";

type Props = {
  visible: boolean;
  message: string;
};

export default function MascotDialog({
  visible,
  message,
}: Props) {

  const translateY = useRef(
    new Animated.Value(250)
  ).current;

  useEffect(() => {
    if (visible) {
      Animated.spring(translateY, {
        toValue: 0,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(translateY, {
        toValue: 250,
        duration: 250,
        useNativeDriver: true,
      }).start();
    }
  }, [visible]);

  return (

    <Animated.View
      style={[
        styles.container,
        {
          transform: [{ translateY }],
        },
      ]}
    >

      <Image
        source={require("../../../assets/mascots/default.png")}
        style={styles.image}
      />

      <View style={styles.bubble}>
        <Text style={styles.text}>
          {message}
        </Text>
      </View>

    </Animated.View>

  );
}

const styles = StyleSheet.create({

  container:{
    position:"absolute",

    bottom:20,

    left:20,
    right:20,

    flexDirection:"row",
    alignItems:"flex-end",
  },

  image:{
    width:90,
    height:90,
    marginRight:10,
  },

  bubble:{
    flex:1,

    backgroundColor:"white",

    borderRadius:22,

    padding:18,

    elevation:8,
  },

  text:{
    fontSize:20,
    fontWeight:"700",
    color:"#334155",
  },

});