import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useState } from 'react';
import {
  View, Text, ScrollView, Image, StatusBar, Pressable,
  Modal, TextInput, KeyboardAvoidingView, Platform,
  ToastAndroid, StyleSheet,
} from 'react-native';import Tabs from '../components/Tabs';
import { router } from 'expo-router';
import { AntDesign } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';

const meses = [
  'Enero','Febrero','Marzo','Abril','Mayo','Junio',
  'Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre',
];

function formatearFecha(fecha) {
  if (fecha) {
    fecha = new Date(fecha);
    return `${meses[fecha.getMonth()]} ${fecha.getDate()}, ${fecha.getFullYear()}`;
  }
}

import { useBiometrics } from '../hooks/useBiometrics';

const PASO_NINGUNO    = 0;
const PASO_INFO       = 1;
const PASO_AVISO      = 2;
const PASO_FORMULARIO = 3;

export default function Report() {
  const [user, setUser]               = useState({ name: '', type: '' });
  const [maxEmotion, setMaxEmotion]   = useState('');
  const [userEmotions, setUserEmotions] = useState([]);
  const [mes]                         = useState(() => meses[new Date().getMonth()]);
  const [paso, setPaso]               = useState(PASO_NINGUNO);
  const [nombreNino, setNombreNino]   = useState('');
  const [edad, setEdad]               = useState('');
  const [tea, setTea]                 = useState('Nivel 1');
  const [notas, setNotas]             = useState('');

  const [cargando, setCargando]   = useState(true);
  const [autorizado, setAutorizado] = useState(false);
  const { pedir } = useBiometrics();

  const getUser = async () => {
    setCargando(true);
    const userData = JSON.parse(await AsyncStorage.getItem('user')) || user;
    setUser(userData);

    const infoNino = await AsyncStorage.getItem(`infoNino_${userData.id}`);
    // Limpiar la key vieja sin userId si existe
    await AsyncStorage.removeItem('infoNino');
    console.log('infoNino key:', `infoNino_${userData.id}`, '| valor:', infoNino);
    if (!infoNino) {
      setPaso(PASO_INFO);
    } else {
      setPaso(PASO_NINGUNO);
    }

    const all = JSON.parse(await AsyncStorage.getItem('emotions')) || [];
    const localCounter = {};
    const filtered = [];
    all.forEach((el) => {
      if (el.userId == userData.id) {
        filtered.push(el);
        localCounter[el.emocion] = (localCounter[el.emocion] || 0) + 1;
      }
    });
    setUserEmotions(filtered);
    try {
      const highestPair = Object.entries(localCounter).reduce((max, cur) =>
        cur[1] > max[1] ? cur : max
      );
      setMaxEmotion(highestPair[0]);
    } catch (e) {}
    setCargando(false);
  };

  useFocusEffect(useCallback(() => {
    setAutorizado(false);
    const verificar = async () => {
      const ok = await pedir('Identifícate para ver los reportes');
      if (!ok) {
        router.back();
      } else {
        setAutorizado(true);
        getUser();
      }
    };
    verificar();
  }, []));

  const guardarInfoNino = async () => {
    if (!nombreNino.trim() || !edad.trim()) {
      ToastAndroid.showWithGravity('El nombre y la edad son obligatorios', ToastAndroid.LONG, ToastAndroid.CENTER);
      return;
    }
    const userData = JSON.parse(await AsyncStorage.getItem('user'));
    await AsyncStorage.setItem(`infoNino_${userData.id}`, JSON.stringify({
      nombre: nombreNino.trim(),
      edad: edad.trim(),
      tea,
      notas: notas.trim(),
    }));
    ToastAndroid.showWithGravity('¡Información guardada!', ToastAndroid.SHORT, ToastAndroid.CENTER);
    setPaso(PASO_NINGUNO);
  };

  if (!autorizado) return <View style={{ flex: 1, backgroundColor: '#e2e8f0' }} />;

  // Conteo de emociones para el resumen
  const conteo = {};
  userEmotions.forEach(e => { conteo[e.emocion] = (conteo[e.emocion] || 0) + 1; });
  const totalEscaneos = userEmotions.length;

  return (
    <View style={{ flex: 1, backgroundColor: '#f1f5f9' }}>
      <StatusBar backgroundColor="#0d5692" hidden={false} translucent={true} />
      <View style={{ marginTop: StatusBar.currentHeight }} />

      {/* Header estilo login/register */}
      <View style={estilos.header}>
        <Pressable style={estilos.backBtn} onPress={() => router.back()}>
          <AntDesign name="left" size={22} color="#fff" />
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text style={estilos.headerTitle}>Reporte de Emociones</Text>
          <Text style={estilos.headerSub}>{mes} · {new Date().getFullYear()}</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 100 }}>

        {/* Tarjeta resumen */}
        <View style={estilos.card}>
          <Text style={estilos.cardTitle}>📊 Resumen del mes</Text>
          <View style={estilos.statsRow}>
            <View style={estilos.statBox}>
              <Text style={estilos.statNum}>{totalEscaneos}</Text>
              <Text style={estilos.statLabel}>Escaneos</Text>
            </View>
            <View style={[estilos.statBox, { borderLeftWidth: 1, borderRightWidth: 1, borderColor: '#e2e8f0' }]}>
              <Text style={estilos.statNum}>{Object.keys(conteo).length}</Text>
              <Text style={estilos.statLabel}>Emociones distintas</Text>
            </View>
            <View style={estilos.statBox}>
              <Text style={[estilos.statNum, { color: '#0369a1' }]}>{maxEmotion || '—'}</Text>
              <Text style={estilos.statLabel}>Más frecuente</Text>
            </View>
          </View>
        </View>

        {/* Desglose por emoción */}
        {Object.keys(conteo).length > 0 && (
          <View style={estilos.card}>
            <Text style={estilos.cardTitle}>📈 Desglose</Text>
            {Object.entries(conteo)
              .sort((a, b) => b[1] - a[1])
              .map(([emocion, cantidad]) => {
                const porcentaje = Math.round((cantidad / totalEscaneos) * 100);
                const color = userEmotions.find(e => e.emocion === emocion)?.color || '#0369a1';
                return (
                  <View key={emocion} style={estilos.desglose}>
                    <View style={estilos.desgloseInfo}>
                      <Text style={[estilos.desgloseEmocion, { color }]}>{emocion}</Text>
                      <Text style={estilos.desgloseCount}>{cantidad} vez{cantidad > 1 ? 'es' : ''}</Text>
                    </View>
                    <View style={estilos.barBg}>
                      <View style={[estilos.barFill, { width: `${porcentaje}%`, backgroundColor: color }]} />
                    </View>
                  </View>
                );
              })}
          </View>
        )}

        {/* Lista de registros */}
        <View style={estilos.card}>
          <Text style={estilos.cardTitle}>🗓 Registros</Text>
          {userEmotions.length === 0 ? (
            <Text style={estilos.vacio}>Aún no hay emociones registradas este mes</Text>
          ) : (
            userEmotions.map((el, i) => (
              <View key={i} style={estilos.registro}>
                <View style={[estilos.registroColor, { backgroundColor: el.color || '#0369a1' }]} />
                <View style={{ flex: 1 }}>
                  <Text style={estilos.registroEmocion}>{el.emocion}</Text>
                  <Text style={estilos.registroFecha}>{formatearFecha(el.date)}</Text>
                </View>
                <Image source={{ uri: el.uri }} style={estilos.registroImg} />
              </View>
            ))
          )}
        </View>

      </ScrollView>

      <Tabs />

      {/* MODAL 1 — Info sobre la sección */}
      <Modal transparent animationType="fade" visible={!cargando && paso === PASO_INFO}>
        <View style={styles.overlay}>
          <View style={styles.card}>
            <Text style={styles.emoji}>📋</Text>
            <Text style={styles.cardTitle}>Sección de Reportes</Text>
            <Text style={styles.cardBody}>
              Esta sección está diseñada para generar reportes del desarrollo
              socioemocional de tu hijo, en caso de que cuente con el apoyo
              de un psicólogo o terapeuta.{'\n\n'}
              Los reportes incluyen las emociones registradas, tiempo de uso y
              actividades completadas — sin imágenes — para que puedan ser
              compartidos fácilmente con el especialista.
            </Text>
            <Pressable style={styles.btnPrimary} onPress={() => setPaso(PASO_AVISO)}>
              <Text style={styles.btnPrimaryText}>Siguiente →</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      {/* MODAL 2 — Aviso del formulario */}
      <Modal transparent animationType="fade" visible={!cargando && paso === PASO_AVISO}>
        <View style={styles.overlay}>
          <View style={styles.card}>
            <Text style={styles.emoji}>👦</Text>
            <Text style={styles.cardTitle}>Datos de tu hijo</Text>
            <Text style={styles.cardBody}>
              A continuación completa los campos con la información de tu hijo.{'\n\n'}
              Esta información se usará para personalizar los reportes y solo
              se guarda en tu dispositivo.
            </Text>
            <Pressable style={styles.btnPrimary} onPress={() => setPaso(PASO_FORMULARIO)}>
              <Text style={styles.btnPrimaryText}>Entendido ✓</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      {/* MODAL 3 — Formulario */}
      <Modal transparent animationType="slide" visible={!cargando && paso === PASO_FORMULARIO}>
        <KeyboardAvoidingView style={styles.overlay} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', alignItems: 'center', padding: 16 }}>
            <View style={[styles.card, { width: '95%' }]}>
              <Text style={styles.cardTitle}>Información del niño</Text>

              <Text style={styles.label}>Nombre del niño *</Text>
              <TextInput
                style={styles.input}
                value={nombreNino}
                onChangeText={setNombreNino}
                placeholder="Nombre completo"
                placeholderTextColor="#94a3b8"
              />

              <Text style={styles.label}>Edad *</Text>
              <TextInput
                style={styles.input}
                value={edad}
                onChangeText={setEdad}
                placeholder="Ej: 7"
                placeholderTextColor="#94a3b8"
                keyboardType="numeric"
                maxLength={2}
              />

              <Text style={styles.label}>Tipo de TEA</Text>
              <View style={styles.pickerContainer}>
                <Picker selectedValue={tea} onValueChange={(val) => setTea(val)} style={{ color: '#1e293b' }}>
                  <Picker.Item label="Nivel 1 — Requiere apoyo" value="Nivel 1" />
                  <Picker.Item label="Nivel 2 — Requiere apoyo sustancial" value="Nivel 2" />
                  <Picker.Item label="Nivel 3 — Requiere apoyo muy sustancial" value="Nivel 3" />
                </Picker>
              </View>

              <Text style={styles.label}>Notas adicionales</Text>
              <TextInput
                style={[styles.input, { height: 80, textAlignVertical: 'top' }]}
                value={notas}
                onChangeText={setNotas}
                placeholder="Alergias, medicamentos, contexto especial..."
                placeholderTextColor="#94a3b8"
                multiline
                numberOfLines={3}
              />

              <Pressable style={[styles.btnPrimary, { marginTop: 20 }]} onPress={guardarInfoNino}>
                <Text style={styles.btnPrimaryText}>Guardar información</Text>
              </Pressable>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 28,
    width: '85%',
    alignItems: 'center',
    elevation: 10,
  },
  emoji: { fontSize: 48, marginBottom: 10 },
  cardTitle: {
    fontSize: 22,
    fontFamily: 'SlaberlinBold',
    color: '#0c4a6e',
    textAlign: 'center',
    marginBottom: 12,
  },
  cardBody: {
    fontSize: 15,
    fontFamily: 'Slaberlin',
    color: '#475569',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  btnPrimary: {
    backgroundColor: '#0c4a6e',
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 50,
    width: '100%',
    alignItems: 'center',
  },
  btnPrimaryText: { color: '#fff', fontSize: 17, fontFamily: 'SlaberlinBold' },
  label: {
    alignSelf: 'flex-start',
    fontSize: 14,
    fontFamily: 'SlaberlinBold',
    color: '#334155',
    marginTop: 14,
    marginBottom: 4,
  },
  input: {
    width: '100%',
    borderWidth: 1.5,
    borderColor: '#cbd5e1',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 15,
    fontFamily: 'Slaberlin',
    color: '#1e293b',
    backgroundColor: '#f8fafc',
  },
  pickerContainer: {
    width: '100%',
    borderWidth: 1.5,
    borderColor: '#cbd5e1',
    borderRadius: 10,
    backgroundColor: '#f8fafc',
    overflow: 'hidden',
  },
});

