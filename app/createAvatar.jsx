import { useCallback, useRef, useState } from "react";
import {
  View, Text, StatusBar, Pressable, StyleSheet,
  Image, ScrollView, ToastAndroid,
} from "react-native";
import { AntDesign } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect } from "@react-navigation/native";
import SmallTabs from "../components/SmallTabs";
import { router } from "expo-router";
import {
  GestureDetector, Gesture,
  GestureHandlerRootView,
} from "react-native-gesture-handler";
import Animated, {
  useSharedValue, useAnimatedStyle,
  withSpring, runOnJS,
} from "react-native-reanimated";

const avatarImages = {
  color: [
    require("../assets/images/avatars/Color1.png"),
    require("../assets/images/avatars/Color2.png"),
    require("../assets/images/avatars/Color3.png"),
  ],
  cara: [
    require("../assets/images/avatars/Cara1.png"),
    require("../assets/images/avatars/Cara2.png"),
    require("../assets/images/avatars/Cara3.png"),
    require("../assets/images/avatars/Cara4.png"),
    require("../assets/images/avatars/Cara5.png"),
    require("../assets/images/avatars/Cara6.png"),
    require("../assets/images/avatars/Caras10.png"),
    require("../assets/images/avatars/Caras11.png"),
    require("../assets/images/avatars/Caras7-2.png"),
    require("../assets/images/avatars/Caras8.png"),
    require("../assets/images/avatars/Caras9.png"),
    require("../assets/images/avatars/Caras12.png"),
  ],
  cabello: [
    require("../assets/images/avatars/Cabello1.png"),
    require("../assets/images/avatars/Cabello2.png"),
    require("../assets/images/avatars/Cabello3.png"),
    require("../assets/images/avatars/Cabello4.png"),
    require("../assets/images/avatars/Cabello5.png"),
    require("../assets/images/avatars/Cabello6.png"),
    require("../assets/images/avatars/Cabello7.png"),
    require("../assets/images/avatars/Cabello8.png"),
    require("../assets/images/avatars/CabelloSin.png"),
  ],
  camisa: [
    require("../assets/images/avatars/Camisas1.png"),
    require("../assets/images/avatars/Camisas2.png"),
    require("../assets/images/avatars/Camisas3.png"),
    require("../assets/images/avatars/Camisas4.png"),
    require("../assets/images/avatars/Camisas5.png"),
    require("../assets/images/avatars/Camisas6.png"),
    require("../assets/images/avatars/Camisas7.png"),
    require("../assets/images/avatars/Camisas8.png"),
    require("../assets/images/avatars/Camisas9.png"),
    require("../assets/images/avatars/Camisas10.png"),
    require("../assets/images/avatars/Camisas11.png"),
    require("../assets/images/avatars/Camisas12.png"),
    require("../assets/images/avatars/Camisas13.png"),
    require("../assets/images/avatars/Camisas14.png"),
    require("../assets/images/avatars/Camisas15.png"),
    require("../assets/images/avatars/Camisas16.png"),
    require("../assets/images/avatars/Camisas17.png"),
    require("../assets/images/avatars/Camisas18.png"),
    require("../assets/images/avatars/Camisas19.png"),
  ],
  short: [
    require("../assets/images/avatars/Shorts1.png"),
    require("../assets/images/avatars/Shorts2.png"),
    require("../assets/images/avatars/Shorts3.png"),
    require("../assets/images/avatars/Shorts4-2.png"),
  ],
  pies: [
    require("../assets/images/avatars/Pies1.png"),
    require("../assets/images/avatars/Pies2.png"),
    require("../assets/images/avatars/Pies3.png"),
    require("../assets/images/avatars/Pies4.png"),
    require("../assets/images/avatars/Pies5.png"),
    require("../assets/images/avatars/Pies6.png"),
    require("../assets/images/avatars/Pies7.png"),
    require("../assets/images/avatars/Pies8.png"),
  ],
};

const LABELS = {
  color: 'Color de piel', cara: 'Cara', cabello: 'Cabello',
  camisa: 'Camisa', short: 'Pantalón', pies: 'Zapatos',
};

