import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useState } from 'react';
import { router } from 'expo-router';
import {
  View,
  Text,
  ScrollView,
  Image,
  Pressable,
  StatusBar,
  StyleSheet,
  Linking,
  ToastAndroid,
} from 'react-native';

import Tabs from '../components/Tabs';
import UserAvatar from '../components/UserAvatar';
import { useBiometrics } from '../hooks/useBiometrics';

export default function Settings() {
  const [user, setUser] = useState({ id: 0, name: '', type: '' });
  const [bunkerActivo, setBunkerActivo] = useState(false);

  const { pedir } = useBiometrics();

  const getData = async () => {
    // Cargar usuario
    const data = await AsyncStorage.getItem('user');
    if (data) setUser(JSON.parse(data));

    // Cargar estado del búnker
    const res = await AsyncStorage.getItem('timerConfig');
    const timerData = res ? JSON.parse(res) : null;
    setBunkerActivo(!!timerData?.activo);
  };

  useFocusEffect(
    useCallback(() => {
      getData();
    }, [])
  );

  const logout = async () => {
    // Si el búnker está activo, ni siquiera pedimos huella, bloqueamos directo
    if (bunkerActivo) {
      mostrarAvisoBloqueo();
      return;
    }
    const ok = await pedir('Identifícate para cerrar sesión');
    if (!ok) return;
    await AsyncStorage.removeItem('user');
    router.replace('/loginBefore');
  };

  const mostrarAvisoBloqueo = () => {
    ToastAndroid.showWithGravity(
      '🔒 Búnker Activo: Configuración bloqueada',
      ToastAndroid.SHORT,
      ToastAndroid.CENTER
    );
  };

  const manejarPresion = (item) => {
    if (bunkerActivo && item.protegido) {
      mostrarAvisoBloqueo();
      return;
    }

    if (item.route === 'logout') {
      logout();
    } else if (item.route === 'gotoweb') {
      Linking.openURL('https://scanteate.com');
    } else {
      router.navigate(item.route);
    }
  };

  const settingsButtons = [
    { route: '/createAvatar', image: require('../assets/images/bo_avatarv2.png'), marginBottom: 0, protegido: false },
    { route: '/galery', image: require('../assets/images/bo_galeriav2.png'), marginBottom: -25, protegido: false },
    { route: '/reportConfig', image: require('../assets/images/bo_reportv2.png'), marginBottom: 0, protegido: true },
    { route: '/miInfo', image: require('../assets/images/bo_miinfo.png'), marginBottom: 0, protegido: true },
    { route: 'gotoweb', image: require('../assets/images/bo_web.png'), marginBottom: -30, protegido: true },
    { route: 'logout', image: require('../assets/images/bo_logoutv2.png'), marginBottom: -30, protegido: true },
  ];

  return (
    <View style={{ flex: 1, backgroundColor: '#ffffff' }}>
      <StatusBar backgroundColor="#0d5692" hidden={false} translucent={true} />
      <View style={{ marginTop: StatusBar.currentHeight }}>
        <Image
          className="w-screen h-44 rounded-b-3xl"
          source={require('../assets/images/image.png')}
        />
        <View className="-mt-48 flex items-center">
          <View className="mt-10">
            <UserAvatar />
          </View>
          <Text className="text-white text-center text-xl mt-2 font-custom">Configuración</Text>
          <Text className="text-white text-center mt-1 mb-0 text-sm font-slabold">
            Personaliza tu experiencia
          </Text>
        </View>
      </View>

      <View style={styles.container}>
        <ScrollView contentContainerStyle={{ paddingBottom: 100, paddingTop: 30 }}>
          {settingsButtons.map((item, index) => {
            const bloqueado = bunkerActivo && item.protegido;
            return (
              <Pressable
                key={index}
                onPress={() => manejarPresion(item)}
                style={[
                  styles.buttonContainer, 
                  { marginBottom: item.marginBottom, opacity: bloqueado ? 0.4 : 1 }
                ]}
              >
                <Image
                  source={item.image}
                  style={styles.buttonImage}
                  resizeMode="cover"
                />
                {bloqueado && (
                  <View style={styles.lockBadge}>
                    <Text style={{fontSize: 18}}>🔒</Text>
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
  container: { flex: 1 },
  buttonContainer: { paddingHorizontal: 16, alignItems: 'center', position: 'relative' },
  buttonImage: { width: '100%', maxWidth: 300, height: 300, alignSelf: 'center' },
  lockBadge: {
    position: 'absolute',
    top: '45%',
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderRadius: 50,
    padding: 8,
    elevation: 5
  }
});