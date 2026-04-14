import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, Pressable, StyleSheet,
  TextInput, FlatList, StatusBar,
} from 'react-native';
import Checkbox from 'expo-checkbox';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AntDesign } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { useBiometrics } from '../hooks/useBiometrics';

const TASKS_KEY = 'tasks';
const DATE_KEY  = 'lastDate';

export default function DailyTasks() {
  const [tasks, setTasks]               = useState([]);
  const [newTask, setNewTask]           = useState('');
  const [editingIndex, setEditingIndex] = useState(null);
  const [autorizado, setAutorizado]     = useState(false);
  const { pedir } = useBiometrics();

  // Pedir huella al entrar
  useFocusEffect(
    useCallback(() => {
      setAutorizado(false); // reset cada vez que entras
      const verificar = async () => {
        const ok = await pedir('Identifícate para gestionar la rutina del niño');
        if (!ok) {
          router.back();
        } else {
          setAutorizado(true);
        }
      };
      verificar();
    }, [])
  );

  useEffect(() => {
    if (!autorizado) return;
    const loadTasks = async () => {
      try {
        const storedTasks = await AsyncStorage.getItem(TASKS_KEY);
        const storedDate  = await AsyncStorage.getItem(DATE_KEY);
        const today = new Date().toDateString();
        if (storedDate !== today || !storedTasks) {
          await AsyncStorage.setItem(DATE_KEY, today);
          setTasks([]);
        } else {
          setTasks(JSON.parse(storedTasks).filter(t => !t.complete) || []);
        }
      } catch (e) {
        console.error('Error al cargar tareas:', e);
      }
    };
    loadTasks();
  }, [autorizado]);

  const saveTasks = async (updated) => {
    setTasks(updated.filter(t => !t.complete));
    await AsyncStorage.setItem(TASKS_KEY, JSON.stringify(updated));
  };

  const toggleTaskComplete = (index) => {
    saveTasks(tasks.map((t, i) => i === index ? { ...t, complete: !t.complete } : t));
  };

  const addTask = () => {
    if (!newTask.trim()) return;
    if (editingIndex !== null) {
      saveTasks(tasks.map((t, i) => i === editingIndex ? { ...t, title: newTask } : t));
      setEditingIndex(null);
    } else {
      saveTasks([...tasks, { title: newTask, complete: false }]);
    }
    setNewTask('');
  };

  const deleteTask = (index) => {
    saveTasks(tasks.filter((_, i) => i !== index));
  };

  if (!autorizado) return <View style={{ flex: 1, backgroundColor: '#f5f5f5' }} />;

  return (
    <View style={styles.container}>
      <StatusBar backgroundColor="#0d5692" hidden={false} translucent={true} />
      <View style={styles.header}>
        <Pressable style={styles.backBtn} onPress={() => router.back()}>
          <AntDesign name="left" size={22} color="#0369a1" />
        </Pressable>
        <Text style={styles.title}>Rutina del día</Text>
      </View>

      {tasks.length === 0 ? (
        <Text style={styles.noTasksText}>
          No hay tareas pendientes para hoy.{'\n'}Agrega las actividades del niño.
        </Text>
      ) : (
        <FlatList
          data={tasks}
          keyExtractor={(_, i) => i.toString()}
          style={{ flex: 1 }}
          renderItem={({ item, index }) => (
            <View style={styles.taskItem}>
              <Pressable style={styles.taskButton} onPress={() => toggleTaskComplete(index)}>
                <Checkbox
                  value={item.complete}
                  onValueChange={() => toggleTaskComplete(index)}
                  color={item.complete ? '#0369a1' : undefined}
                />
                <Text style={[styles.taskText, item.complete && styles.taskDone]}>
                  {item.title}
                </Text>
              </Pressable>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                <Pressable onPress={() => { setNewTask(item.title); setEditingIndex(index); }}>
                  <AntDesign name="edit" size={22} color="#0369a1" />
                </Pressable>
                <Pressable onPress={() => deleteTask(index)}>
                  <AntDesign name="delete" size={22} color="#e11d48" />
                </Pressable>
              </View>
            </View>
          )}
        />
      )}

      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          placeholder="Nueva tarea..."
          placeholderTextColor="#94a3b8"
          value={newTask}
          onChangeText={setNewTask}
          onSubmitEditing={addTask}
        />
        <Pressable style={styles.addBtn} onPress={addTask}>
          <AntDesign name={editingIndex !== null ? 'check' : 'plus'} size={22} color="#fff" />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f1f5f9',
    paddingTop: StatusBar.currentHeight,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    gap: 12,
  },
  backBtn: {
    backgroundColor: '#e2e8f0',
    padding: 8,
    borderRadius: 8,
  },
  title: {
    fontSize: 22,
    fontFamily: 'SlaberlinBold',
    color: '#0c4a6e',
  },
  noTasksText: {
    fontSize: 16,
    textAlign: 'center',
    marginTop: 60,
    color: '#94a3b8',
    fontFamily: 'Slaberlin',
    lineHeight: 26,
    paddingHorizontal: 40,
  },
  taskItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    marginHorizontal: 16,
    marginVertical: 5,
    backgroundColor: '#fff',
    borderRadius: 12,
    elevation: 1,
  },
  taskButton: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  taskText: {
    fontSize: 16,
    fontFamily: 'Slaberlin',
    color: '#1e293b',
    flex: 1,
  },
  taskDone: {
    textDecorationLine: 'line-through',
    color: '#94a3b8',
  },
  inputRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    gap: 10,
  },
  input: {
    flex: 1,
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
  addBtn: {
    backgroundColor: '#0c4a6e',
    padding: 12,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
