import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Pressable, Text, StatusBar, Image, useWindowDimensions } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { AntDesign, MaterialCommunityIcons } from '@expo/vector-icons';
import { Audio } from 'expo-av';

export default function CuentoViewer() {
  const { width, height } = useWindowDimensions(); // Hook para responsividad real
  const { cuentoData } = useLocalSearchParams();
  const cuento = JSON.parse(cuentoData);
  
  const [currentPage, setCurrentPage] = useState(0);
  const [sound, setSound] = useState(null);
  const [isMuted, setIsMuted] = useState(false);

  // EFECTO 1: Para el audio cuando el usuario activa el Mute manualmente
  useEffect(() => {
    if (isMuted && sound) {
      sound.stopAsync(); // Se calla al instante
    }
  }, [isMuted]);

  async function playPageAudio(index, forcePlay = false) {
    if (isMuted && !forcePlay) return;

    try {
      if (sound) {
        await sound.unloadAsync();
      }

      const { sound: newSound } = await Audio.Sound.createAsync(
        cuento.pages[index].audio,
        { shouldPlay: true }
      );
      
      setSound(newSound);
    } catch (error) {
      console.log("Error de audio:", error);
    }
  }

  useEffect(() => {
    playPageAudio(currentPage);
    return () => {
      if (sound) sound.unloadAsync();
    };
  }, [currentPage]);

  const next = () => {
    if (currentPage < cuento.pages.length - 1) setCurrentPage(currentPage + 1);
    else router.back();
  };

  const prev = () => {
    if (currentPage > 0) setCurrentPage(currentPage - 1);
  };

  const currentData = cuento.pages[currentPage];

  // Cálculo de tamaños responsivos basados en el ancho de pantalla
  const isTablet = width > 600;
  const dynamicFontSize = isTablet ? width * 0.04 : width * 0.06;
  const iconSize = isTablet ? 40 : 30;

  return (
    <View style={styles.container}>
      <StatusBar hidden />
      
      {/* HEADER */}
      <View style={[styles.topBar, { top: height * 0.05 }]}>
        <Pressable style={styles.iconBtn} onPress={() => router.back()}>
          <AntDesign name="close" size={iconSize * 0.8} color="#fff" />
        </Pressable>

        <Pressable 
          style={[styles.iconBtn, isMuted && styles.mutedBtn]} 
          onPress={() => setIsMuted(!isMuted)}
        >
          <MaterialCommunityIcons 
            name={isMuted ? "volume-off" : "volume-high"} 
            size={iconSize * 0.8} 
            color="#fff" 
          />
        </Pressable>
      </View>

      {/* ÁREA DE IMAGEN (Adaptable) */}
      <View style={[styles.imageBox, { flex: isTablet ? 1.5 : 1.1 }]}>
        <Image source={currentData.img} style={styles.mainImg} resizeMode="contain" />
        <Pressable 
          style={[styles.listenAgain, { padding: isTablet ? 20 : 12 }]} 
          onPress={() => playPageAudio(currentPage, true)}
        >
          <AntDesign name="sound" size={iconSize} color="#fff" />
        </Pressable>
      </View>

      {/* ÁREA DE TEXTO Y CONTROLES */}
      <View style={styles.footer}>
        <View style={styles.textWrapper}>
          <Text style={[styles.pageText, { fontSize: dynamicFontSize }]}>
            {currentData.text}
          </Text>
        </View>

        <View style={styles.navigation}>
          <Pressable onPress={prev} style={[styles.navCircle, currentPage === 0 && { opacity: 0 }]} disabled={currentPage === 0}>
            <AntDesign name="arrowleft" size={iconSize} color="#0c4a6e" />
          </Pressable>

          <View style={styles.pagePill}>
            <Text style={styles.pageCount}>{currentPage + 1} / {cuento.pages.length}</Text>
          </View>

          <Pressable onPress={next} style={[styles.navCircle, styles.nextCircle]}>
            <AntDesign name={currentPage === cuento.pages.length - 1 ? "check" : "arrowright"} size={iconSize} color="#fff" />
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  topBar: { position: 'absolute', left: 0, right: 0, flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 20, zIndex: 10 },
  iconBtn: { backgroundColor: 'rgba(0,0,0,0.3)', padding: 10, borderRadius: 50 },
  mutedBtn: { backgroundColor: '#f43f5e' },
  imageBox: { backgroundColor: '#fff', justifyContent: 'center', width: '100%' },
  mainImg: { width: '100%', height: '100%' },
  listenAgain: { position: 'absolute', bottom: '5%', right: '5%', backgroundColor: '#0369a1', borderRadius: 50, elevation: 5 },
  footer: { 
    flex: 0.9, 
    backgroundColor: '#f1f5f9', 
    borderTopLeftRadius: 40, 
    borderTopRightRadius: 40, 
    padding: '6%', 
    justifyContent: 'space-between',
    elevation: 20,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 10
  },
  textWrapper: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  pageText: { fontFamily: 'SuperFeel', color: '#0f172a', textAlign: 'center', lineHeight: 35, textTransform: 'uppercase' },
  navigation: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 10 },
  navCircle: { width: 60, height: 60, borderRadius: 30, backgroundColor: '#fff', justifyContent: 'center', alignItems: 'center', elevation: 3 },
  nextCircle: { backgroundColor: '#0c4a6e' },
  pagePill: { backgroundColor: '#cbd5e1', paddingHorizontal: 15, paddingVertical: 6, borderRadius: 20 },
  pageCount: { fontSize: 16, fontWeight: 'bold', color: '#475569' }
});