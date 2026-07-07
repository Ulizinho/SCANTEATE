import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import { router } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  View, Text, ScrollView, Image, Pressable, StatusBar,
  StyleSheet, ToastAndroid, Dimensions
} from 'react-native';

import Tabs from '../components/Tabs';
import UserAvatar from '../components/UserAvatar';

const { width } = Dimensions.get('window');

export default function HomeScreen() {
  const [nombreNino, setNombreNino] = useState('');
  const [bunkerActivo, setBunkerActivo] = useState(false);

  const getUser = async () => {
    try {
      const data = await AsyncStorage.getItem('user');
      if (data) {
        const userData = JSON.parse(data);
        const infoNino = JSON.parse(await AsyncStorage.getItem(`infoNino_${userData.id}`));
        setNombreNino(infoNino?.nombre || userData.name);
      }
      const res = await AsyncStorage.getItem('timerConfig');
      const timerData = res ? JSON.parse(res) : null;
      setBunkerActivo(!!timerData?.activo);
    } catch (e) { console.log(e); }
  };

  useFocusEffect(useCallback(() => { getUser(); }, []));

  const buttons = [
    { route: '/emotions', image: require('../assets/images/bo_escanv2.png'), protegido: false, mb: -20 },
    { route: '/games', image: require('../assets/images/bo_juegosv2.png'), protegido: false, mb: 10 },
    { route: '/cuentos', image: require('../assets/images/bo_cuentosv2.png'), protegido: false, mb: 10 },
    { route: '/dailyTasks', image: require('../assets/images/bo_rutinav2.png'), protegido: true, mb: 10 },
    { route: '/actividades', image: require('../assets/images/bo_actividadesv2.png'), protegido: false, mb: -20 },
    { route: '/timer', image: require('../assets/images/bo_timer.png'), protegido: true, mb: 10 },
  ];

  return (
    <View className="h-[100%] bg-white">
      <StatusBar backgroundColor="#0d5692" barStyle="light-content" translucent={true} />
      
      {/* HEADER ESTILO VIEJO */}
      <View style={{ marginTop: StatusBar.currentHeight, zIndex: 99 }}>
        <Image
          className="w-screen h-44 rounded-b-3xl"
          source={require('../assets/images/image.png')}
        />
        <View className="-mt-48 flex items-center">
          <View className="mt-10">
            <UserAvatar />
          </View>
          <Text
            style={{
              color: 'white',
              textAlign: 'center',
              fontSize: 20,
              marginTop: 8,
              fontFamily: 'SuperFeel',
              textShadowColor: 'rgba(0, 0, 0, 0.4)',
              textShadowOffset: { width: 1, height: 1 },
              textShadowRadius: 3,
            }}
          >
            {nombreNino.toUpperCase()}
          </Text>
        </View>
      </View>

      {/* CUERPO DE BOTONES */}
      <View className="flex-1">
        <ScrollView 
          contentContainerStyle={{ paddingBottom: 120, paddingTop: 30 }}
          showsVerticalScrollIndicator={false}
        >
          {buttons.map((item, index) => {
            const blocked = bunkerActivo && item.protegido;
            return (
              <Pressable
                key={index}
                onPress={() => {
                  if (blocked) {
                    ToastAndroid.show('🔒 Búnker Activo', ToastAndroid.SHORT);
                  } else {
                    router.navigate(item.route);
                  }
                }}
                style={[styles.buttonContainer, { marginBottom: item.mb, opacity: blocked ? 0.6 : 1 }]}
              >
                <Image
                  source={item.image}
                  style={styles.buttonImage}
                  resizeMode="contain"
                />
                {blocked && (
                  <View style={styles.lockBadge}>
                    <Text style={{ fontSize: 24 }}>🔒</Text>
                  </View>
                )}
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      <Tabs className="absolute bottom-0" />
    </View>
  );
}

const styles = StyleSheet.create({
  buttonContainer: {
    paddingHorizontal: 2,
    alignItems: 'center',
    position: 'relative'
  },
  buttonImage: {
    width: width * 0.85,
    height: 280, // Ajustado para que no se vea gigante pero mantenga la esencia del viejo
    alignSelf: 'center',
  },
  lockBadge: {
    position: 'absolute',
    top: '40%',
    backgroundColor: 'rgba(255,255,255,0.8)',
    padding: 12,
    borderRadius: 50,
    elevation: 5
  }
});