import { CameraView, useCameraPermissions } from 'expo-camera';
import { useCallback, useState } from 'react';
import {
  View,
  Pressable,
  Text,
  StyleSheet,
  Image,
  StatusBar,
  Alert,
} from 'react-native';
import Anthropic from '@anthropic-ai/sdk';
import { manipulateAsync, FlipType, SaveFormat } from 'expo-image-manipulator';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import { router } from 'expo-router';
import { AntDesign } from '@expo/vector-icons';
import FontAwesome6 from '@expo/vector-icons/FontAwesome6';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import * as Speech from 'expo-speech';
import SmallTabs from '../components/SmallTabs';

export default function Emotions() {
  const anthropic = new Anthropic({
    apiKey: process.env.EXPO_PUBLIC_ANTHROPIC_API,
  });

  const [type, setType] = useState('front');
  const [permission, requestPermission] = useCameraPermissions();
  const [cameraRef, setCameraRef] = useState(null);
  const [emotion, setEmotion] = useState('Escaner de Emociones');
  const [scanText, setScanText] = useState('ESCANEAR');
  const [fotoUri, setFotoUri] = useState(null);
  const [color, setColor] = useState('#0c4a6e');
  const [border, setBorder] = useState('#0c4a6e');
  const [user, setUser] = useState({ id: 0, name: '' });

  const getUser = async () => {
    try {
      const userData = await AsyncStorage.getItem('user');
      if (userData) setUser(JSON.parse(userData));
    } catch (e) {
      console.log("Error al obtener usuario:", e);
    }
  };

  useFocusEffect(
    useCallback(() => {
      getUser();
    }, [])
  );

  const emotionColors = {
    Felicidad:   '#22c55e',
    Alegría:     '#22c55e',
    Sorpresa:    '#22c55e',
    Tristeza:    '#facc15',
    Miedo:       '#facc15',
    Disgusto:    '#facc15',
    Ansiedad:    '#facc15',
    Enojo:       '#f43f5e',
    Ira:         '#f43f5e',
    Frustración: '#f43f5e',
  };

  const DEFAULT_COLOR = '#94a3b8';

  // --- FUNCIÓN DE VOZ CORREGIDA ---
  const sayEmotion = async () => {
    // Si el estado es el inicial o error, no decimos nada
    const estadosInvalidos = ['Escaner de Emociones', 'Escaneando...', 'No se detectó rostro', 'Error al conectar'];
    if (estadosInvalidos.includes(emotion)) return;

    const phrase = `La emoción predominante es: ${emotion}`;
    
    const isSpeaking = await Speech.isSpeakingAsync();
    if (isSpeaking) {
      await Speech.stop(); 
    }
    
    Speech.speak(phrase, { 
      language: 'es',
      pitch: 1.1, 
      rate: 1.0 
    });
  };

  function toggleCameraType() {
    setType((current) => (current === 'back' ? 'front' : 'back'));
  }

  async function scanFace() {
    if (fotoUri) {
      setFotoUri(null);
      setScanText('ESCANEAR');
      setEmotion('Escaner de Emociones');
      setColor('#0c4a6e');
      setBorder('#0c4a6e');
      return;
    }

    if (!process.env.EXPO_PUBLIC_ANTHROPIC_API) {
      Alert.alert("Error de Configuración", "La API Key no se detecta.");
      return;
    }

    setEmotion('Escaneando...');
    setScanText('ESPERA...');
    setColor('#0c4a6e');

    try {
      const img = await cameraRef.takePictureAsync({
        base64: true,
        quality: 0.5,
      });

      let finalUri = img.uri;
      let finalBase64 = img.base64;

      if (type === 'front') {
        const flipped = await manipulateAsync(
          img.uri,
          [{ flip: FlipType.Horizontal }],
          { format: SaveFormat.JPEG, base64: true, compress: 0.5 }
        );
        finalUri = flipped.uri;
        finalBase64 = flipped.base64;
      }

      setFotoUri(finalUri);

      const msg = await anthropic.messages.create({
        model: 'claude-haiku-4-5-20251001', 
        max_tokens: 20,
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'image',
                source: {
                  type: 'base64',
                  media_type: 'image/jpeg',
                  data: finalBase64,
                },
              },
              {
                type: 'text',
                text: 'Analiza el rostro. Responde ÚNICAMENTE con una palabra: Felicidad, Alegría, Sorpresa, Tristeza, Miedo, Disgusto, Ansiedad, Enojo, Ira, Frustración. Si no hay rostro di: No',
              },
            ],
          },
        ],
      });

      const emo = msg.content[0].text.trim().replace(/[.,]/g, '');
      const mapped = Object.keys(emotionColors).find(
        (k) => k.toLowerCase() === emo.toLowerCase()
      );

      if (mapped && mapped !== 'No') {
        const hexColor = emotionColors[mapped];
        setEmotion(mapped);
        setScanText('VOLVER A ESCANEAR');
        setColor(hexColor);
        setBorder(hexColor);

        // Hablar automáticamente al detectar con la frase completa
        const welcomePhrase = `La emoción predominante es: ${mapped}`;
        Speech.speak(welcomePhrase, { language: 'es', pitch: 1.1 });

        // Guardar en galería
        try {
          const stored = await AsyncStorage.getItem('emotions');
          const emotions = JSON.parse(stored) || [];
          emotions.unshift({
            id: Date.now(),
            userId: user.id,
            emocion: mapped,
            color: hexColor,
            uri: finalUri,
            date: Date.now(),
          });
          await AsyncStorage.setItem('emotions', JSON.stringify(emotions));
        } catch (storageError) { console.log(storageError); }
        
      } else {
        const errorText = emo === 'No' ? 'No se detectó rostro' : emo;
        setEmotion(errorText);
        setScanText('VOLVER A ESCANEAR');
        setColor(DEFAULT_COLOR);
        setBorder(DEFAULT_COLOR);
        if (emo !== 'No') Speech.speak(emo, { language: 'es' });
      }

    } catch (e) {
      Alert.alert("Error de Red/API", e.message); 
      setEmotion("Error al conectar");
      setScanText("REINTENTAR");
    }
  }

  if (!permission) return <View />;
  if (!permission.granted) {
    return (
      <View style={styles.centered}>
        <Text style={styles.permissionText}>Necesitamos acceso a la cámara.</Text>
        <Pressable style={styles.permissionBtn} onPress={requestPermission}>
          <Text style={styles.btnText}>Otorgar permisos</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#fff' }}>
      <StatusBar backgroundColor="#0d5692" hidden={false} translucent={true} />
      <View style={{ marginTop: StatusBar.currentHeight }} />

      <View style={styles.header}>
        <Pressable style={styles.backBtn} onPress={() => router.back()}>
          <AntDesign name="left" size={24} color="#0369a1" />
        </Pressable>
        <Image source={require('../assets/images/SNT+Bv2.png')} style={{ width: 180, height: 50 }} resizeMode="contain" />
        <View style={{ width: 40 }} />
      </View>

      {/* --- CÁMARA/FOTO AHORA PRESIONABLE --- */}
      <Pressable onPress={sayEmotion} style={[styles.cameraBox, { borderColor: border }]}>
        {fotoUri ? (
          <Image source={{ uri: fotoUri }} style={styles.fullImg} resizeMode="cover" />
        ) : (
          <CameraView
            ref={(ref) => setCameraRef(ref)}
            style={{ flex: 1 }}
            facing={type}
            pictureSize="1080x1080"
          />
        )}
      </Pressable>

      {/* Resultados */}
      <Pressable onPress={sayEmotion} style={styles.resultBox}>
        <Text style={[styles.emotionTitle, { color: color }]}>
          {emotion}
        </Text>
        <Text style={styles.hintText}>
          {emotion === 'Escaner de Emociones'
            ? 'Toma una foto para identificar la emoción'
            : 'Toca la imagen o el texto para escuchar de nuevo'}
        </Text>
      </Pressable>

      {/* Controles */}
      <View style={styles.controls}>
        <Pressable style={styles.sideBtn} onPress={toggleCameraType}>
          <FontAwesome6 name="camera-rotate" size={26} color="rgb(8 47 73)" />
        </Pressable>

        <Pressable style={styles.mainBtn} onPress={scanFace}>
          <Text style={styles.mainBtnText}>{scanText}</Text>
        </Pressable>

        <Pressable style={styles.sideBtn} onPress={() => router.navigate('/galery')}>
          <MaterialIcons name="photo-library" size={28} color="rgb(8 47 73)" />
        </Pressable>
      </View>

      <SmallTabs />
    </View>
  );
}

