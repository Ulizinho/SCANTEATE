import { useState, useCallback, useRef } from 'react';
import {
  View, Text, Pressable, StyleSheet, StatusBar,
  ToastAndroid, FlatList, Dimensions,
} from 'react-native';
import { router } from 'expo-router';
import { AntDesign } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import { useBiometrics } from '../hooks/useBiometrics';

const ITEM_H = 52; // altura de cada número en el carrusel

// Genera array del 0 al max
const rango = (max) => Array.from({ length: max + 1 }, (_, i) => i);

// Carrusel vertical tipo picker
function ScrollPicker({ value, max, onChange, label }) {
  const listRef = useRef(null);
  const datos = rango(max);

  const scrollTo = (val) => {
    listRef.current?.scrollToIndex({ index: val, animated: true });
  };

  const onScrollEnd = (e) => {
    const idx = Math.round(e.nativeEvent.contentOffset.y / ITEM_H);
    const clamped = Math.max(0, Math.min(idx, max));
    onChange(clamped);
  };

  return (
    <View style={sp.container}>
      {/* Indicador central */}
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
        renderItem={({ item }) => {
          const activo = item === value;
          return (
            <Pressable style={sp.item} onPress={() => { onChange(item); scrollTo(item); }}>
              <Text style={[sp.numText, activo && sp.numTextActivo]}>
                {String(item).padStart(2, '0')}
              </Text>
            </Pressable>
          );
        }}
      />
      <Text style={sp.label}>{label}</Text>
    </View>
  );
}

