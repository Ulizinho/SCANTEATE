import { useState, useCallback, useRef } from 'react';
import {
  View, Text, Pressable, StyleSheet, StatusBar,
  ToastAndroid, FlatList, Switch,
} from 'react-native';
import Slider from '@react-native-community/slider'; 
import { router } from 'expo-router';
import { AntDesign } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import { useBiometrics } from '../hooks/useBiometrics';

const ITEM_H = 52;
const rango = (max) => Array.from({ length: max + 1 }, (_, i) => i);

function ScrollPicker({ value, max, onChange, label }) {
  const listRef = useRef(null);
  const datos = rango(max);

  const onScrollEnd = (e) => {
    const idx = Math.round(e.nativeEvent.contentOffset.y / ITEM_H);
    const clamped = Math.max(0, Math.min(idx, max));
    onChange(clamped);
  };

  return (
    <View style={sp.container}>
      <View style={sp.selIndicator} pointerEvents="none" />
      <FlatList
        ref={listRef}
        data={datos}
        keyExtractor={(item) => String(item)}
        showsVerticalScrollIndicator={false}
        snapToInterval={ITEM_H}
        decelerationRate="fast"
        onMomentumScrollEnd={onScrollEnd}
        getItemLayout={(_, index) => ({ length: ITEM_H, offset: ITEM_H * index, index })}
        initialScrollIndex={value}
        contentContainerStyle={{ paddingVertical: ITEM_H }}
        renderItem={({ item }) => (
          <View style={sp.item}>
            <Text style={[sp.numText, item === value && sp.numTextActivo]}>
              {String(item).padStart(2, '0')}
            </Text>
          </View>
        )}
      />
      <Text style={sp.label}>{label}</Text>
    </View>
  );
}