const estilos = StyleSheet.create({
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
  headerTitle: {
    fontSize: 20,
    fontFamily: 'PlayChickens',
    color: '#fff',
  },
  headerSub: {
    fontSize: 12,
    fontFamily: 'Slaberlin',
    color: 'rgba(255,255,255,0.8)',
    marginTop: 2,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 18,
    marginBottom: 14,
    elevation: 1,
  },
  cardTitle: {
    fontSize: 15,
    fontFamily: 'SlaberlinBold',
    color: '#0c4a6e',
    marginBottom: 14,
  },
  statsRow: {
    flexDirection: 'row',
  },
  statBox: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 4,
  },
  statNum: {
    fontSize: 22,
    fontFamily: 'SlaberlinBold',
    color: '#1e293b',
  },
  statLabel: {
    fontSize: 11,
    fontFamily: 'Slaberlin',
    color: '#94a3b8',
    textAlign: 'center',
    marginTop: 2,
  },
  desglose: {
    marginBottom: 12,
  },
  desgloseInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 5,
  },
  desgloseEmocion: {
    fontSize: 14,
    fontFamily: 'SlaberlinBold',
  },
  desgloseCount: {
    fontSize: 13,
    fontFamily: 'Slaberlin',
    color: '#94a3b8',
  },
  barBg: {
    height: 8,
    backgroundColor: '#f1f5f9',
    borderRadius: 50,
    overflow: 'hidden',
  },
  barFill: {
    height: 8,
    borderRadius: 50,
  },
  registro: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    gap: 12,
  },
  registroColor: {
    width: 4,
    height: 44,
    borderRadius: 4,
  },
  registroEmocion: {
    fontSize: 15,
    fontFamily: 'SlaberlinBold',
    color: '#1e293b',
  },
  registroFecha: {
    fontSize: 12,
    fontFamily: 'Slaberlin',
    color: '#94a3b8',
    marginTop: 2,
  },
  registroImg: {
    width: 52,
    height: 52,
    borderRadius: 10,
  },
  vacio: {
    fontSize: 14,
    fontFamily: 'Slaberlin',
    color: '#94a3b8',
    textAlign: 'center',
    paddingVertical: 20,
  },
});