export default function Timer() {
  const [horas,    setHoras]    = useState(0);
  const [minutos,  setMinutos]  = useState(30);
  const [segundos, setSegundos] = useState(0);
  const [activo,   setActivo]   = useState(false);
  const [autorizado, setAutorizado] = useState(false);
  const { pedir } = useBiometrics();

  useFocusEffect(useCallback(() => {
    setAutorizado(false);
    const verificar = async () => {
      const ok = await pedir('Identifícate para configurar el timer');
      if (!ok) { router.back(); return; }
      setAutorizado(true);
      cargar();
    };
    verificar();
  }, []));

  const cargar = async () => {
    try {
      const data = JSON.parse(await AsyncStorage.getItem('timerConfig'));
      if (data) {
        setHoras(data.horas || 0);
        setMinutos(data.minutos ?? 30);
        setSegundos(data.segundos || 0);
        setActivo(data.activo || false);
      }
    } catch (e) {}
  };

  const guardarYActivar = async () => {
    const totalSeg = horas * 3600 + minutos * 60 + segundos;
    if (totalSeg < 10) {
      ToastAndroid.showWithGravity('Configura al menos 10 segundos', ToastAndroid.LONG, ToastAndroid.CENTER);
      return;
    }
    await AsyncStorage.setItem('timerConfig', JSON.stringify({
      horas, minutos, segundos,
      activo: true,
      finEpoch: Date.now() + totalSeg * 1000,
    }));
    ToastAndroid.showWithGravity('⏱ Timer activado', ToastAndroid.SHORT, ToastAndroid.CENTER);
    router.replace('/home');
  };

  const desactivar = async () => {
    const ok = await pedir('Pon tu huella para desactivar el timer');
    if (!ok) return;
    await AsyncStorage.setItem('timerConfig', JSON.stringify({ activo: false }));
    setActivo(false);
    ToastAndroid.showWithGravity('Timer desactivado', ToastAndroid.SHORT, ToastAndroid.CENTER);
  };

  if (!autorizado) return <View style={{ flex: 1, backgroundColor: '#f1f5f9' }} />;

  const totalSeg = horas * 3600 + minutos * 60 + segundos;

  return (
    <View style={{ flex: 1, backgroundColor: '#f1f5f9' }}>
      <StatusBar backgroundColor="#0d5692" hidden={false} translucent={true} />
      <View style={{ marginTop: StatusBar.currentHeight }} />

      {/* Header */}
      <View style={s.header}>
        <Pressable style={s.backBtn} onPress={() => router.back()}>
          <AntDesign name="left" size={22} color="#fff" />
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text style={s.headerTitle}>Timer de uso</Text>
          <Text style={s.headerSub}>Controla el tiempo en la app</Text>
        </View>
      </View>

      <View style={{ padding: 16 }}>

        {/* Banner timer activo */}
        {activo && (
          <View style={s.activoBanner}>
            <Text style={s.activoBannerText}>⏱ Timer activo</Text>
            <Pressable style={s.desactivarBtn} onPress={desactivar}>
              <Text style={s.desactivarText}>Desactivar</Text>
            </Pressable>
          </View>
        )}

        {/* Carrusel de tiempo */}
        <View style={s.card}>
          <Text style={s.cardTitle}>⏰ Desliza para configurar el tiempo</Text>
          <Text style={s.cardSub}>Desliza arriba o abajo en cada columna</Text>

          <View style={s.carruselRow}>
            <ScrollPicker value={horas}    max={23} onChange={setHoras}    label="horas"    />
            <Text style={s.sep}>:</Text>
            <ScrollPicker value={minutos}  max={59} onChange={setMinutos}  label="min"      />
            <Text style={s.sep}>:</Text>
            <ScrollPicker value={segundos} max={59} onChange={setSegundos} label="seg"      />
          </View>

          {totalSeg > 0 && (
            <Text style={s.resumen}>
              {'Tiempo seleccionado: '}
              {horas > 0 ? `${horas}h ` : ''}
              {minutos > 0 ? `${minutos}min ` : ''}
              {segundos > 0 ? `${segundos}seg` : ''}
            </Text>
          )}
        </View>

        {/* Presets rápidos */}
        <View style={s.card}>
          <Text style={s.cardTitle}>⚡ Tiempos rápidos</Text>
          <View style={s.presetsRow}>
            {[
              { label: '15 min', h: 0, m: 15, s: 0 },
              { label: '30 min', h: 0, m: 30, s: 0 },
              { label: '45 min', h: 0, m: 45, s: 0 },
              { label: '1 hora', h: 1, m: 0,  s: 0 },
            ].map((p) => {
              const sel = horas === p.h && minutos === p.m && segundos === p.s;
              return (
                <Pressable
                  key={p.label}
                  style={[s.presetBtn, sel && s.presetBtnActivo]}
                  onPress={() => { setHoras(p.h); setMinutos(p.m); setSegundos(p.s); }}
                >
                  <Text style={[s.presetText, sel && s.presetTextActivo]}>{p.label}</Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* Activar */}
        <Pressable style={s.btnActivar} onPress={guardarYActivar}>
          <AntDesign name="lock" size={18} color="#fff" />
          <Text style={s.btnActivarText}>Activar timer y bloquear salida</Text>
        </Pressable>

        <Text style={s.nota}>
          💡 Una vez activado, el niño no puede salir de la app.{'\n'}
          Solo tú puedes desactivarlo con tu huella dactilar.
        </Text>
      </View>
    </View>
  );
}

// ─── Estilos del ScrollPicker ──────────────────────────────────────────────
const sp = StyleSheet.create({
  container: {
    height: ITEM_H * 3,
    width: 80,
    overflow: 'hidden',
    alignItems: 'center',
    position: 'relative',
  },
  selIndicator: {
    position: 'absolute',
    top: ITEM_H,
    left: 4,
    right: 4,
    height: ITEM_H,
    backgroundColor: '#0c4a6e',
    borderRadius: 12,
    zIndex: 0,
  },
  item: {
    height: ITEM_H,
    width: 80,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  numText: {
    fontSize: 26,
    fontFamily: 'SlaberlinBold',
    color: '#94a3b8',
  },
  numTextActivo: {
    color: '#fff',
    fontSize: 30,
  },
  label: {
    position: 'absolute',
    bottom: -2,
    fontSize: 10,
    fontFamily: 'Slaberlin',
    color: '#94a3b8',
  },
});

// ─── Estilos generales ─────────────────────────────────────────────────────
const s = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0369a1',
    paddingBottom: 16,
    paddingHorizontal: 16,
    paddingTop: 12,
    gap: 12,
  },
  backBtn: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    padding: 8,
    borderRadius: 8,
  },
  headerTitle: { fontSize: 20, fontFamily: 'PlayChickens', color: '#fff' },
  headerSub:   { fontSize: 12, fontFamily: 'Slaberlin', color: 'rgba(255,255,255,0.8)', marginTop: 2 },
  activoBanner: {
    backgroundColor: '#fef3c7',
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#fcd34d',
  },
  activoBannerText: { fontFamily: 'SlaberlinBold', color: '#92400e', fontSize: 13, flex: 1 },
  desactivarBtn: { backgroundColor: '#dc2626', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, marginLeft: 10 },
  desactivarText: { color: '#fff', fontFamily: 'SlaberlinBold', fontSize: 12 },
  card: { backgroundColor: '#fff', borderRadius: 16, padding: 18, marginBottom: 12, elevation: 1 },
  cardTitle: { fontSize: 15, fontFamily: 'SlaberlinBold', color: '#0c4a6e', marginBottom: 4 },
  cardSub: { fontSize: 12, fontFamily: 'Slaberlin', color: '#94a3b8', marginBottom: 14 },
  carruselRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  sep: { fontSize: 28, fontFamily: 'SlaberlinBold', color: '#cbd5e1', marginBottom: 16 },
  resumen: { textAlign: 'center', fontFamily: 'Slaberlin', color: '#0369a1', fontSize: 13, marginTop: 12 },
  presetsRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap', marginTop: 4 },
  presetBtn: { borderWidth: 1.5, borderColor: '#cbd5e1', borderRadius: 50, paddingHorizontal: 16, paddingVertical: 8, backgroundColor: '#f8fafc' },
  presetBtnActivo: { backgroundColor: '#0c4a6e', borderColor: '#0c4a6e' },
  presetText: { fontFamily: 'SlaberlinBold', fontSize: 13, color: '#475569' },
  presetTextActivo: { color: '#fff' },
  btnActivar: {
    backgroundColor: '#0c4a6e',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 16,
    borderRadius: 50,
    marginBottom: 12,
  },
  btnActivarText: { color: '#fff', fontFamily: 'SlaberlinBold', fontSize: 16 },
  nota: { textAlign: 'center', fontFamily: 'Slaberlin', color: '#94a3b8', fontSize: 12, lineHeight: 20 },
});
