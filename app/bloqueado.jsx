import { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, StatusBar,
  Pressable, BackHandler, AppState,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useBiometrics } from '../hooks/useBiometrics';
import { router } from 'expo-router';

function formatTiempo(seg) {
  const h = Math.floor(seg / 3600);
  const m = Math.floor((seg % 3600) / 60);
  const s = seg % 60;
  if (h > 0) return `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
  return `${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
}

export default function Bloqueado() {
  const [restante, setRestante] = useState(0);
  const [terminado, setTerminado] = useState(false);
  const intervalRef = useRef(null);
  const { pedir } = useBiometrics();

  const calcularRestante = async () => {
    try {
      const data = JSON.parse(await AsyncStorage.getItem('timerConfig'));
      if (!data?.activo || !data?.finEpoch) {
        // No hay timer activo — regresar al home
        router.replace('/home');
        return;
      }
      const diff = Math.max(0, Math.ceil((data.finEpoch - Date.now()) / 1000));
      setRestante(diff);
      if (diff <= 0) {
        setTerminado(true);
        await AsyncStorage.setItem('timerConfig', JSON.stringify({ activo: false }));
      }
    } catch (e) {}
  };

  useEffect(() => {
    calcularRestante();
    intervalRef.current = setInterval(async () => {
      try {
        const data = JSON.parse(await AsyncStorage.getItem('timerConfig'));
        if (!data?.activo || !data?.finEpoch) {
          clearInterval(intervalRef.current);
          router.replace('/home');
          return;
        }
        const diff = Math.max(0, Math.ceil((data.finEpoch - Date.now()) / 1000));
        setRestante(diff);
        if (diff <= 0) {
          clearInterval(intervalRef.current);
          setTerminado(true);
          await AsyncStorage.setItem('timerConfig', JSON.stringify({ activo: false }));
        }
      } catch (e) {}
    }, 1000);

    // Bloquear botón back físico
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      return true; // true = evento consumido, no hace nada
    });

    return () => {
      clearInterval(intervalRef.current);
      backHandler.remove();
    };
  }, []);

  const desbloquearConHuella = async () => {
    const ok = await pedir('Pon tu huella para desbloquear');
    if (ok) {
      clearInterval(intervalRef.current);
      await AsyncStorage.setItem('timerConfig', JSON.stringify({ activo: false }));
      router.replace('/home');
    }
  };

  if (terminado) {
    return (
      <View style={[s.container, { backgroundColor: '#0c4a6e' }]}>
        <StatusBar hidden={true} />
        <Text style={s.emoji}>🎉</Text>
        <Text style={s.tituloTerminado}>¡Tiempo terminado!</Text>
        <Text style={s.subTerminado}>
          ¡Lo hiciste muy bien hoy!{'\n'}Pídele a mamá o papá que te abra la app.
        </Text>
        <Pressable style={s.btnHuella} onPress={desbloquearConHuella}>
          <Text style={s.btnHuellaText}>👆 Papá / Mamá: pon tu huella</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={s.container}>
      <StatusBar hidden={true} />

      {/* Fondo animado — círculo pulsante */}
      <View style={s.circuloFondo} />

      <Text style={s.emoji}>⏱</Text>
      <Text style={s.titulo}>Tiempo de uso</Text>
      <Text style={s.cronometro}>{formatTiempo(restante)}</Text>
      <Text style={s.sub}>
        Sigue jugando y aprendiendo,{'\n'}¡vas muy bien!
      </Text>

      {/* Botón oculto para papá — mantener 3 segundos */}
      <Pressable
        style={s.btnPapaOculto}
        onLongPress={desbloquearConHuella}
        delayLongPress={2000}
      >
        <Text style={s.btnPapaOcultoText}>
          Papá / Mamá:{'\n'}Mantén presionado para desbloquear
        </Text>
      </Pressable>
    </View>
  );
}

const s = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  circuloFondo: {
    position: 'absolute',
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: 'rgba(3,105,161,0.15)',
  },
  emoji: {
    fontSize: 64,
    marginBottom: 12,
  },
  titulo: {
    fontSize: 22,
    fontFamily: 'SlaberlinBold',
    color: '#fff',
    marginBottom: 16,
  },
  cronometro: {
    fontSize: 72,
    fontFamily: 'SlaberlinBold',
    color: '#38bdf8',
    letterSpacing: 4,
    marginBottom: 20,
  },
  sub: {
    fontSize: 16,
    fontFamily: 'Slaberlin',
    color: 'rgba(255,255,255,0.6)',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 60,
  },
  btnPapaOculto: {
    position: 'absolute',
    bottom: 40,
    backgroundColor: 'rgba(255,255,255,0.06)',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  btnPapaOcultoText: {
    color: 'rgba(255,255,255,0.35)',
    fontFamily: 'Slaberlin',
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 18,
  },
  // Pantalla terminado
  tituloTerminado: {
    fontSize: 32,
    fontFamily: 'PlayChickens',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 16,
  },
  subTerminado: {
    fontSize: 18,
    fontFamily: 'Slaberlin',
    color: 'rgba(255,255,255,0.8)',
    textAlign: 'center',
    lineHeight: 28,
    marginBottom: 50,
  },
  btnHuella: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: 28,
    paddingVertical: 16,
    borderRadius: 50,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  btnHuellaText: {
    color: '#fff',
    fontFamily: 'SlaberlinBold',
    fontSize: 15,
  },
});
