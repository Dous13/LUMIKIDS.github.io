import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from "react-native";

import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";

export default function LessonScreen() {
  const navigation = useNavigation<any>();

  return (
    <SafeAreaView style={styles.container}>

      <Text style={styles.letter}>
        A
      </Text>

      <Text style={styles.word}>
        A is for Apple 🍎
      </Text>

      <TouchableOpacity
        style={styles.nextButton}
        onPress={() => navigation.navigate("Quiz")}
      >
        <Text style={styles.buttonText}>
          Next
        </Text>
      </TouchableOpacity>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container:{
    flex:1,
    justifyContent:"center",
    alignItems:"center",
    backgroundColor:"#F7FBFF",
    padding:30,
  },

  letter:{
    fontSize:120,
    fontWeight:"900",
    color:"#4DA8FF",
  },

  word:{
    fontSize:28,
    marginTop:20,
    textAlign:"center",
  },

  nextButton:{
    marginTop:60,
    backgroundColor:"#4DA8FF",
    paddingHorizontal:50,
    paddingVertical:18,
    borderRadius:20,
  },

  buttonText:{
    color:"white",
    fontSize:22,
    fontWeight:"700",
  },
});