// ─── Componente de prenda draggable ────────────────────────────────────────
function DraggableItem({ image, category, index, onDrop, isSelected, avatarBounds }) {
  const tx      = useSharedValue(0);
  const ty      = useSharedValue(0);
  const scale   = useSharedValue(1);
  const zIdx    = useSharedValue(1);
  const active  = useSharedValue(false);
  // Posición absoluta medida en JS puro — sin bridge issues
  const selfX   = useRef(0);
  const selfY   = useRef(0);
  const selfW   = useRef(86);
  const selfH   = useRef(86);

  const aStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: tx.value },
      { translateY: ty.value },
      { scale: scale.value },
    ],
    zIndex: zIdx.value,
  }));

  // Medir posición del item en la ventana (JS, seguro)
  const onItemLayout = (ref) => {
    if (!ref) return;
    ref.measureInWindow((x, y, w, h) => {
      selfX.current = x;
      selfY.current = y;
      selfW.current = w || 86;
      selfH.current = h || 86;
    });
  };

  // Chequeo de zona — corre en JS via runOnJS, nunca en worklet
  const checkAndDrop = (translationX, translationY) => {
    try {
      const dropX = selfX.current + selfW.current / 2 + translationX;
      const dropY = selfY.current + selfH.current / 2 + translationY;
      const b = avatarBounds.current;
      if (b && dropX >= b.x && dropX <= b.x + b.w && dropY >= b.y && dropY <= b.y + b.h) {
        onDrop(category, index);
      }
    } catch (e) {
      // silencioso — nunca debe crashear
    }
  };

  const longPress = Gesture.LongPress()
    .minDuration(350)
    .onStart(() => {
      active.value = true;
      scale.value  = withSpring(1.18);
      zIdx.value   = 999;
    });

  const pan = Gesture.Pan()
    .activateAfterLongPress(350)
    .onUpdate((e) => {
      if (!active.value) return;
      tx.value = e.translationX;
      ty.value = e.translationY;
    })
    .onEnd((e) => {
      if (active.value) {
        runOnJS(checkAndDrop)(e.translationX, e.translationY);
      }
      tx.value    = withSpring(0);
      ty.value    = withSpring(0);
      scale.value = withSpring(1);
      zIdx.value  = 1;
      active.value = false;
    })
    .onFinalize(() => {
      tx.value    = withSpring(0);
      ty.value    = withSpring(0);
      scale.value = withSpring(1);
      zIdx.value  = 1;
      active.value = false;
    });

  const gesture = Gesture.Simultaneous(longPress, pan);

  return (
    <GestureDetector gesture={gesture}>
      <Animated.View
        style={[styles.draggable, isSelected && styles.draggableSelected, aStyle]}
        ref={(ref) => { if (ref) onItemLayout(ref); }}
      >
        <Image source={image} style={styles.draggableImg} />
        {isSelected && (
          <View style={styles.selectedBadge}>
            <AntDesign name="check" size={10} color="#fff" />
          </View>
        )}
      </Animated.View>
    </GestureDetector>
  );
}

