import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, Switch, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import { io } from 'socket.io-client';

const API_URL = "http://172.20.200.18:4000";
const socket = io(API_URL);

const getStorageItem = async (key: string) => {
  if (Platform.OS === 'web') return localStorage.getItem(key);
  try { return await SecureStore.getItemAsync(key); } catch { return null; }
};

export const ChatInfoScreen = ({ roomId, nombre, esProfesor }: any) => {
  const [participantes, setParticipantes] = useState<any[]>([]);
  const [soloLectura, setSoloLectura] = useState(false);
  const [delegados, setDelegados] = useState<string[]>([]);

  useEffect(() => {
    const fetchParticipantes = async () => {
      try {
        const token = await getStorageItem('token') || await getStorageItem('userToken');
        const res = await axios.get(`${API_URL}/academico/miembros-detalle/${roomId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.data.ok) {
          setParticipantes(res.data.usuarios || []);
          setSoloLectura(res.data.config?.soloLectura || false);
          setDelegados(res.data.config?.delegados || []);
        }
      } catch (e) {
        console.error("Error en InfoChat (500):", e);
      }
    };
    fetchParticipantes();
  }, [roomId]);

  const toggleSoloLectura = (value: boolean) => {
    setSoloLectura(value);
    socket.emit("chat:update_settings", { roomId, soloProfesores: value, delegados, esProfesor: true });
  };

  const toggleDelegado = (userId: string) => {
    const nuevasDelegados = delegados.includes(userId) 
      ? delegados.filter(id => id !== userId) : [...delegados, userId];
    setDelegados(nuevasDelegados);
    socket.emit("chat:update_settings", { roomId, soloProfesores: soloLectura, delegados: nuevasDelegados, esProfesor: true });
  };

  return (
    <View style={styles.container}>
      <Text style={styles.headerTitleText}>{nombre}</Text>
      
      {esProfesor && (
        <View style={styles.settingRow}>
          <Text style={styles.settingText}>Solo profesores pueden hablar</Text>
          <Switch value={soloLectura} onValueChange={toggleSoloLectura} />
        </View>
      )}

      <Text style={styles.sectionTitle}>Participantes ({participantes.length})</Text>
      <FlatList
        data={participantes}
        keyExtractor={(item) => item.id_usuario.toString()}
        renderItem={({ item }) => (
          <View style={styles.userRow}>
            <View>
              <Text style={styles.userName}>{item.nombre}</Text>
              <Text style={styles.userRole}>{item.es_profesor ? "Profesor" : "Alumno"}</Text>
            </View>
            
            {esProfesor && !item.es_profesor && (
              <TouchableOpacity 
                onPress={() => toggleDelegado(item.id_usuario)}
                style={[styles.badge, delegados.includes(item.id_usuario) ? styles.badgeActive : styles.badgeInactive]}
              >
                <Text style={{color: 'white', fontSize: 11, fontWeight: 'bold'}}>
                  {delegados.includes(item.id_usuario) ? 'Delegado' : '+ Hacer Delegado'}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', padding: 20 },
  headerTitleText: { fontSize: 22, fontWeight: 'bold', marginBottom: 20, color: '#1e293b' },
  sectionTitle: { fontSize: 12, fontWeight: 'bold', color: '#64748b', marginTop: 25, marginBottom: 10, textTransform: 'uppercase' },
  settingRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  settingText: { fontSize: 15, color: '#334155' },
  userRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 0.5, borderBottomColor: '#f1f5f9' },
  userName: { fontSize: 16, fontWeight: '500', color: '#1e293b' },
  userRole: { fontSize: 13, color: '#94a3b8' },
  badge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  badgeActive: { backgroundColor: '#10B981' },
  badgeInactive: { backgroundColor: '#e2e8f0' }
});