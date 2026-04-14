import { View, Text, Pressable, Keyboard, Image } from "react-native";
import { Feather } from "@expo/vector-icons";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { router, usePathname } from "expo-router";
import { useEffect, useState } from "react";

export default function Tabs() {
  const pathname = usePathname();
  const [isOpen, setOpen] = useState(false);

  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener("keyboardDidShow", () => {
      setOpen(true);
    });
    const keyboardDidHideListener = Keyboard.addListener("keyboardDidHide", () => {
      setOpen(false);
    });
    return () => {
      keyboardDidShowListener.remove();
      keyboardDidHideListener.remove();
    };
  }, []);

  const isEmotionsActive = pathname === '/emotions' || pathname === '/galery' || pathname === '/report';
  const isHomeActive     = pathname === '/home';
  const isProfileActive  = pathname === '/settings';

  return (
    <View
      className={`bg-white rounded-t-xl w-screen px-8 py-5 absolute bottom-0 ${
        isOpen ? "hidden" : ""
      }`}
    >
      <View className="flex items-center justify-between flex-row">
        <Pressable onPress={() => router.replace("/home")} className="flex items-center">
          <Feather
            name="home"
            size={28}
            color={isHomeActive ? "#0369a1" : "rgb(107,114,128)"}
          />
          <Text className={`${isHomeActive ? "text-sky-800 font-slabold" : "text-gray-500 font-slabold"} text-center`}>
            Inicio
          </Text>
        </Pressable>

        <Pressable onPress={() => router.replace("/emotions")} className="flex items-center justify-center">
          <Image
            source={require("../assets/images/SCANTEATE LOGO FIGURA.png")}
            style={{ width: 33, height: 33 }}
            resizeMode="contain"
          />
          <Text className={`${isEmotionsActive ? "text-sky-800 font-slabold" : "text-gray-500 font-slabold"} text-center`}>
            Emociones
          </Text>
        </Pressable>

        <Pressable onPress={() => router.replace("/settings")} className="flex items-center">
          <MaterialCommunityIcons
            name="account-circle-outline"
            size={28}
            color={isProfileActive ? "#0369a1" : "rgb(107,114,128)"}
          />
          <Text className={`${isProfileActive ? "text-sky-800 font-slabold" : "text-gray-500 font-slabold"} text-center`}>
            Mi Perfil
          </Text>
        </Pressable>
      </View>
    </View>
  );
}
