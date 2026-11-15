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
  ownsMascot,
  buyMascot,
  getOwnedMascots,
} from "../../services/database/localMascot";
import {
  spendCoins,
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

  console.log("studentId:", studentId);
  console.log("student:", student);

  if (!student) {
    return (
      <SafeAreaView style={styles.container}>
        <Text>Loading...</Text>
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

function purchaseMascot(item: any) {
  console.log("Pressed Buy:", item.name);

  if (!student) {
    console.log("No student");
    return;
  }

  console.log("Coins:", student.coins);
  console.log("Price:", item.price);

  const alreadyOwned = ownsMascot(student.id, item.id);

  console.log("Already owned:", alreadyOwned);

  if (alreadyOwned) {
    return;
  }

  if (student.coins < item.price) {
      showMessage("🪙 Not enough coins!");
      return;
  }

  console.log("Spending coins...");
  spendCoins(student.id, item.price);

  console.log("Buying mascot...");
  buyMascot(student.id, item.id);

  console.log("Reloading...");
  reload();

  const owned = getOwnedMascots(student.id);

  console.log("Owned mascots:", owned);

  setOwnedMascots(
    owned.map((m: any) => m.mascotId)
  );

  setRewardMascot(item);
  setRewardVisible(true);
}

  function handleEquip(item: any) {
    if (!student) return;

    equipMascot(student.id, item.id);

    reload();

    const owned = getOwnedMascots(student.id);

    setOwnedMascots(
      owned.map((m: any) => m.mascotId)
    );

    setRewardMascot(item);
    setRewardVisible(true);
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
          color="#2867AD"
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
          return (         <View style={styles.card}>

            <Image
              source={item.image}
              style={styles.image}
            />

            <View style={{ flex: 1 }}>
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
              owned && !equipped && { backgroundColor: "#7152A3" }, // purple = Equip
              equipped && { backgroundColor: "#237B67" },           // green = Equipped
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

  container:{ flex:1, backgroundColor: "#FAF8F2", padding:20 },

  title:{ fontSize: 28, fontWeight:"900", marginBottom: 16, color: "#23394A", lineHeight: 36 },

  card:{ flexDirection:"row", alignItems:"center", backgroundColor: "#FFFFFF", borderRadius: 20, padding: 14, borderWidth: 1, borderColor: "#E1E7E5", marginBottom: 12, elevation: 1, width: "100%", maxWidth: 680, alignSelf: "center" },

  image:{ width: 64, height: 76, marginRight: 12, resizeMode: "contain" },

  name:{ fontSize: 20, fontWeight:"900", color: "#23394A", flexShrink: 1 },

  price:{ fontSize: 15, marginTop: 5, color: "#805B15", fontWeight:"800" },

  button:{ backgroundColor: "#2867AD", paddingHorizontal: 12, paddingVertical: 14, borderRadius: 16, minHeight: 52, marginLeft: 8 },

  buttonText:{ color: "#FFFFFF", fontWeight:"900", fontSize: 15 },

  header:{ marginBottom: 12, width: "100%", maxWidth: 680, alignSelf: "center" },

  backButton:{
      flexDirection:"row",
      alignItems:"center",
      marginBottom:15,
  },

  backText:{ fontSize: 16, fontWeight:"700", marginLeft:8, color:"#2867AD" },

  circle1:{ position:"absolute", width:180, height:180, borderRadius:90, backgroundColor:"#9fe7ff", top:-60, right:-50, display: "none" },

  circle2:{ position:"absolute", width:120, height:120, borderRadius:60, backgroundColor:"#bb96c2", bottom:80, left:-30, display: "none" },

  circle3:{ position:"absolute", width:90, height:90, borderRadius:45, backgroundColor:"#a6ffc1", right:20, bottom:200, display: "none" },

  coinCard:{ alignSelf: "flex-start", backgroundColor:"#FFF6CF", paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12, marginBottom: 10 },

  coinRow:{flexDirection:"row",alignItems:"center"},
  coinText:{ fontSize: 18, fontWeight:"900", color: "#805B15" },

});