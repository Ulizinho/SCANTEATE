import { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router, usePathname } from 'expo-router';
import { AntDesign } from '@expo/vector-icons';

function formatTiempo(seg) {
  const h = Math.floor(seg / 3600);
  const m = Math.floor((seg % 3600) / 60);
  const s = seg % 60;
  if (h > 0) return `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
  return `${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
}

// Pantallas donde NO mostramos el timer flotante
const EXCLUIR = ['/bloqueado', '/timer', '/index', '/loginBefore', '/login', '/register'];

export default function TimerFlotante() {
  const [restante, setRestante] = useState(null); // null = no activo
  const intervalRef = useRef(null);
  const pathname = usePathname();

  const tick = async () => {
    try {
      const data = JSON.parse(await AsyncStorage.getItem('timerConfig'));
      if (!data?.activo || !data?.finEpoch) {
        setRestante(null);
        clearInterval(intervalRef.current);
        return;
      }
      const diff = Math.max(0, Math.ceil((data.finEpoch - Date.now()) / 1000));
      setRestante(diff);
      if (diff <= 0) {
        clearInterval(intervalRef.current);
        setRestante(null);
        await AsyncStorage.setItem('timerConfig', JSON.stringify({ activo: false }));
        router.replace('/bloqueado');
      }
    } catch (e) {}
  };

  useEffect(() => {
    tick(); // chequeo inicial
    intervalRef.current = setInterval(tick, 1000);
    return () => clearInterval(intervalRef.current);
  }, []);

  // No mostrar en pantallas excluidas o si no hay timer
  if (restante === null) return null;
  if (EXCLUIR.some(p => pathname === p || pathname?.startsWith(p))) return null;

  // Colores según tiempo restante
  const urgente = restante <= 60;
  const muyUrgente = restante <= 10;

  return (
    <Pressable
      style={[
        styles.pill,
        urgente && styles.pillUrgente,
        muyUrgente && styles.pillMuyUrgente,
      ]}
      onPress={() => router.navigate('/bloqueado')}
    >
      <AntDesign
        name="clockcircle"
        size={12}
        color={muyUrgente ? '#fff' : urgente ? '#fff' : '#0369a1'}
      />
      <Text style={[
        styles.texto,
        urgente && styles.textoUrgente,
      ]}>
        {formatTiempo(restante)}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pill: {
    position: 'absolute',
    top: 48,
    right: 12,
    zIndex: 9999,
    backgroundColor: '#e0f2fe',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 50,
    borderWidth: 1.5,
    borderColor: '#7dd3fc',
    elevation: 6,
  },
  pillUrgente: {
    backgroundColor: '#f97316',
    borderColor: '#ea580c',
  },
  pillMuyUrgente: {
    backgroundColor: '#dc2626',
    borderColor: '#b91c1c',
  },
  texto: {
    fontSize: 13,
    fontFamily: 'SlaberlinBold',
    color: '#0369a1',
  },
  textoUrgente: {
    color: '#fff',
  },
});
