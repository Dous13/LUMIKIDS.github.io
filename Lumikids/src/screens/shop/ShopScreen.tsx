import { Colors } from "../../theme";
import TouchableOpacity from "../../components/common/MotionTouchable";
import React, { useEffect, useState } from "react";
import CoinIcon from "../../components/common/CoinIcon";
import { FlatList, Image, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { mascotShop } from "../../data/mascotShop";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import {
  getSession,
} from "../../services/session/session";
import { useStudent } from "../../hooks/useStudent";
import {
  buyMascot,
  getOwnedMascots,
} from "../../services/database/localMascot";
import {
  equipMascot,
} from "../../services/database/localStudent";
import RewardModal from "../../components/shop/RewardModal";
import GameToast from "../../components/common/GameToast";


export default function ShopScreen() {
  const navigation = useNavigation();
  const [studentId, setStudentId] = useState("");
  const [toast, setToast] = useState("");
  const [showToast, setShowToast] = useState(false);

  useEffect(() => {
  async function loadSession() {
    const session = await getSession();

    if (!session) {
      navigation.goBack();
      return;
    }

    setStudentId(session.studentId);
  }

  loadSession();
}, []);
  const [rewardVisible, setRewardVisible] = useState(false);
  const [rewardMascot, setRewardMascot] = useState<any>(null);
  const [ownedMascots, setOwnedMascots] = useState<string[]>([]);
  useEffect(() => {
    if (!studentId) return;

    const owned = getOwnedMascots(studentId);

    setOwnedMascots(
      owned.map((m: any) => m.mascotId)
    );
  }, [studentId, rewardVisible]);

  const {
    student,
    reload,
  } = useStudent(studentId);

  if (!student) {
    return (
      <SafeAreaView style={[styles.container, styles.loading]}>
        <Text style={styles.loadingText}>Loading...</Text>
      </SafeAreaView>
    );
  }

  function showMessage(message: string) {
    setToast(message);
    setShowToast(true);

    setTimeout(() => {
      setShowToast(false);
    }, 2200);
  }

  async function purchaseMascot(item: (typeof mascotShop)[number]) {
    if (!student || (await getSession())?.studentId !== student.id) return;
    try {
      const result = buyMascot(student.id, item.id, item.price);
      if (result === "owned") return;
      if (result === "insufficient") {
        showMessage("Not enough coins!");
        return;
      }
      reload();
      setOwnedMascots(getOwnedMascots(student.id).map(mascot => mascot.mascotId));
      setRewardMascot(item);
      setRewardVisible(true);
    } catch {
      showMessage("The purchase could not be saved. Please try again.");
    }
  }

  async function handleEquip(item: (typeof mascotShop)[number]) {
    if (!student || (await getSession())?.studentId !== student.id) return;
    try {
      equipMascot(student.id, item.id);
      reload();
      setOwnedMascots(getOwnedMascots(student.id).map(mascot => mascot.mascotId));
      setRewardMascot(item);
      setRewardVisible(true);
    } catch {
      showMessage("The mascot could not be equipped. Please try again.");
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.circle1}/>
      <View style={styles.circle2}/>
      <View style={styles.circle3}/>
    <View style={styles.header}>

      <TouchableOpacity
        style={styles.backButton}
        onPress={() => navigation.goBack()}
      >
        <Ionicons
          name="arrow-back"
          size={28}
          color={Colors.primary}
        />

        <Text style={styles.backText}>
          Home
        </Text>
      </TouchableOpacity>

      <Text style={styles.title}>
        🛒 Mascot Shop
      </Text>

      <View style={styles.coinCard}>
          <View style={styles.coinRow}>
            <CoinIcon size={22} />
            <Text style={styles.coinText}> {student?.coins ?? 0} Coins</Text>
          </View>
      </View>

    </View>

      <FlatList
        data={mascotShop}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => {
          const owned = ownedMascots.includes(item.id);
          const equipped = student.avatar === item.id;
          return (         <View style={[styles.card, owned && styles.ownedCard, equipped && styles.equippedCard]}>

            <Image
              source={item.image}
              style={styles.image}
            />

            <View style={{ flex: 1, minWidth: 90 }}>
              <Text style={styles.name}>
                {item.name}
              </Text>

            <Text style={styles.price}>
              {!owned
                ? `🪙 ${item.price}`
                : equipped
                ? "Currently Using"
                : "Owned"}
            </Text>
            </View>

          <TouchableOpacity
            disabled={equipped}
            style={[
              styles.button,
              owned && !equipped && { backgroundColor: Colors.writing, borderBottomColor: Colors.writingDark }, // purple = Equip
              equipped && { backgroundColor: Colors.math, borderBottomColor: Colors.mathDark },           // green = Equipped
            ]}
            onPress={() => {
              if (!owned) {
                purchaseMascot(item);
              } else if (!equipped) {
                handleEquip(item);
              }
            }}
          >
            <Text style={styles.buttonText}>
            {
              !owned
                ? "Buy"
                : equipped
                ? "Equipped ✓"
                : "Equip"
            }
            </Text>
          </TouchableOpacity>

          </View>);}}
      />
    <GameToast
        visible={showToast}
        message={toast}
    />
    <RewardModal
      visible={rewardVisible}
      mascotImage={rewardMascot?.image}
      mascotName={rewardMascot?.name}
      onClose={() => setRewardVisible(false)}
    />
    </SafeAreaView>
    
  );
}

