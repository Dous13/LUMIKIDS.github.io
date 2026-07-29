import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from "react-native";

const subjects = [
  {
    emoji: "📗",
    title: "Reading",
    color: "#6ED46E",
  },
  {
    emoji: "✏️",
    title: "Writing",
    color: "#FFA640",
  },
  {
    emoji: "🔢",
    title: "Math",
    color: "#5CAEFF",
  },
];

export default function SubjectGrid() {
  return (
    <View style={styles.container}>
      {subjects.map((item) => (
        <TouchableOpacity
          key={item.title}
          style={[
            styles.card,
            {
              backgroundColor: item.color,
            },
          ]}
        >
          <Text style={styles.emoji}>
            {item.emoji}
          </Text>

          <Text style={styles.title}>
            {item.title}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 24,
    flexDirection: "row",
    justifyContent: "space-between",
  },

  card: {
    width: 100,
    height: 120,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
  },

  emoji: {
    fontSize: 40,
  },

  title: {
    color: "white",
    fontWeight: "700",
    marginTop: 10,
    fontSize: 18,
  },
});