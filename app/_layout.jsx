import { Stack } from 'expo-router';
import React, { useState, useEffect, useRef } from 'react';
import { 
  BackHandler, Modal, View, Text, Pressable, StyleSheet, 
  AppState, Vibration, Dimensions, Platform, ImageBackground, Image 
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { Audio } from 'expo-av';
import { AntDesign } from '@expo/vector-icons';

// Componentes y Hooks Propios
import TimerFlotante from '../components/TimerFlotante'; 
import { useBiometrics } from '../hooks/useBiometrics';
import "../assets/css/native-styles.css";

// 1. IMPORTACIÓN DEL GIF NEON
import portAlarm from '../assets/images/port_alarm.jpeg'; 

SplashScreen.preventAutoHideAsync();

// Responsividad
const { width } = Dimensions.get('window');
const scaleFont = (size) => (width / 375) * size;

export default function RootLayout() {
  // CARGA DE RECURSOS
  const [loaded, error] = useFonts({
    'PlayChickens': require('../assets/fonts/PlayChickens.otf'),
    'AmberyGarden': require('../assets/fonts/AmberyGarden.ttf'),
    'SuperFeel': require('../assets/fonts/GrislyBeast.ttf'),
    'Slaberlin': require('../assets/fonts/Slaberlin.ttf'),
    'SlaberlinBold': require('../assets/fonts/SlaberlinBold.ttf'),
  });

  const [alertaEscape, setAlertaEscape] = useState(false);
  const [menuSalida, setMenuSalida] = useState(false);
  const { pedir } = useBiometrics();
  
  const sonidoRef = useRef(null);
  const saliendoLegalmente = useRef(false); 
  const backPressCount = useRef(0);

  // SISTEMA DE AUDIO
  const manejarAlarma = async (activar) => {
    try {
      if (activar) {
        if (sonidoRef.current) return;
        await Audio.setAudioModeAsync({ 
          staysActiveInBackground: true, 
          playsInSilentModeIOS: true,
          interruptionModeIOS: 1,
          shouldDuckAndroid: false,
          playThroughEarpieceAndroid: false,
          interruptionModeAndroid: 1,
        });

        const { sound } = await Audio.Sound.createAsync(
          require('../assets/audio/alarma.mp3'),
          { shouldPlay: true, isLooping: true, volume: 1.0 }
        );
        sonidoRef.current = sound;
        Vibration.vibrate([500, 1000], true);
      } else {
        if (sonidoRef.current) {
          await sonidoRef.current.stopAsync();
          await sonidoRef.current.unloadAsync();
          sonidoRef.current = null;
        }
        Vibration.cancel();
      }
    } catch (e) { console.log("Error Alarma:", e); }
  };

  // VIGILANTE DE ESTADO
  useEffect(() => {
    if (loaded || error) SplashScreen.hideAsync();

    const handleAppState = async (nextState) => {
      const res = await AsyncStorage.getItem('timerConfig');
      if (!res) return;
      const data = JSON.parse(res);
      if (!data.activo || data.pausado) return;

      if (nextState === 'active') {
        saliendoLegalmente.current = false;
        await AsyncStorage.setItem('huellaAbierta', 'false');
        if (data.alertaActivada) setAlertaEscape(true);
      }

      if (nextState === 'inactive' || nextState === 'background') {
        const huellaEnUso = await AsyncStorage.getItem('huellaAbierta');
        if (huellaEnUso !== 'true' && !saliendoLegalmente.current) {
          const rest = Math.max(0, Math.ceil((data.finEpoch - Date.now()) / 1000));
          await AsyncStorage.setItem('timerConfig', JSON.stringify({ 
            ...data, segundosRestantes: rest, alertaActivada: true 
          }));
          manejarAlarma(true);
        }
      }
    };

    const backAction = () => {
      backPressCount.current += 1;
      if (backPressCount.current === 3) {
        setMenuSalida(true);
        backPressCount.current = 0;
      }
      setTimeout(() => { backPressCount.current = 0; }, 2000);
      return true;
    };

    const sub = AppState.addEventListener('change', handleAppState);
    const backHandler = BackHandler.addEventListener('hardwareBackPress', backAction);

    return () => {
      sub.remove();
      backHandler.remove();
    };
  }, [loaded, error]);

  // FUNCIONES DE BIO-AUTORIZACIÓN
  const salirBunker = async () => {
    setMenuSalida(false); 
    await AsyncStorage.setItem('huellaAbierta', 'true');
    const ok = await pedir('Autorización Requerida');
    
    if (ok) {
      saliendoLegalmente.current = true;
      const res = await AsyncStorage.getItem('timerConfig');
      const d = JSON.parse(res);
      const rest = Math.max(0, Math.ceil((d.finEpoch - Date.now()) / 1000));
      
      await AsyncStorage.setItem('timerConfig', JSON.stringify({ 
        ...d, pausado: true, segundosRestantes: rest, alertaActivada: false 
      }));

      await manejarAlarma(false);
      setTimeout(() => { BackHandler.exitApp(); }, 300);
    } else {
      await AsyncStorage.setItem('huellaAbierta', 'false');
    }
  };

  const reanudarBunker = async () => {
    await AsyncStorage.setItem('huellaAbierta', 'true');
    const ok = await pedir('Identificación Administrador');
    
    if (ok) {
      await manejarAlarma(false);
      setAlertaEscape(false);
      const res = await AsyncStorage.getItem('timerConfig');
      const d = JSON.parse(res);
      
      await AsyncStorage.setItem('timerConfig', JSON.stringify({ 
        ...d, alertaActivada: false, pausado: true 
      }));
    }
    await AsyncStorage.setItem('huellaAbierta', 'false');
  };

  if (!loaded && !error) return null;

  return (
    <View style={{ flex: 1, backgroundColor: '#fff' }}>
      <Stack screenOptions={{ headerShown: false }} />
      <TimerFlotante />

      {/* MODAL SALIDA LEGAL (PAUSA) */}
      <Modal visible={menuSalida} transparent animationType="fade">
        <View style={ms.overlay}>
          <View style={ms.card}>
            <AntDesign name="lock" size={scaleFont(40)} color="#0c4a6e" />
            <Text style={[ms.titulo, { fontSize: scaleFont(20), fontFamily: 'SlaberlinBold' }]}>Sesión Activa</Text>
            <Text style={[ms.subtitulo, { fontSize: scaleFont(14), fontFamily: 'Slaberlin' }]}>Usa tu huella para pausar y salir legalmente.</Text>
            
            <Pressable style={ms.btnSalir} onPress={salirBunker}>
              <Text style={ms.textBtn}>Pausar y Salir</Text>
            </Pressable>

            <Pressable onPress={() => setMenuSalida(false)} style={{marginTop: 20}}>
              <Text style={{color:'#64748b', fontFamily: 'Slaberlin'}}>Volver al Búnker</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      {/* MODAL CASTIGO ESTILO PORTADA DE JUEGO */}
      <Modal visible={alertaEscape} animationType="fade">
        <ImageBackground 
          source={portAlarm} 
          style={{ flex: 1, width: '100%', height: '100%' }}
          resizeMode="cover"
        >
          {/* Overlay más transparente (0.1) para máximo brillo de la imagen */}
          <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.1)', alignItems: 'center' }}> 
            
            {/* VISTA ESPACIADORA (Empuja el botón hacia arriba) */}
            <View style={{ flex: 0.8 }} /> 
            
            <Pressable 
              style={{ 
                backgroundColor: '#aeff00', // AMARILLO VIBRANTE
                flexDirection: 'row', 
                paddingVertical: 18, 
                paddingHorizontal: 30, 
                borderRadius: 100, 
                alignItems: 'center', 
                elevation: 15,
                shadowColor: '#000',
                shadowOpacity: 0.3,
                shadowRadius: 10,
                marginBottom: 100 // Ajusta este valor para subir o bajar el botón manualmente
              }} 
              onPress={reanudarBunker}
            >
              {/* Icono de desbloqueo (unlock) */}
              <AntDesign name="unlock" size={scaleFont(28)} color="#000" />
              <Text style={{ 
                color: '#000', 
                fontFamily: 'SuperFeel', 
                fontSize: scaleFont(20), 
                marginLeft: 15,
                textTransform: 'uppercase'
              }}>
                DETENER ALARMA
              </Text>
            </Pressable>

            {/* Espacio extra abajo si quieres que no pegue al fondo */}
            <View style={{ flex: 0.1 }} />

          </View>
        </ImageBackground>
      </Modal>
    </View>
  );
}

const ms = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.9)', justifyContent: 'center', alignItems: 'center' },
  card: { width: '85%', backgroundColor: '#fff', borderRadius: 30, padding: 30, alignItems: 'center', elevation: 15 },
  titulo: { color: '#1e293b', marginTop: 15 },
  subtitulo: { color: '#64748b', textAlign: 'center', marginVertical: 15 },
  btnSalir: { backgroundColor: '#0c4a6e', width: '100%', paddingVertical: 18, borderRadius: 15, alignItems: 'center' },
  textBtn: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
});