const styles = StyleSheet.create({
  loading: { justifyContent: "center", alignItems: "center" },
  loadingText: { fontSize: 16, lineHeight: 24, color: Colors.textSecondary },
  ownedCard: { borderColor: Colors.writingBorder },
  equippedCard: { borderColor: Colors.math, backgroundColor: Colors.mathSurface },

  container:{ flex:1, backgroundColor: Colors.background, padding:20 },

  title:{ fontSize: 28, fontWeight: "800", marginBottom: 16, color: Colors.text, lineHeight: 36 },

  card:{ flexDirection:"row", alignItems:"center", backgroundColor: Colors.white, borderRadius: 20, padding: 14, borderWidth: 1, borderColor: "#BEDDF3", marginBottom: 12, elevation: 1, width: "100%", maxWidth: 680, alignSelf: "center", flexWrap: "wrap", borderBottomWidth: 3 },

  image:{ width: 64, height: 76, marginRight: 12, resizeMode: "contain", alignSelf: "center" },

  name:{ fontSize: 20, fontWeight: "800", color: Colors.text, flexShrink: 1, minWidth: 0, lineHeight: 27 },

  price:{ fontSize: 15, marginTop: 5, color: "#805B15", fontWeight: "700", lineHeight: 22 },

  button:{ backgroundColor: Colors.primary, paddingHorizontal: 12, paddingVertical: 14, borderRadius: 16, minHeight: 52, marginLeft: "auto", justifyContent: "center", minWidth: 80, borderBottomWidth: 3, borderBottomColor: Colors.primaryDark },

  buttonText:{ color: Colors.white, fontWeight: "800", fontSize: 16, lineHeight: 22, textAlign: "center" },

  header:{ marginBottom: 12, width: "100%", maxWidth: 680, alignSelf: "center" },

  backButton:{ flexDirection:"row", alignItems:"center", marginBottom:15, minHeight: 44 },

  backText:{ fontSize: 17, fontWeight:"700", marginLeft:8, color:Colors.primary, lineHeight: 24 },

  circle1:{ position:"absolute", width:180, height:180, borderRadius:90, backgroundColor:"#9fe7ff", top:-60, right:-50, display: "none" },

  circle2:{ position:"absolute", width:120, height:120, borderRadius:60, backgroundColor:"#bb96c2", bottom:80, left:-30, display: "none" },

  circle3:{ position:"absolute", width:90, height:90, borderRadius:45, backgroundColor:"#a6ffc1", right:20, bottom:200, display: "none" },

  coinCard:{ alignSelf: "flex-start", backgroundColor: "#FFD66B", paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12, marginBottom: 10, borderWidth: 1, borderColor: Colors.rewardBorder },

  coinRow:{flexDirection:"row",alignItems:"center"},
  coinText:{ fontSize: 18, fontWeight:"900", color: "#65480A" },

});