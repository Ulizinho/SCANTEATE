import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useState } from 'react';
import {
  View, Text, ScrollView, Image, Pressable,
  StatusBar, ToastAndroid, Modal, StyleSheet,
  FlatList, useWindowDimensions, // Cambiado por responsividad global
} from 'react-native';
import Tabs from '../components/Tabs';
import { router } from 'expo-router';
import { AntDesign } from '@expo/vector-icons';
import * as Speech from 'expo-speech';

const meses = [
  'Enero','Febrero','Marzo','Abril','Mayo','Junio',
  'Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre',
];

function formatearFecha(fecha) {
  if (!fecha) return '';
  const d = new Date(fecha);
  return `${meses[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
}

const ORDEN_EMOCIONES = [
  'Felicidad','Alegría','Sorpresa',
  'Tristeza','Miedo','Disgusto','Ansiedad',
  'Enojo','Ira','Frustración',
];

export default function Galery() {
  const { width: SCREEN_WIDTH } = useWindowDimensions(); // Responsivo en tiempo real
  const [allEmotions, setAllEmotions] = useState([]);
  const [categorias, setCategorias] = useState({});
  const [categoriaActiva, setCategoriaActiva] = useState(null);

  const [fotoModal, setFotoModal] = useState(null);
  const [deleteModal, setDeleteModal] = useState(false);
  const [deleteId, setDeleteId] = useState(null);

  const getUser = async () => {
    try {
      const usStr = await AsyncStorage.getItem('user');
      const emStr = await AsyncStorage.getItem('emotions');
      const us = JSON.parse(usStr);
      const all = JSON.parse(emStr) || [];
      const mias = all.filter((el) => el.userId == us.id);
      
      setAllEmotions(all);
      const grupos = {};
      mias.forEach((el) => {
        const key = el.emocion || 'Desconocida';
        if (!grupos[key]) grupos[key] = [];
        grupos[key].push(el);
      });
      setCategorias(grupos);

      const primera = ORDEN_EMOCIONES.find(e => grupos[e]) || Object.keys(grupos)[0];
      setCategoriaActiva(primera || null);
    } catch (e) { console.error(e); }
  };

  useFocusEffect(useCallback(() => { getUser(); }, []));

  // --- OPTIMIZACIÓN DE VOZ (Sin lag y Global) ---
  const hablarEmocion = async (emocion) => {
    try {
      await Speech.stop(); // Limpia el buffer de audio inmediatamente
      Speech.speak(`En esta foto la emoción fue ${emocion}`, { 
        language: 'es',
        rate: 0.9, 
      });
    } catch (e) { console.log('Speech error:', e); }
  };

  const abrirFoto = (item) => {
    if (!item?.uri) return;
    setFotoModal(item);
    hablarEmocion(item.emocion);
  };

  const cerrarFoto = () => {
    Speech.stop();
    setFotoModal(null);
  };

  const confirmarEliminar = (id) => {
    setFotoModal(null);
    setDeleteId(id);
    setDeleteModal(true);
  };

  const eliminar = async () => {
    const filtradas = allEmotions.filter(e => e.id != deleteId);
    setAllEmotions(filtradas);
    await AsyncStorage.setItem('emotions', JSON.stringify(filtradas));

    getUser(); // Recarga y reagrupa
    setDeleteModal(false);
    ToastAndroid.showWithGravity('Eliminado', ToastAndroid.SHORT, ToastAndroid.CENTER);
  };

  const emocionesCategoria = categoriaActiva ? (categorias[categoriaActiva] || []) : [];
  const categoriasDisponibles = ORDEN_EMOCIONES.filter(e => categorias[e])
    .concat(Object.keys(categorias).filter(e => !ORDEN_EMOCIONES.includes(e)));

  const colorCategoria = emocionesCategoria[0]?.color || '#0369a1';

  return (
    <View style={{ flex: 1, backgroundColor: '#f1f5f9' }}>
      <StatusBar backgroundColor="#0d5692" barStyle="light-content" translucent={true} />
      <View style={{ marginTop: StatusBar.currentHeight }} />

      <View style={styles.header}>
        <Pressable style={styles.backBtn} onPress={() => router.back()}>
          <AntDesign name="left" size={22} color="#0369a1" />
        </Pressable>
        <Text style={styles.headerTitle}>Galería de Emociones</Text>
        <View style={{ width: 40 }} />
      </View>

      {categoriasDisponibles.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyEmoji}>📷</Text>
          <Text style={styles.emptyText}>
            Aún no hay emociones registradas.{'\n'}Usa el escáner para empezar.
          </Text>
        </View>
      ) : (
        <>
          <View style={{ maxHeight: 62 }}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} 
              style={styles.tabsScroll}
              contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 10, gap: 8 }}>
              {categoriasDisponibles.map((cat) => {
                const activa = cat === categoriaActiva;
                const colorTab = categorias[cat]?.[0]?.color || '#0369a1';
                return (
                  <Pressable key={cat} onPress={() => setCategoriaActiva(cat)}
                    style={[styles.tab, activa && { backgroundColor: colorTab, borderColor: colorTab }]}>
                    <Text style={[styles.tabText, activa && { color: '#fff' }]}>{cat}</Text>
                    <Text style={[styles.tabCount, activa && { color: 'rgba(255,255,255,0.8)' }]}>{categorias[cat]?.length}</Text>
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>

          {categoriaActiva && (
            <View style={[styles.seccionHeader, { borderLeftColor: colorCategoria }]}>
              <Text style={[styles.seccionTitulo, { color: colorCategoria }]}>{categoriaActiva}</Text>
              <Text style={styles.seccionSub}>
                {emocionesCategoria.length} {emocionesCategoria.length === 1 ? 'registro' : 'registros'}
              </Text>
            </View>
          )}

          {/* Grid Responsivo Global */}
          <FlatList
            data={emocionesCategoria}
            keyExtractor={(item) => String(item.id)}
            numColumns={3}
            removeClippedSubviews={true} // Ahorro masivo de RAM
            initialNumToRender={12}
            contentContainerStyle={{ paddingHorizontal: 14, paddingBottom: 100 }}
            renderItem={({ item }) => (
              <Pressable onPress={() => abrirFoto(item)} style={styles.thumbWrapper}>
                <View style={styles.thumb}>
                  <Image source={{ uri: item.uri }} style={styles.thumbImg} />
                  <Text style={styles.thumbFecha} numberOfLines={1}>
                    {formatearFecha(item.date).split(',')[0]}
                  </Text>
                </View>
              </Pressable>
            )}
          />
        </>
      )}

      <Tabs />

      {/* Modal Expandido */}
      <Modal visible={!!fotoModal} transparent animationType="fade" onRequestClose={cerrarFoto}>
        <View style={styles.overlay}>
          <View style={[styles.fotoCard, { borderTopColor: fotoModal?.color || '#0369a1', borderTopWidth: 6 }]}>
            <Text style={[styles.fotoEmocion, { color: fotoModal?.color || '#0369a1' }]}>{fotoModal?.emocion}</Text>
            <Text style={styles.fotoFecha}>{formatearFecha(fotoModal?.date)}</Text>

            <Pressable onPress={() => hablarEmocion(fotoModal?.emocion)}>
              <Image source={{ uri: fotoModal?.uri }} 
                style={[styles.fotoGrande, { borderColor: fotoModal?.color || '#0369a1', width: SCREEN_WIDTH * 0.75, height: SCREEN_WIDTH * 0.75 }]} 
              />
              <View style={styles.speakHint}>
                <AntDesign name="sound" size={14} color="#fff" />
                <Text style={styles.speakHintText}>Toca la foto para escuchar</Text>
              </View>
            </Pressable>

            <View style={styles.fotoBtns}>
              <Pressable style={styles.btnCerrar} onPress={cerrarFoto}>
                <Text style={styles.btnCerrarText}>Cerrar</Text>
              </Pressable>
              <Pressable style={styles.btnEliminar} onPress={() => confirmarEliminar(fotoModal?.id)}>
                <AntDesign name="delete" size={16} color="#e11d48" />
                <Text style={styles.btnEliminarText}>Eliminar</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal Eliminar */}
      <Modal visible={deleteModal} transparent animationType="fade" onRequestClose={() => setDeleteModal(false)}>
        <View style={styles.overlay}>
          <View style={styles.deleteCard}>
            <Text style={styles.deleteTitle}>¿Eliminar registro?</Text>
            <Text style={styles.deleteBody}>Esta foto y su emoción se borrarán permanentemente.</Text>
            <View style={styles.deleteBtns}>
              <Pressable style={styles.btnCancelar} onPress={() => setDeleteModal(false)}>
                <Text style={styles.btnCancelarText}>Cancelar</Text>
              </Pressable>
              <Pressable style={styles.btnConfirmar} onPress={eliminar}>
                <Text style={styles.btnConfirmarText}>Eliminar</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#fff', paddingHorizontal: 12, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#e2e8f0' },
  backBtn: { backgroundColor: '#e2e8f0', padding: 8, borderRadius: 8 },
  headerTitle: { fontSize: 18, fontFamily: 'SlaberlinBold', color: '#0c4a6e' },
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingBottom: 80 },
  emptyEmoji: { fontSize: 60, marginBottom: 16 },
  emptyText: { fontSize: 16, fontFamily: 'Slaberlin', color: '#94a3b8', textAlign: 'center', lineHeight: 24 },
  tabsScroll: { backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#e2e8f0' },
  tab: { flexDirection: 'row', alignItems: 'center', gap: 5, borderWidth: 1.5, borderColor: '#cbd5e1', borderRadius: 50, paddingHorizontal: 14, paddingVertical: 6, backgroundColor: '#f8fafc' },
  tabText: { fontSize: 13, fontFamily: 'SlaberlinBold', color: '#475569' },
  tabCount: { fontSize: 11, fontFamily: 'Slaberlin', color: '#94a3b8' },
  seccionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 10, borderLeftWidth: 4, marginHorizontal: 16, marginTop: 12, marginBottom: 8, borderRadius: 4, backgroundColor: '#fff' },
  seccionTitulo: { fontSize: 18, fontFamily: 'SlaberlinBold' },
  seccionSub: { fontSize: 12, fontFamily: 'Slaberlin', color: '#94a3b8' },
  
  // ESTRUCTURA DE IMAGEN GLOBAL
  thumbWrapper: {
    flex: 1/3, // Divide la pantalla en 3 sin importar el ancho
    padding: 4, // Espacio uniforme entre ellas
  },
  thumb: {
    borderRadius: 10,
    overflow: 'hidden',
    backgroundColor: '#e2e8f0',
    aspectRatio: 1, // Esto las hace cuadradas perfectas siempre
  },
  thumbImg: { width: '100%', height: '80%' }, // Espacio para la fecha abajo
  thumbFecha: { fontSize: 10, fontFamily: 'Slaberlin', color: '#64748b', textAlign: 'center', paddingVertical: 4, backgroundColor: '#fff' },

  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.65)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  fotoCard: { backgroundColor: '#fff', borderRadius: 20, padding: 20, width: '100%', alignItems: 'center', elevation: 10 },
  fotoEmocion: { fontSize: 26, fontFamily: 'SlaberlinBold', marginBottom: 2 },
  fotoFecha: { fontSize: 13, fontFamily: 'Slaberlin', color: '#64748b', marginBottom: 14 },
  fotoGrande: { borderRadius: 16, borderWidth: 4 },
  speakHint: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: 'rgba(0,0,0,0.45)', borderRadius: 50, paddingHorizontal: 12, paddingVertical: 4, marginTop: -28, alignSelf: 'center' },
  speakHintText: { fontSize: 11, color: '#fff', fontFamily: 'Slaberlin' },
  fotoBtns: { flexDirection: 'row', gap: 12, marginTop: 16, width: '100%' },
  btnCerrar: { flex: 1, backgroundColor: '#f1f5f9', paddingVertical: 12, borderRadius: 50, alignItems: 'center' },
  btnCerrarText: { fontFamily: 'SlaberlinBold', color: '#475569', fontSize: 15 },
  btnEliminar: { flex: 1, flexDirection: 'row', gap: 6, backgroundColor: '#fff1f2', paddingVertical: 12, borderRadius: 50, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#fecdd3' },
  btnEliminarText: { fontFamily: 'SlaberlinBold', color: '#e11d48', fontSize: 15 },
  deleteCard: { backgroundColor: '#fff', borderRadius: 20, padding: 28, width: '85%', alignItems: 'center', elevation: 10 },
  deleteTitle: { fontSize: 20, fontFamily: 'SlaberlinBold', color: '#0c4a6e', marginBottom: 10 },
  deleteBody: { fontSize: 14, fontFamily: 'Slaberlin', color: '#64748b', textAlign: 'center', marginBottom: 24, lineHeight: 20 },
  deleteBtns: { flexDirection: 'row', gap: 12, width: '100%' },
  btnCancelar: { flex: 1, backgroundColor: '#f1f5f9', paddingVertical: 13, borderRadius: 50, alignItems: 'center' },
  btnCancelarText: { fontFamily: 'SlaberlinBold', color: '#475569' },
  btnConfirmar: { flex: 1, backgroundColor: '#e11d48', paddingVertical: 13, borderRadius: 50, alignItems: 'center' },
  btnConfirmarText: { fontFamily: 'SlaberlinBold', color: '#fff' },
});