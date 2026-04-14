import { CameraView, useCameraPermissions } from 'expo-camera';
import { useCallback, useState } from 'react';
import {
  View,
  Pressable,
  Text,
  StyleSheet,
  Image,
  StatusBar,
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
  const [user, setUser] = useState({
    id: 0,
    name: '',
  });
  const getUser = async () => {
    setUser(JSON.parse(await AsyncStorage.getItem('user')) || user);
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

  // Color por defecto si Claude responde algo no mapeado
  const DEFAULT_COLOR = '#94a3b8'; // gris

  function toggleCameraType() {
    setType((current) => (current === 'back' ? 'front' : 'back'));
  }

  const sayEmotion = () => {
    if (emotion != 'Escaner de Emociones') {
      Speech.speak(emotion, { language: 'es' });
    }
  };

  async function scanFace() {
    if (fotoUri) {
      setFotoUri(null);
      setScanText('ESCANEAR');
      setEmotion('Escaner de Emociones');
      setColor('text-sky-900');
      return;
    }
    setEmotion('Escaneando...');
    setScanText('Volver a Escanear');
    setColor('#0c4a6e'); // mantiene color azul mientras escanea
    try {
      const img = await cameraRef.takePictureAsync({
        base64: true,
      });
      if (type == 'front') {
        const fliped = await manipulateAsync(
          img.uri,
          [{ flip: FlipType.Horizontal }],
          { format: SaveFormat.JPEG }
        );
        setFotoUri(fliped.uri);
      } else {
        setFotoUri(img.uri);
      }
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
                  data: img.base64,
                },
              },
              {
                type: 'text',
                text: 'Analiza el rostro en la imagen e identifica la emoción predominante. Responde ÚNICAMENTE con una de estas palabras exactas, sin explicación, sin puntuación, sin texto adicional: Felicidad, Alegría, Sorpresa, Tristeza, Miedo, Disgusto, Ansiedad, Enojo, Ira, Frustración. Si no hay rostro visible en la imagen, responde únicamente: No',
              },
            ],
          },
        ],
      });
      const emo = msg.content[0].text.trim();
      const mapped = Object.keys(emotionColors).find(
        (k) => k.toLowerCase() === emo.toLowerCase()
      );

      if (mapped && mapped !== 'No') {
        const hexColor = emotionColors[mapped];
        setEmotion(mapped);
        Speech.speak(mapped, { language: 'es' });
        setColor(hexColor);
        setBorder(hexColor);
        try {
          const emotions = JSON.parse(await AsyncStorage.getItem('emotions')) || [];
          const newEmotion = {
            id: Date.now(),
            userId: user.id,
            emocion: mapped,
            color: hexColor,
            uri: img.uri,
            date: Date.now(),
          };
          emotions.unshift(newEmotion);
          await AsyncStorage.setItem('emotions', JSON.stringify(emotions));
        } catch (e) {
          console.log(e);
        }
      } else if (emo !== 'No') {
        // Claude respondió algo fuera del mapa — lo mostramos con color gris
        setEmotion(emo);
        Speech.speak(emo, { language: 'es' });
        setColor(DEFAULT_COLOR);
        setBorder(DEFAULT_COLOR);
      } else {
        setEmotion('No se detectó ninguna');
        setColor(DEFAULT_COLOR);
        setBorder(DEFAULT_COLOR);
      }
    } catch (e) {
      console.log(e);
    }
  }

  if (!permission) {
    // Camera permissions are still loading
    return <View />;
  }

  if (!permission.granted) {
    // Camera permissions are not granted yet
    return (
      <View className=" flex items-center justify-center h-[100%]">
        <StatusBar
          backgroundColor="#0d5692"
          hidden={false}
          translucent={true}
        />
        <Text className="text-center text-2xl font-semibold">
          Necesitamos que nos otorgues permiso para acceder a la camara
        </Text>
        <Pressable
          className="bg-sky-700 p-3 rounded-lg mt-3"
          onPress={requestPermission}
        >
          <Text className="text-white font-bold text-lg">Otorgar permisos</Text>
        </Pressable>
        <Pressable
          className="bg-sky-100 p-3 rounded-lg mt-3"
          onPress={() => router.back()}
        >
          <Text className="text-gray-700 font-bold text-lg">Volver</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#fff' }}>
      <StatusBar backgroundColor="#0d5692" hidden={false} translucent={true} />
      <View style={{ marginTop: StatusBar.currentHeight }} />

      {/* Header */}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 8, paddingVertical: 6, backgroundColor: '#fff' }}>
        <Pressable
          style={{ backgroundColor: '#cbd5e1', padding: 8, borderRadius: 8, opacity: 0.6 }}
          onPress={() => router.back()}
        >
          <AntDesign name="left" size={24} color="#0369a1" />
        </Pressable>
        <Image
          source={require('../assets/images/SNT+Bv2.png')}
          style={{ width: 200, height: 50 }}
          resizeMode="contain"
        />
        <View style={{ width: 40 }} />
      </View>

      {/* Cámara o foto */}
      <View style={{
        marginHorizontal: 12,
        marginVertical: 8,
        borderRadius: 16,
        overflow: 'hidden',
        borderWidth: 4,
        borderColor: border,
        aspectRatio: 3 / 4,
        width: '93%',
        alignSelf: 'center',
      }}>
        {fotoUri ? (
          <Image
            source={{ uri: fotoUri }}
            style={{ flex: 1, width: '100%' }}
            resizeMode="cover"
          />
        ) : (
          <CameraView
            ref={(ref) => setCameraRef(ref)}
            style={{ flex: 1 }}
            facing={type}
            pictureSize="1080x1080"
          />
        )}
      </View>

      {/* Texto de emoción */}
      <Pressable onPress={sayEmotion} style={{ paddingHorizontal: 16, paddingVertical: 6 }}>
        <Text style={{ color: color, fontSize: 26, textAlign: 'center', fontFamily: 'SuperFeel' }}>
          {emotion}
        </Text>
        <Text style={{ textAlign: 'center', fontFamily: 'Slaberlin', color: '#64748b', fontSize: 12, marginTop: 2 }}>
          {emotion === 'Escaner de Emociones'
            ? 'Toma una foto y escanea la emoción del rostro'
            : 'Toca para escuchar de nuevo'}
        </Text>
      </Pressable>

      {/* Botones */}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 24, paddingVertical: 10 }}>
        <Pressable
          style={{ backgroundColor: '#e2e8f0', padding: 10, borderRadius: 12 }}
          onPress={toggleCameraType}
        >
          <FontAwesome6 name="camera-rotate" size={28} color="rgb(8 47 73)" />
        </Pressable>

        <Pressable
          style={{ backgroundColor: '#0c4a6e', paddingHorizontal: 28, paddingVertical: 12, borderRadius: 50 }}
          onPress={scanFace}
        >
          <Text style={{ fontSize: 20, fontFamily: 'PlayChickens', color: '#fff', textAlign: 'center' }}>
            {scanText}
          </Text>
        </Pressable>

        <Pressable
          style={{ backgroundColor: '#e2e8f0', padding: 10, borderRadius: 12 }}
          onPress={() => router.navigate('/galery')}
        >
          <MaterialIcons name="photo-library" size={30} color="rgb(8 47 73)" />
        </Pressable>
      </View>

      <SmallTabs />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 20,
    borderColor: '#000',
    borderWidth: 4,
    borderRadius: 12,
    height: 480,
    width: 390,
  },
  face: {
    marginHorizontal: 20,
    borderColor: '#000',
    borderWidth: 4,
    borderRadius: 12,
    height: 420,
    width: 340,
  },
  camera: {
    flex: 1,
    borderRadius: 15,
  },
  buttonContainer: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: 'transparent',
    margin: 64,
  },
  button: {
    flex: 1,
    alignSelf: 'flex-end',
    alignItems: 'center',
  },
  text: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
  },
});