export default function Timer() {
  const [horas, setHoras] = useState(0);
  const [minutos, setMinutos] = useState(30);
  const [segundos, setSegundos] = useState(0);
  const [activo, setActivo] = useState(false);
  const [pausado, setPausado] = useState(false);
  const [segundosCongelados, setSegundosCongelados] = useState(0);
  const [autorizado, setAutorizado] = useState(false);
  
  const [volumen, setVolumen] = useState(0.5);
  const [conVibracion, setConVibracion] = useState(true);
  
  const { pedir } = useBiometrics();

  useFocusEffect(useCallback(() => {
    const verificar = async () => {
      await AsyncStorage.setItem('huellaAbierta', 'true');
      const ok = await pedir('Acceso al Panel de Control');
      await AsyncStorage.removeItem('huellaAbierta');

      if (!ok) {
        router.back();
        return;
      }
      
      setAutorizado(true);
      const res = await AsyncStorage.getItem('timerConfig');
      if (res) {
        const data = JSON.parse(res);
        setHoras(data.horas || 0);
        setMinutos(data.minutos ?? 30);
        setSegundos(data.segundos || 0);
        setActivo(data.activo || false);
        setPausado(data.pausado || false);
        setSegundosCongelados(data.segundosRestantes || 0);
        setVolumen(data.volumen ?? 0.5);
        setConVibracion(data.conVibracion ?? true);
      }
    };
    verificar();
  }, []));

  const guardarYActivar = async () => {
    const totalSeg = horas * 3600 + minutos * 60 + segundos;
    if (totalSeg < 10) {
      ToastAndroid.show('Configura al menos 10 segundos', ToastAndroid.SHORT);
      return;
    }
    
    const config = {
      horas, minutos, segundos,
      volumen,
      conVibracion,
      activo: true,
      pausado: false,
      alertaActivada: false, 
      finEpoch: Date.now() + totalSeg * 1000,
    };

    await AsyncStorage.setItem('timerConfig', JSON.stringify(config));
    ToastAndroid.show('⏱ Búnker activado', ToastAndroid.SHORT);
    router.replace('/home');
  };

  const reanudar = async () => {
    const res = await AsyncStorage.getItem('timerConfig');
    const data = JSON.parse(res);

    const config = {
      ...data,
      pausado: false,
      alertaActivada: false,
      finEpoch: Date.now() + (segundosCongelados * 1000), // Retoma desde donde se quedó
    };

    await AsyncStorage.setItem('timerConfig', JSON.stringify(config));
    ToastAndroid.show('▶️ Búnker Reanudado', ToastAndroid.SHORT);
    router.replace('/home');
  };

  const desactivar = async () => {
    await AsyncStorage.setItem('huellaAbierta', 'true');
    const ok = await pedir('Confirmar Desactivación');
    await AsyncStorage.removeItem('huellaAbierta');
    
    if (ok) {
      await AsyncStorage.removeItem('timerConfig');
      setActivo(false);
      setPausado(false);
      ToastAndroid.show('🛡️ Búnker Liberado', ToastAndroid.SHORT);
      router.replace('/home');
    }
  };

  if (!autorizado) return <View style={{ flex: 1, backgroundColor: '#f1f5f9' }} />;

  return (
    <View style={{ flex: 1, backgroundColor: '#f1f5f9' }}>
      <StatusBar backgroundColor="#0d5692" barStyle="light-content" translucent={true} />
      <View style={{ marginTop: StatusBar.currentHeight + 15 }} />

      <View style={s.header}>
        <Pressable style={s.backBtn} onPress={() => router.back()}>
          <AntDesign name="left" size={22} color="#fff" />
        </Pressable>
        <Text style={s.headerTitle}>Panel del Búnker</Text>
      </View>

      <View style={{ padding: 16 }}>
        {activo && (
          <View style={[s.activoBanner, pausado && s.pausadoBanner]}>
            <View>
              <Text style={[s.activoBannerText, pausado && {color: '#92400e'}]}>
                {pausado ? '⏸️ BÚNKER EN PAUSA' : '🛡️ SISTEMA PROTEGIDO'}
              </Text>
              <Text style={{fontSize: 10, color: pausado ? '#92400e' : '#1e293b'}}>
                {pausado ? 'El tiempo no está corriendo' : 'El tiempo está corriendo'}
              </Text>
            </View>
            <Pressable style={s.desactivarBtn} onPress={desactivar}>
              <Text style={s.desactivarText}>Liberar</Text>
            </Pressable>
          </View>
        )}

        <View style={s.card}>
          <Text style={s.cardTitle}>⏰ Tiempo de Bloqueo</Text>
          <View style={s.carruselRow}>
            <ScrollPicker value={horas} max={23} onChange={setHoras} label="hrs" />
            <Text style={s.sep}>:</Text>
            <ScrollPicker value={minutos} max={59} onChange={setMinutos} label="min" />
            <Text style={s.sep}>:</Text>
            <ScrollPicker value={segundos} max={59} onChange={setSegundos} label="seg" />
          </View>
        </View>

        <View style={s.card}>
          <Text style={s.cardTitle}>⚙️ Ajustes de Alarma</Text>
          <View style={s.rowAjuste}>
            <Text style={s.cardSub}>Vibración al salir</Text>
            <Switch 
              value={conVibracion} 
              onValueChange={setConVibracion}
              trackColor={{ false: "#cbd5e1", true: "#7dd3fc" }}
              thumbColor={conVibracion ? "#0c4a6e" : "#f4f3f4"}
            />
          </View>

          <Text style={[s.cardSub, { marginTop: 10 }]}>Volumen: {Math.round(volumen * 100)}%</Text>
          <Slider
            style={{ width: '100%', height: 40 }}
            minimumValue={0}
            maximumValue={1}
            value={volumen}
            onSlidingComplete={setVolumen}
            minimumTrackTintColor="#0c4a6e"
            thumbTintColor="#0369a1"
          />
        </View>

        <Pressable 
          style={[s.btnActivar, pausado && s.btnReanudar]} 
          onPress={pausado ? reanudar : guardarYActivar}
        >
          <AntDesign name={pausado ? "play" : "lock"} size={20} color="#fff" />
          <Text style={s.btnActivarText}>
            {pausado ? 'Reanudar Búnker' : (activo ? 'Reiniciar Tiempo' : 'Activar y Bloquear')}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const sp = StyleSheet.create({
  container: { height: ITEM_H * 3, width: 75, overflow: 'hidden', alignItems: 'center' },
  selIndicator: { position: 'absolute', top: ITEM_H, left: 0, right: 0, height: ITEM_H, backgroundColor: '#0c4a6e', borderRadius: 12 },
  item: { height: ITEM_H, width: 75, alignItems: 'center', justifyContent: 'center' },
  numText: { fontSize: 24, color: '#94a3b8' },
  numTextActivo: { color: '#fff', fontSize: 28, fontWeight: 'bold' },
  label: { fontSize: 10, color: '#94a3b8', marginTop: 2 },
});

const s = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, gap: 15 },
  backBtn: { backgroundColor: '#0369a1', padding: 10, borderRadius: 12 },
  headerTitle: { fontSize: 24, fontWeight: 'bold', color: '#0c4a6e' },
  activoBanner: { backgroundColor: '#f1f5f9', borderRadius: 16, padding: 18, marginBottom: 15, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderWidth: 1, borderColor: '#cbd5e1' },
  pausadoBanner: { backgroundColor: '#fef3c7', borderColor: '#fcd34d' },
  activoBannerText: { color: '#0c4a6e', fontWeight: 'bold', fontSize: 14 },
  desactivarBtn: { backgroundColor: '#dc2626', paddingVertical: 10, paddingHorizontal: 15, borderRadius: 10 },
  desactivarText: { color: '#fff', fontWeight: 'bold', fontSize: 12 },
  card: { backgroundColor: '#fff', borderRadius: 20, padding: 20, marginBottom: 15, elevation: 3 },
  cardTitle: { fontSize: 16, fontWeight: 'bold', color: '#0c4a6e', marginBottom: 12 },
  cardSub: { fontSize: 13, color: '#64748b' },
  rowAjuste: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  carruselRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  sep: { fontSize: 24, fontWeight: 'bold', color: '#cbd5e1', marginHorizontal: 5 },
  btnActivar: { backgroundColor: '#0c4a6e', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, paddingVertical: 18, borderRadius: 50, marginTop: 10 },
  btnReanudar: { backgroundColor: '#d97706' },
  btnActivarText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
});