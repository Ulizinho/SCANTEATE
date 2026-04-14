import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useState } from 'react';import {
  View, Text, ScrollView, StatusBar, Pressable,
  TextInput, KeyboardAvoidingView, Platform,
  ToastAndroid, StyleSheet,
} from 'react-native';
import { router } from 'expo-router';
import { AntDesign } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { Picker } from '@react-native-picker/picker';
import Tabs from '../components/Tabs';

import { useBiometrics } from '../hooks/useBiometrics';

export default function MiInfo() {
  // Datos del tutor
  const [tutor, setTutor] = useState({ name: '', email: '' });

  // Datos del niño
  const [nombreNino, setNombreNino] = useState('');
  const [edad, setEdad]             = useState('');
  const [tea, setTea]               = useState('Nivel 1');
  const [notas, setNotas]           = useState('');

  const [emailPsico, setEmailPsico] = useState('');

  const [autorizado, setAutorizado] = useState(false);
  const { pedir } = useBiometrics();

  const cargarDatos = async () => {
    const userData = JSON.parse(await AsyncStorage.getItem('user')) || {};
    setTutor({ name: userData.name || '', email: userData.email || '' });

    const infoNino = JSON.parse(await AsyncStorage.getItem(`infoNino_${userData.id}`));
    if (infoNino) {
      setNombreNino(infoNino.nombre || '');
      setEdad(infoNino.edad || '');
      setTea(infoNino.tea || 'Nivel 1');
      setNotas(infoNino.notas || '');
      setEmailPsico(infoNino.emailPsico || userData.psicoEmail || '');
    }
  };

  useFocusEffect(useCallback(() => {
    setAutorizado(false);
    const verificar = async () => {
      const ok = await pedir('Identifícate para ver tu información');
      if (!ok) {
        router.back();
      } else {
        setAutorizado(true);
        cargarDatos();
      }
    };
    verificar();
  }, []));

  const guardar = async () => {
    if (!nombreNino.trim() || !edad.trim()) {
      ToastAndroid.showWithGravity('El nombre y la edad son obligatorios', ToastAndroid.LONG, ToastAndroid.CENTER);
      return;
    }
    const userData = JSON.parse(await AsyncStorage.getItem('user'));
    // Guardar info del niño
    await AsyncStorage.setItem(`infoNino_${userData.id}`, JSON.stringify({
      nombre: nombreNino.trim(),
      edad: edad.trim(),
      tea,
      notas: notas.trim(),
      emailPsico: emailPsico.toLowerCase().trim(),
    }));
    // Sincronizar emailPsico en el user también
    const updatedUser = { ...userData, psicoEmail: emailPsico.toLowerCase().trim() };
    await AsyncStorage.setItem('user', JSON.stringify(updatedUser));
    const users = JSON.parse(await AsyncStorage.getItem('users')) || [];
    await AsyncStorage.setItem('users', JSON.stringify(users.map(u => u.id === userData.id ? updatedUser : u)));
    ToastAndroid.showWithGravity('¡Información actualizada!', ToastAndroid.SHORT, ToastAndroid.CENTER);
    router.back();
  };

  if (!autorizado) return <View style={{ flex: 1, backgroundColor: '#f1f5f9' }} />;

  return (
    <View style={{ flex: 1, backgroundColor: '#f1f5f9' }}>
      <StatusBar backgroundColor="#0d5692" hidden={false} translucent={true} />
      <View style={{ marginTop: StatusBar.currentHeight }} />

      {/* Header */}
      <View style={styles.header}>
        <Pressable style={styles.backBtn} onPress={() => router.back()}>
          <AntDesign name="left" size={24} color="#0369a1" />
        </Pressable>
        <Text style={styles.headerTitle}>Mi Información</Text>
        <View style={{ width: 40 }} />
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 120 }}>

          {/* Sección tutor */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>👤 Datos del tutor</Text>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Nombre</Text>
              <Text style={styles.infoValue}>{tutor.name || '—'}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Correo</Text>
              <Text style={styles.infoValue}>{tutor.email || '—'}</Text>
            </View>
            <Text style={styles.infoHint}>
              Para cambiar estos datos, vuelve a registrarte o actualízalos desde la configuración de cuenta.
            </Text>
          </View>

          {/* Sección niño */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>🧩 Datos del niño</Text>

            <Text style={styles.label}>Nombre *</Text>
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
              style={[styles.input, { height: 90, textAlignVertical: 'top' }]}
              value={notas}
              onChangeText={setNotas}
              placeholder="Alergias, medicamentos, contexto especial..."
              placeholderTextColor="#94a3b8"
              multiline
              numberOfLines={3}
            />

            <Text style={styles.label}>
              Correo del psicólogo / terapeuta
              <Text style={{ fontSize: 11, color: '#94a3b8', fontFamily: 'Slaberlin' }}> (opcional)</Text>
            </Text>
            <TextInput
              style={styles.input}
              value={emailPsico}
              onChangeText={setEmailPsico}
              inputMode="email-address"
              autoCapitalize="none"
              placeholder="psico@ejemplo.com"
              placeholderTextColor="#94a3b8"
            />
          </View>

          <Pressable style={styles.btnGuardar} onPress={guardar}>
            <Text style={styles.btnGuardarText}>Guardar cambios</Text>
          </Pressable>

        </ScrollView>
      </KeyboardAvoidingView>

      <Tabs />
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  backBtn: {
    backgroundColor: '#e2e8f0',
    padding: 8,
    borderRadius: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontFamily: 'SlaberlinBold',
    color: '#0c4a6e',
  },
  section: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 18,
    marginBottom: 16,
    elevation: 1,
  },
  sectionTitle: {
    fontSize: 17,
    fontFamily: 'SlaberlinBold',
    color: '#0c4a6e',
    marginBottom: 14,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  infoLabel: {
    fontSize: 14,
    fontFamily: 'SlaberlinBold',
    color: '#64748b',
  },
  infoValue: {
    fontSize: 14,
    fontFamily: 'Slaberlin',
    color: '#1e293b',
    maxWidth: '65%',
    textAlign: 'right',
  },
  infoHint: {
    fontSize: 12,
    fontFamily: 'Slaberlin',
    color: '#94a3b8',
    marginTop: 10,
    lineHeight: 18,
  },
  label: {
    fontSize: 14,
    fontFamily: 'SlaberlinBold',
    color: '#334155',
    marginTop: 12,
    marginBottom: 4,
  },
  input: {
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
    borderWidth: 1.5,
    borderColor: '#cbd5e1',
    borderRadius: 10,
    backgroundColor: '#f8fafc',
    overflow: 'hidden',
  },
  btnGuardar: {
    backgroundColor: '#0c4a6e',
    paddingVertical: 16,
    borderRadius: 50,
    alignItems: 'center',
    marginTop: 8,
  },
  btnGuardarText: {
    color: '#fff',
    fontSize: 17,
    fontFamily: 'SlaberlinBold',
  },
});