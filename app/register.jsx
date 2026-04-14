import { useState } from 'react';
import { router } from 'expo-router';
import {
  Image, StyleSheet, Text, View, Pressable,
  TextInput, ToastAndroid, ScrollView,
  KeyboardAvoidingView, Platform, StatusBar,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Picker } from '@react-native-picker/picker';
import { AntDesign } from '@expo/vector-icons';

export default function Register() {
  const [paso, setPaso] = useState(1); // 1 = tutor, 2 = niño
  const [loading, setLoading] = useState(false);

  // Paso 1 — tutor
  const [name, setName]       = useState('');
  const [emailT, setEmailT]   = useState('');
  const [pass, setPass]       = useState('');
  const [pass2, setPass2]     = useState('');

  // Paso 2 — niño
  const [nombreNino, setNombreNino]     = useState('');
  const [edad, setEdad]                 = useState('');
  const [tea, setTea]                   = useState('Nivel 1');
  const [emailPsico, setEmailPsico]     = useState('');

  const validarPaso1 = () => {
    if (!name.trim() || !emailT.trim() || !pass || !pass2) {
      ToastAndroid.showWithGravity('Completa todos los campos', ToastAndroid.LONG, ToastAndroid.CENTER);
      return;
    }
    if (pass !== pass2) {
      ToastAndroid.showWithGravity('Las contraseñas no coinciden', ToastAndroid.LONG, ToastAndroid.CENTER);
      return;
    }
    if (pass.length < 6) {
      ToastAndroid.showWithGravity('La contraseña debe tener al menos 6 caracteres', ToastAndroid.LONG, ToastAndroid.CENTER);
      return;
    }
    setPaso(2);
  };

  const registrar = async () => {
    if (!nombreNino.trim() || !edad.trim()) {
      ToastAndroid.showWithGravity('El nombre y la edad del niño son obligatorios', ToastAndroid.LONG, ToastAndroid.CENTER);
      return;
    }
    setLoading(true);
    try {
      // TODO: reemplazar por llamada al backend cuando esté listo
      const users = JSON.parse(await AsyncStorage.getItem('users')) || [];
      const exists = users.find((u) => u.email === emailT.toLowerCase().trim());
      if (exists) {
        ToastAndroid.showWithGravity('Ya existe una cuenta con ese correo', ToastAndroid.LONG, ToastAndroid.CENTER);
        setLoading(false);
        setPaso(1);
        return;
      }

      const newUser = {
        id: Date.now(),
        name: name.trim(),
        email: emailT.toLowerCase().trim(),
        password: pass,
        type: 'Tutor',
        psicoEmail: emailPsico.toLowerCase().trim(),
      };

      // Guardar usuario
      users.push(newUser);
      await AsyncStorage.setItem('users', JSON.stringify(users));
      await AsyncStorage.setItem('user', JSON.stringify(newUser));

      // Guardar info del niño vinculada al userId
      await AsyncStorage.setItem(`infoNino_${newUser.id}`, JSON.stringify({
        nombre: nombreNino.trim(),
        edad: edad.trim(),
        tea,
        notas: '',
        emailPsico: emailPsico.toLowerCase().trim(),
      }));

      router.replace('/home');
    } catch (e) {
      ToastAndroid.showWithGravity('Ocurrió un error, intenta de nuevo', ToastAndroid.SHORT, ToastAndroid.CENTER);
      console.log(e);
    }
    setLoading(false);
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView style={{ flex: 1, backgroundColor: '#fff' }}>
        <StatusBar backgroundColor="#0369a1" hidden={false} translucent={true} />

        {/* Header */}
        <View style={styles.header}>
          <Pressable style={styles.backBtn} onPress={() => paso === 2 ? setPaso(1) : router.back()}>
            <AntDesign name="left" size={22} color="#fff" />
          </Pressable>
          <View style={{ flex: 1 }}>
            <Text style={styles.headerTitle}>Crear cuenta</Text>
            <Text style={styles.headerSub}>
              {paso === 1 ? 'Paso 1 de 2 — Datos del tutor' : 'Paso 2 de 2 — Datos del niño'}
            </Text>
          </View>
          <Image
            style={{ height: 110, width: 110 }}
            source={require('../assets/images/img77.png')}
            resizeMode="contain"
          />
        </View>

        {/* Indicador de pasos */}
        <View style={styles.stepsRow}>
          <View style={[styles.stepDot, paso >= 1 && styles.stepDotActive]} />
          <View style={[styles.stepLine, paso >= 2 && styles.stepLineActive]} />
          <View style={[styles.stepDot, paso >= 2 && styles.stepDotActive]} />
        </View>

        <View style={styles.form}>

          {/* ── PASO 1: Tutor ── */}
          {paso === 1 && (
            <>
              <Text style={styles.sectionLabel}>👤 Información del tutor</Text>

              <Text style={styles.label}>Tu nombre completo *</Text>
              <TextInput
                style={styles.input}
                onChangeText={setName}
                value={name}
                placeholder="Nombre del tutor"
                placeholderTextColor="#94a3b8"
              />

              <Text style={styles.label}>Correo electrónico *</Text>
              <TextInput
                style={styles.input}
                onChangeText={setEmailT}
                value={emailT}
                inputMode="email-address"
                autoCapitalize="none"
                placeholder="correo@ejemplo.com"
                placeholderTextColor="#94a3b8"
              />

              <Text style={styles.label}>Contraseña * (mínimo 6 caracteres)</Text>
              <TextInput
                style={styles.input}
                onChangeText={setPass}
                value={pass}
                secureTextEntry={true}
                autoCapitalize="none"
                placeholder="Contraseña"
                placeholderTextColor="#94a3b8"
              />

              <Text style={styles.label}>Confirmar contraseña *</Text>
              <TextInput
                style={styles.input}
                onChangeText={setPass2}
                value={pass2}
                secureTextEntry={true}
                autoCapitalize="none"
                placeholder="Repite tu contraseña"
                placeholderTextColor="#94a3b8"
              />

              <Pressable style={styles.btnPrimary} onPress={validarPaso1}>
                <Text style={styles.btnPrimaryText}>Siguiente →</Text>
              </Pressable>
            </>
          )}

          {/* ── PASO 2: Niño ── */}
          {paso === 2 && (
            <>
              <Text style={styles.sectionLabel}>🧩 Información del niño</Text>

              <Text style={styles.label}>Nombre del niño *</Text>
              <TextInput
                style={styles.input}
                onChangeText={setNombreNino}
                value={nombreNino}
                placeholder="Nombre completo del niño"
                placeholderTextColor="#94a3b8"
              />

              <Text style={styles.label}>Edad *</Text>
              <TextInput
                style={styles.input}
                onChangeText={setEdad}
                value={edad}
                placeholder="Ej: 7"
                placeholderTextColor="#94a3b8"
                keyboardType="numeric"
                maxLength={2}
              />

              <Text style={styles.label}>Nivel de TEA</Text>
              <View style={styles.pickerContainer}>
                <Picker
                  selectedValue={tea}
                  onValueChange={(val) => setTea(val)}
                  style={{ color: '#1e293b' }}
                >
                  <Picker.Item label="Nivel 1 — Requiere apoyo" value="Nivel 1" />
                  <Picker.Item label="Nivel 2 — Requiere apoyo sustancial" value="Nivel 2" />
                  <Picker.Item label="Nivel 3 — Requiere apoyo muy sustancial" value="Nivel 3" />
                </Picker>
              </View>

              <Text style={styles.label}>
                Correo del psicólogo / terapeuta
                <Text style={styles.opcional}> (opcional)</Text>
              </Text>
              <TextInput
                style={styles.input}
                onChangeText={setEmailPsico}
                value={emailPsico}
                inputMode="email-address"
                autoCapitalize="none"
                placeholder="psico@ejemplo.com"
                placeholderTextColor="#94a3b8"
              />
              <Text style={styles.hint}>
                Si lo agregas ahora, los reportes se podrán enviar directamente al especialista.
                Puedes agregarlo después desde Mi Info.
              </Text>

              <Pressable
                style={[styles.btnPrimary, loading && { opacity: 0.6 }]}
                onPress={registrar}
                disabled={loading}
              >
                <Text style={styles.btnPrimaryText}>
                  {loading ? 'Creando cuenta...' : '¡Crear cuenta!'}
                </Text>
              </Pressable>
            </>
          )}

          <Pressable onPress={() => router.back()} style={{ alignItems: 'center', marginTop: 12, marginBottom: 40 }}>
            <Text style={{ color: '#0369a1', fontFamily: 'SuperFeel', fontSize: 16 }}>
              Ya tengo cuenta
            </Text>
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
  stepsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 0,
  },
  stepDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#cbd5e1',
  },
  stepDotActive: {
    backgroundColor: '#0369a1',
  },
  stepLine: {
    width: 60,
    height: 3,
    backgroundColor: '#cbd5e1',
    marginHorizontal: 6,
  },
  stepLineActive: {
    backgroundColor: '#0369a1',
  },
  form: {
    paddingHorizontal: 24,
    paddingBottom: 20,
  },
  sectionLabel: {
    fontSize: 16,
    fontFamily: 'SlaberlinBold',
    color: '#0c4a6e',
    marginBottom: 16,
    marginTop: 4,
  },
  label: {
    fontSize: 13,
    fontFamily: 'SlaberlinBold',
    color: '#334155',
    marginTop: 14,
    marginBottom: 5,
  },
  opcional: {
    fontSize: 12,
    fontFamily: 'Slaberlin',
    color: '#94a3b8',
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
  pickerContainer: {
    borderWidth: 1.5,
    borderColor: '#cbd5e1',
    borderRadius: 10,
    backgroundColor: '#f8fafc',
    overflow: 'hidden',
  },
  hint: {
    fontSize: 11,
    fontFamily: 'Slaberlin',
    color: '#94a3b8',
    marginTop: 5,
    lineHeight: 16,
  },
  btnPrimary: {
    backgroundColor: '#0c4a6e',
    paddingVertical: 16,
    borderRadius: 50,
    alignItems: 'center',
    marginTop: 28,
    marginBottom: 8,
  },
  btnPrimaryText: {
    color: '#fff',
    fontSize: 17,
    fontFamily: 'SlaberlinBold',
  },
});