const styles = StyleSheet.create({
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 20 },
  permissionText: { textAlign: 'center', fontSize: 18, marginBottom: 20 },
  permissionBtn: { backgroundColor: '#0369a1', padding: 15, borderRadius: 10 },
  btnText: { color: '#fff', fontWeight: 'bold' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 10 },
  backBtn: { backgroundColor: '#cbd5e1', padding: 8, borderRadius: 8, opacity: 0.8 },
  cameraBox: {
    marginHorizontal: 15,
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 5,
    aspectRatio: 3 / 4,
    width: '90%',
    alignSelf: 'center',
    backgroundColor: '#000'
  },
  fullImg: { flex: 1, width: '100%' },
  resultBox: { paddingVertical: 10, alignItems: 'center' },
  emotionTitle: { fontSize: 32, textAlign: 'center', fontWeight: 'bold' },
  hintText: { color: '#64748b', fontSize: 14, marginTop: 4 },
  controls: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingBottom: 20,
  },
  sideBtn: { backgroundColor: '#f1f5f9', padding: 12, borderRadius: 15 },
  mainBtn: { backgroundColor: '#0c4a6e', paddingHorizontal: 30, paddingVertical: 15, borderRadius: 30 },
  mainBtnText: { color: '#fff', fontSize: 18, fontWeight: 'bold' }
});
