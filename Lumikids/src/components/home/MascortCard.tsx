import { View, Text, StyleSheet, Image } from "react-native";

export default function MascotCard() {
  return (
    <View style={styles.card}>
      <Image
        source={require("../../../assets/images/mascot.png")}
        style={styles.image}
        resizeMode="contain"
      />

      <View style={{ flex: 1 }}>
        <Text style={styles.title}>
          Hi Friend!
        </Text>

        <Text style={styles.subtitle}>
          Ready for today's adventure?
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: 24,
    marginTop: 25,
    backgroundColor: "#FFF7D6",
    borderRadius: 30,
    flexDirection: "row",
    alignItems: "center",
    padding: 18,
  },

  image: {
    width: 80,
    height: 80,
    marginRight: 16,
  },

  title: {
    fontWeight: "800",
    fontSize: 22,
  },

  subtitle: {
    marginTop: 6,
    fontSize: 16,
    color: "#555",
  },
});