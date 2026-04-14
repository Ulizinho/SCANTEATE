import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import { useState } from 'react';
import {
  Image, StyleSheet, Text, View, Pressable,
  TextInput, ToastAndroid, ScrollView,
  KeyboardAvoidingView, Platform, StatusBar,
} from 'react-native';
import { AntDesign } from '@expo/vector-icons';

export default function Login() {
  const [email, setEmail] = useState('');
  const [pass, setPass]   = useState('');
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);

  const login = async () => {
    if (!email || !pass) {
      ToastAndroid.showWithGravity('Completa todos los campos', ToastAndroid.LONG, ToastAndroid.CENTER);
      return;
    }
    setLoading(true);
    try {
      // TODO: reemplazar por llamada al backend cuando esté listo
      const users = JSON.parse(await AsyncStorage.getItem('users')) || [];
      const found = users.find(
        (u) => u.email === email.toLowerCase().trim() && u.password === pass
      );
      if (!found) {
        ToastAndroid.showWithGravity('Correo o contraseña incorrectos', ToastAndroid.LONG, ToastAndroid.CENTER);
        setLoading(false);
        return;
      }
      await AsyncStorage.setItem('user', JSON.stringify(found));
      router.replace('/home');
    } catch (e) {
      ToastAndroid.showWithGravity('Ocurrió un error, intenta de nuevo', ToastAndroid.LONG, ToastAndroid.CENTER);
      console.log(e);
    }
    setLoading(false);
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView style={{ flex: 1, backgroundColor: '#fff' }} keyboardShouldPersistTaps="handled">
        <StatusBar backgroundColor="#0369a1" hidden={false} translucent={true} />

        {/* Header igual al registro */}
        <View style={styles.header}>
          <Pressable style={styles.backBtn} onPress={() => router.back()}>
            <AntDesign name="left" size={22} color="#fff" />
          </Pressable>
          <View style={{ flex: 1 }}>
            <Text style={styles.headerTitle}>Bienvenido</Text>
            <Text style={styles.headerSub}>Inicia sesión para continuar</Text>
          </View>
          <Image
            style={{ height: 110, width: 110 }}
            source={require('../assets/images/img6.png')}
            resizeMode="contain"
          />
        </View>

        <View style={styles.form}>
          <Text style={styles.sectionLabel}>🔐 Tus datos de acceso</Text>

          <Text style={styles.label}>Correo electrónico</Text>
          <TextInput
            style={styles.input}
            onChangeText={setEmail}
            value={email}
            keyboardType="email-address"
            autoCapitalize="none"
            placeholder="correo@ejemplo.com"
            placeholderTextColor="#94a3b8"
          />

          <Text style={styles.label}>Contraseña</Text>
          <View style={styles.passContainer}>
            <TextInput
              style={[styles.input, { flex: 1, marginBottom: 0 }]}
              onChangeText={setPass}
              value={pass}
              secureTextEntry={!showPass}
              autoCapitalize="none"
              placeholder="Tu contraseña"
              placeholderTextColor="#94a3b8"
            />
            <Pressable style={styles.eyeBtn} onPress={() => setShowPass(!showPass)}>
              <AntDesign name={showPass ? 'eye' : 'eyeo'} size={20} color="#64748b" />
            </Pressable>
          </View>

          <Pressable style={{ alignSelf: 'flex-end', marginTop: 8 }}>
            <Text style={styles.forgotText}>¿Olvidaste tu contraseña?</Text>
          </Pressable>

          <Pressable
            style={[styles.btnPrimary, loading && { opacity: 0.6 }]}
            onPress={login}
            disabled={loading}
          >
            <Text style={styles.btnPrimaryText}>
              {loading ? 'Entrando...' : 'Iniciar sesión'}
            </Text>
          </Pressable>

          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>ó</Text>
            <View style={styles.dividerLine} />
          </View>

          <Pressable style={styles.btnSecondary} onPress={() => router.navigate('/register')}>
            <Text style={styles.btnSecondaryText}>Crear cuenta nueva</Text>
          </Pressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0369a1',
    paddingTop: StatusBar.currentHeight + 12,
    paddingBottom: 16,
    paddingHorizontal: 16,
    gap: 12,
  },
  backBtn: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    padding: 8,
    borderRadius: 8,
  },
  headerTitle: {
    fontSize: 22,
    fontFamily: 'PlayChickens',
    color: '#fff',
  },
  headerSub: {
    fontSize: 12,
    fontFamily: 'Slaberlin',
    color: 'rgba(255,255,255,0.8)',
    marginTop: 2,
  },
  form: {
    paddingHorizontal: 24,
    paddingTop: 28,
    paddingBottom: 40,
  },
  sectionLabel: {
    fontSize: 16,
    fontFamily: 'SlaberlinBold',
    color: '#0c4a6e',
    marginBottom: 20,
  },
  label: {
    fontSize: 13,
    fontFamily: 'SlaberlinBold',
    color: '#334155',
    marginTop: 16,
    marginBottom: 5,
  },
  input: {
    borderWidth: 1.5,
    borderColor: '#cbd5e1',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 15,
    fontFamily: 'Slaberlin',
    color: '#1e293b',
    backgroundColor: '#f8fafc',
  },
  passContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  eyeBtn: {
    padding: 10,
    backgroundColor: '#f8fafc',
    borderWidth: 1.5,
    borderColor: '#cbd5e1',
    borderRadius: 10,
  },
  forgotText: {
    fontSize: 13,
    fontFamily: 'Slaberlin',
    color: '#0369a1',
  },
  btnPrimary: {
    backgroundColor: '#0c4a6e',
    paddingVertical: 16,
    borderRadius: 50,
    alignItems: 'center',
    marginTop: 28,
  },
  btnPrimaryText: {
    color: '#fff',
    fontSize: 17,
    fontFamily: 'SlaberlinBold',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
    gap: 10,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#e2e8f0',
  },
  dividerText: {
    fontSize: 14,
    fontFamily: 'Slaberlin',
    color: '#94a3b8',
  },
  btnSecondary: {
    borderWidth: 1.5,
    borderColor: '#0c4a6e',
    paddingVertical: 14,
    borderRadius: 50,
    alignItems: 'center',
  },
  btnSecondaryText: {
    color: '#0c4a6e',
    fontSize: 16,
    fontFamily: 'SlaberlinBold',
  },
});
