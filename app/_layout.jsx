import { Stack, router } from 'expo-router';
import React, { useState, useEffect, useRef } from 'react';
import { AppState } from 'react-native';
import '../assets/css/glogal.css';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import AsyncStorage from '@react-native-async-storage/async-storage';
import TimerFlotante from '../components/TimerFlotante';

SplashScreen.preventAutoHideAsync();

// Verifica si hay timer activo y redirige a la pantalla de bloqueo
const verificarTimer = async () => {
  try {
    const data = JSON.parse(await AsyncStorage.getItem('timerConfig'));
    if (data?.activo && data?.finEpoch) {
      const restante = data.finEpoch - Date.now();
      if (restante > 0) {
        router.replace('/bloqueado');
        return true;
      } else {
        // Timer expirado — limpiar
        await AsyncStorage.setItem('timerConfig', JSON.stringify({ activo: false }));
      }
    }
  } catch (e) {}
  return false;
};

export default function RootLayout() {
  const [loaded, error] = useFonts({
    'PlayChickens': require('../assets/fonts/PlayChickens.otf'),
    'AmberyGarden': require('../assets/fonts/AmberyGarden.ttf'),
    'SuperFeel': require('../assets/fonts/GrislyBeast.ttf'),
    'Slaberlin': require('../assets/fonts/Slaberlin.ttf'),
    'SlaberlinBold': require('../assets/fonts/SlaberlinBold.ttf'),
  });
  const [appState, setAppState] = useState(AppState.currentState);
  const [sessionStart, setSessionStart] = useState(null);
  const appStateRef = useRef(AppState.currentState);

  useEffect(() => {
    if (loaded || error) {
      SplashScreen.hideAsync();
      // Verificar timer al arrancar la app
      verificarTimer();
    }

    const handleAppStateChange = async (nextAppState) => {
      const prev = appStateRef.current;
      appStateRef.current = nextAppState;

      if (prev.match(/inactive|background/) && nextAppState === 'active') {
        // App vuelve al frente — verificar si el timer sigue activo
        const bloqueada = await verificarTimer();
        if (!bloqueada) {
          const start = new Date().toISOString();
          setSessionStart(start);
        }
      }

      if (prev === 'active' && nextAppState.match(/inactive|background/)) {
        const sessionEnd = new Date().toISOString();
        const sessionDuration = Math.floor(
          (new Date(sessionEnd) - new Date(sessionStart)) / 1000
        );
        sendSessionData(sessionStart, sessionEnd, sessionDuration);
      }

      setAppState(nextAppState);
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => subscription.remove();
  }, [loaded, error, sessionStart]);

  const sendSessionData = async (start, end, duration) => {
    try {
      const us = JSON.parse(await AsyncStorage.getItem('user'));
      if (!us) return;
      const sessions = JSON.parse(await AsyncStorage.getItem('sessions')) || [];
      sessions.push({ userId: us.id, start, end, duration });
      await AsyncStorage.setItem('sessions', JSON.stringify(sessions));
    } catch (error) {
      console.error('Error al registrar la sesión', error);
    }
  };

  if (!loaded && !error) return null;

  return (
    <>
      <Stack screenOptions={{ headerShown: false }} style={{ fontFamily: 'PlayChickens' }} />
      <TimerFlotante />
    </>
  );
}