// ─── Pantalla principal ─────────────────────────────────────────────────────
export default function CreateAvatar() {
  const [selectedImages, setSelectedImages] = useState(() => ({
    color:   avatarImages.color[0],
    cara:    avatarImages.cara[0],
    cabello: avatarImages.cabello[0],
    camisa:  avatarImages.camisa[0],
    short:   avatarImages.short[0],
    pies:    avatarImages.pies[0],
  }));
  const [dropping, setDropping] = useState(false);
  // Bounds del avatar medidos en JS puro
  const avatarBounds = useRef(null);
  const avatarViewRef = useRef(null);

  const measureAvatar = () => {
    if (avatarViewRef.current) {
      avatarViewRef.current.measureInWindow((x, y, w, h) => {
        avatarBounds.current = { x, y, w, h };
      });
    }
  };

  const handleDrop = (category, index) => {
    setSelectedImages(prev => ({ ...prev, [category]: avatarImages[category][index] }));
    setDropping(true);
    setTimeout(() => setDropping(false), 600);
    ToastAndroid.showWithGravity("✓ ¡Puesto!", ToastAndroid.SHORT, ToastAndroid.CENTER);
  };

  const handleTap = (category, index) => {
    setSelectedImages(prev => ({ ...prev, [category]: avatarImages[category][index] }));
  };

  const getUserAvatar = async () => {
    const saved = await AsyncStorage.getItem("avatar");
    if (saved) {
      const a = JSON.parse(saved);
      setSelectedImages({
        color:   avatarImages.color[a.colorIndex   || 0],
        cara:    avatarImages.cara[a.caraIndex     || 0],
        cabello: avatarImages.cabello[a.cabelloIndex || 0],
        camisa:  avatarImages.camisa[a.camisaIndex  || 0],
        short:   avatarImages.short[a.shortIndex   || 0],
        pies:    avatarImages.pies[a.piesIndex     || 0],
      });
    }
  };

  const saveUserAvatar = async () => {
    const indices = {
      colorIndex:   avatarImages.color.indexOf(selectedImages.color),
      caraIndex:    avatarImages.cara.indexOf(selectedImages.cara),
      cabelloIndex: avatarImages.cabello.indexOf(selectedImages.cabello),
      camisaIndex:  avatarImages.camisa.indexOf(selectedImages.camisa),
      shortIndex:   avatarImages.short.indexOf(selectedImages.short),
      piesIndex:    avatarImages.pies.indexOf(selectedImages.pies),
    };
    await AsyncStorage.setItem("avatar", JSON.stringify(indices));
    ToastAndroid.showWithGravity("¡Avatar guardado!", ToastAndroid.SHORT, ToastAndroid.CENTER);
    router.navigate("/settings");
  };

  useFocusEffect(useCallback(() => { getUserAvatar(); }, []));

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <View style={{ flex: 1, backgroundColor: '#f1f5f9' }}>
        <StatusBar backgroundColor="#0d5692" hidden={false} translucent={true} />
        <View style={{ marginTop: StatusBar.currentHeight }} />

        {/* Header */}
        <View style={styles.header}>
          <Pressable style={styles.backBtn} onPress={() => router.back()}>
            <AntDesign name="left" size={22} color="#0369a1" />
          </Pressable>
          <Text style={styles.headerTitle}>Mi Avatar</Text>
          <Pressable style={styles.saveBtn} onPress={saveUserAvatar}>
            <AntDesign name="check" size={20} color="#fff" />
          </Pressable>
        </View>

        {/* Zona del avatar — destino del drag */}
        <View
          ref={avatarViewRef}
          collapsable={false}
          onLayout={measureAvatar}
          style={[styles.avatarZone, dropping && styles.avatarZoneActive]}
        >
          <View style={styles.avatarContainer}>
            {Object.values(selectedImages).map((img, i) => (
              <Image key={i} source={img} style={styles.avatarLayer} />
            ))}
          </View>
          {dropping ? (
            <View style={styles.dropBadge}>
              <Text style={styles.dropBadgeText}>✓</Text>
            </View>
          ) : (
            <View style={styles.hintPill}>
              <Text style={styles.hintText}>Mantén presionada una prenda y arrástrala aquí</Text>
            </View>
          )}
        </View>

        {/* Carruseles */}
        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 90 }}>
          {Object.keys(avatarImages).map((category) => (
            <View key={category} style={styles.categoryBlock}>
              <Text style={styles.categoryLabel}>{LABELS[category]}</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ paddingHorizontal: 14, gap: 10, paddingVertical: 6 }}
              >
                {avatarImages[category].map((image, index) => {
                  const isSelected = selectedImages[category] === image;
                  return (
                    <Pressable key={index} onPress={() => handleTap(category, index)}>
                      <DraggableItem
                        image={image}
                        category={category}
                        index={index}
                        isSelected={isSelected}
                        onDrop={handleDrop}
                        avatarBounds={avatarBounds}
                      />
                    </Pressable>
                  );
                })}
              </ScrollView>
            </View>
          ))}

          <Pressable style={styles.btnGuardar} onPress={saveUserAvatar}>
            <Text style={styles.btnGuardarText}>Guardar avatar</Text>
          </Pressable>
        </ScrollView>

        <SmallTabs />
      </View>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  backBtn: {
    backgroundColor: '#e2e8f0',
    padding: 8,
    borderRadius: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontFamily: 'PlayChickens',
    color: '#0c4a6e',
  },
  saveBtn: {
    backgroundColor: '#0c4a6e',
    padding: 10,
    borderRadius: 8,
  },
  avatarZone: {
    height: 230,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    borderBottomWidth: 2,
    borderBottomColor: '#e2e8f0',
  },
  avatarZoneActive: {
    backgroundColor: '#dbeafe',
    borderBottomColor: '#3b82f6',
  },
  avatarContainer: {
    width: 190,
    height: 190,
    position: 'relative',
  },
  avatarLayer: {
    width: 190,
    height: 190,
    position: 'absolute',
  },
  dropBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: '#22c55e',
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dropBadgeText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  hintPill: {
    position: 'absolute',
    bottom: 8,
    backgroundColor: 'rgba(0,0,0,0.10)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 50,
  },
  hintText: {
    fontSize: 10,
    fontFamily: 'Slaberlin',
    color: '#475569',
    textAlign: 'center',
  },
  categoryBlock: {
    marginTop: 10,
    backgroundColor: '#fff',
    paddingTop: 10,
    paddingBottom: 4,
    borderRadius: 12,
    marginHorizontal: 8,
    marginBottom: 4,
    elevation: 1,
  },
  categoryLabel: {
    fontSize: 13,
    fontFamily: 'SlaberlinBold',
    color: '#64748b',
    paddingHorizontal: 14,
    marginBottom: 4,
  },
  draggable: {
    width: 86,
    height: 86,
    borderRadius: 10,
    overflow: 'hidden',
    backgroundColor: '#f8fafc',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  draggableSelected: {
    borderColor: '#0369a1',
  },
  draggableImg: {
    width: 86,
    height: 86,
  },
  selectedBadge: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    backgroundColor: '#0369a1',
    width: 16,
    height: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnGuardar: {
    backgroundColor: '#0c4a6e',
    marginHorizontal: 24,
    paddingVertical: 16,
    borderRadius: 50,
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 10,
  },
  btnGuardarText: {
    color: '#fff',
    fontSize: 17,
    fontFamily: 'SlaberlinBold',
  },
});
