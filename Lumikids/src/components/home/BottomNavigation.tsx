import {
  View,
  TouchableOpacity,
  Text,
  StyleSheet,
} from "react-native";

export default function BottomNavigation() {
  return (
    <View style={styles.container}>
      <TouchableOpacity>
        <Text style={styles.icon}>🏠</Text>
      </TouchableOpacity>

      <TouchableOpacity>
        <Text style={styles.icon}>👨‍👩‍👧</Text>
      </TouchableOpacity>

      <TouchableOpacity>
        <Text style={styles.icon}>🎁</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 82,
    backgroundColor: "white",
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,

    flexDirection: "row",
    justifyContent: "space-evenly",
    alignItems: "center",
  },

  icon: {
    fontSize: 32,
  },
});