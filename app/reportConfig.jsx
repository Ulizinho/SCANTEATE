import AsyncStorage from '@react-native-async-storage/async-storage';
import { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StatusBar, Pressable, TextInput,
  ToastAndroid, Switch, Keyboard,
} from 'react-native';
import Tabs from '../components/Tabs';
import { router } from 'expo-router';
import { AntDesign } from '@expo/vector-icons';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import Entypo from '@expo/vector-icons/Entypo';
import { Picker } from '@react-native-picker/picker';
import { useFocusEffect } from '@react-navigation/native';
import { useBiometrics } from '../hooks/useBiometrics';

export default function ReportConfig() {
  const [email, setEmail]           = useState('');
  const [user, setUser]             = useState(null);
  const [isEnabled, setIsEnabled]   = useState(true);
  const [selectedVal, setSelectedVal] = useState('Semanal');
  const [autorizado, setAutorizado] = useState(false);
  const { pedir } = useBiometrics();
  const toggleSwitch = () => setIsEnabled(v => !v);

  useFocusEffect(useCallback(() => {
    setAutorizado(false);
    const verificar = async () => {
      const ok = await pedir('Identifícate para configurar los reportes');
      if (!ok) {
        router.back();
      } else {
        setAutorizado(true);
      }
    };
    verificar();
  }, []));

  useEffect(() => {
    if (!autorizado) return;
    const loadValue = async () => {
      try {
        const data = JSON.parse(await AsyncStorage.getItem('user'));
        setUser(data);
        setEmail(data.psicoEmail || '');
      } catch (e) {
        console.error('Error al cargar datos:', e);
      }
    };
    loadValue();
  }, [autorizado]);

  const sendReport = () => {
    ToastAndroid.showWithGravity(
      'Enviando Reporte',
      ToastAndroid.LONG,
      ToastAndroid.CENTER
    );
  };

  const setPscicoEmail = async () => {
    if (!user) {
      ToastAndroid.showWithGravity(
        'Vuelve a iniciar sesión',
        ToastAndroid.LONG,
        ToastAndroid.CENTER
      );
      return;
    }
    if (!email) {
      ToastAndroid.showWithGravity(
        'Ingresa un correo',
        ToastAndroid.LONG,
        ToastAndroid.CENTER
      );
      return;
    }
    try {
      // TODO: reemplazar por llamada al backend cuando esté listo
      const newData = { ...user, psicoEmail: email.toLowerCase().trim() };
      setUser(newData);
      await AsyncStorage.setItem('user', JSON.stringify(newData));
      // Actualizar también en la lista de usuarios
      const users = JSON.parse(await AsyncStorage.getItem('users')) || [];
      const updated = users.map((u) => (u.id === user.id ? newData : u));
      await AsyncStorage.setItem('users', JSON.stringify(updated));
      Keyboard.dismiss();
      ToastAndroid.showWithGravity(
        'Actualizado correctamente',
        ToastAndroid.LONG,
        ToastAndroid.CENTER
      );
    } catch (e) {
      console.log(e);
      ToastAndroid.showWithGravity(
        'Ocurrió un error, intenta de nuevo',
        ToastAndroid.LONG,
        ToastAndroid.CENTER
      );
    }
  };

  if (!autorizado) return <View style={{ flex: 1, backgroundColor: '#e2e8f0' }} />;

  return (
    <View className="h-[100%] bg-slate-200">
      <StatusBar backgroundColor="#0d5692" hidden={false} translucent={true} />
      <Pressable
        className="absolute top-14 left-5 bg-slate-300 p-2 rounded-lg opacity-50 z-40"
        onPress={() => router.back()}
      >
        <AntDesign name="left" size={24} color="#0369a1" />
      </Pressable>
      <View>
        <View className="h-[87%] mt-24 p-3">
          <Text className="text-sky-800 text-center font-bold text-3xl">
            Configuración de envio de reportes
          </Text>
          <View className="mb-5 mt-10 px-2">
            <Text className="text-slate-800 font-bold text-xl mb-1">
              Correo electrónico del psicólogo
            </Text>
            <View className="flex flex-row content-center justify-between">
              <TextInput
                className="border-2 rounded-lg border-slate-400 placeholder:text-slate-400 w-[74%] p-2 pl-3 text-lg"
                onChangeText={setEmail}
                value={email}
                keyboardType="email-address"
                placeholder="Email"
                autoCapitalize="none"
              />
              <Pressable
                onPress={setPscicoEmail}
                className="p-2 bg-slate-600 rounded-lg w-[25%] flex items-center justify-center"
              >
                <Text className="text-white font-bold">
                  Guardar <Entypo name="save" size={16} color="white" />
                </Text>
              </Pressable>
            </View>
          </View>
          <View className="mx-2 pl-1 py-1 rounded flex flex-row content-center justify-between">
            <Text className="text-xl mt-3 font-bold text-slate-800">
              Envío de reportes automatico
            </Text>
            <Switch
              className="mr-2"
              trackColor={{ false: '#767577', true: 'rgb(125 211 252)' }}
              thumbColor={'#f4f3f4'}
              onValueChange={toggleSwitch}
              value={isEnabled}
            />
          </View>
          <View className="mb-10 mt-6 px-2">
            <Text className="text-slate-800 font-bold text-xl">
              Periodo de envio:{' '}
            </Text>
            <View className="bg-slate-300 rounded-lg">
              <Picker
                selectedValue={selectedVal}
                onValueChange={(itemValue, itemIndex) =>
                  setSelectedVal(itemValue)
                }
              >
                <Picker.Item label="Semanal" value="Semanal" />
                <Picker.Item label="Quincenal" value="Quincenal" />
                <Picker.Item label="Mensual" value="Mensual" />
              </Picker>
            </View>
          </View>
          <Text className="text-slate-800 font-bold text-xl ml-2 mb-2">
            Envio manual:
          </Text>
          <Pressable
            className="p-3 bg-sky-700 rounded mx-2"
            onPress={sendReport}
          >
            <Text className="text-center text-xl font-bold text-white">
              Enviar reporte manualmente
            </Text>
            <MaterialCommunityIcons
              className="absolute right-7 bottom-2"
              name="email-send"
              size={30}
              color="white"
            />
          </Pressable>
        </View>
      </View>
      <Tabs />
    </View>
  );
}
