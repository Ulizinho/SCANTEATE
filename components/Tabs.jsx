import { View, Text, Pressable, Keyboard, Image, StyleSheet, Dimensions } from "react-native";
import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import { router, usePathname } from "expo-router";
import { useEffect, useState } from "react";

const { width } = Dimensions.get('window');

export default function Tabs() {
  const pathname = usePathname();
  const [isOpen, setOpen] = useState(false);

  useEffect(() => {
    const show = Keyboard.addListener("keyboardDidShow", () => setOpen(true));
    const hide = Keyboard.addListener("keyboardDidHide", () => setOpen(false));
    return () => { show.remove(); hide.remove(); };
  }, []);

  if (isOpen) return null;

  const isEmotionsActive = pathname === '/emotions' || pathname === '/galery' || pathname === '/report';
  const isHomeActive     = pathname === '/home';
  const isProfileActive  = pathname === '/settings';

  return (
    <View style={styles.container}>
      <View style={styles.inner}>
        <Pressable onPress={() => router.replace("/home")} style={styles.tab}>
          <Feather name="home" size={28} color={isHomeActive ? "#0369a1" : "#6b7280"} />
          <Text style={[styles.text, isHomeActive && styles.textActive]}>Inicio</Text>
        </Pressable>

        <Pressable onPress={() => router.replace("/emotions")} style={styles.tab}>
          <Image 
            source={require("../assets/images/SCANTEATE LOGO FIGURA.png")} 
            style={{ width: 30, height: 30 }} 
            resizeMode="contain" 
          />
          <Text style={[styles.text, isEmotionsActive && styles.textActive]}>Emociones</Text>
        </Pressable>

        <Pressable onPress={() => router.replace("/settings")} style={styles.tab}>
          <MaterialCommunityIcons name="account-circle-outline" size={28} color={isProfileActive ? "#0369a1" : "#6b7280"} />
          <Text style={[styles.text, isProfileActive && styles.textActive]}>Perfil</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    width: width, // Ancho exacto de la pantalla
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 20,
    paddingVertical: 10,
    elevation: 20, // Sombra en Android
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
  },
  inner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  tab: { alignItems: 'center', flex: 1 },
  text: { fontSize: 12, color: '#6b7280', fontFamily: 'SlaberlinBold' },
  textActive: { color: '#0369a1' }
});