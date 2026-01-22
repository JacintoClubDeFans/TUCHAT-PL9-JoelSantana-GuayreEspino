import React, { useEffect, useState, useCallback } from 'react';
import { 
  View, Text, FlatList, ActivityIndicator, RefreshControl, 
  TouchableOpacity, Platform, StyleSheet 
} from 'react-native';
import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import { router } from "expo-router";

const API_URL = "http://172.20.200.18:4000";

export const HomeScreen = () => {
  const [chats, setChats] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchChats = useCallback(async () => {
    try {
      const token = Platform.OS === 'web' 
        ? localStorage.getItem('token') 
        : await SecureStore.getItemAsync('token');
        
      if (!token) {
        setLoading(false);
        return;
      }

      // IMPORTANTE: Tu endpoint es /academico/chats-disponibles
      const response = await axios.get(`${API_URL}/academico/chats-disponibles`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      console.log("REVISIÓN DE DATOS:", response.data);

      if (response.data.ok && response.data.chats) {
        // Mapeo directo basado en el JSON real que envía tu servidor
        const processed = response.data.chats.map((item: any) => ({
          // Usamos item.id_chat que es lo que configuraste en el servidor
          id_chat: item.id_chat, 
          nombre: item.nombre || "Asignatura",
          subtitulo: item.subtitulo || "General",
          esProfesor: item.esProfesor || false,
          // Guardamos el ID limpio para la base de datos local
          rawId: item.id_chat
        }));
        
        setChats(processed);
      }
    } catch (e) { 
      console.error("Error cargando chats:", e); 
    } finally { 
      setLoading(false); 
      setRefreshing(false); 
    }
  }, []);

  useEffect(() => { fetchChats(); }, [fetchChats]);

  const renderItem = ({ item }: { item: any }) => {
    const displayNombre = item.nombre;
    const initial = displayNombre.charAt(0).toUpperCase();

    return (
      <TouchableOpacity 
        style={s.chatCard}
        onPress={() => router.push({ 
          pathname: "/chat", 
          params: { id: item.id_chat, nombre: displayNombre } 
        })}
      >
        <View style={s.avatar}>
          <Text style={s.avatarText}>{initial}</Text>
        </View>
        
        <View style={{ flex: 1, marginLeft: 12 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text style={s.claseTitle} numberOfLines={1}>{displayNombre}</Text>
            <View style={s.cursoTagContainer}>
              <Text style={s.cursoTag}>{item.subtitulo}</Text>
            </View>
          </View>
          <Text style={s.profesorName}>
             {item.esProfesor ? "Mensaje privado" : "Chat de la clase"}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={s.container}>
      <View style={s.header}>
        <Text style={s.mainTitle}>Mis Clases</Text>
        <View style={s.badge}><Text style={s.badgeText}>{chats.length}</Text></View>
      </View>

      {loading ? (
        <View style={s.center}><ActivityIndicator size="large" color="#6366f1" /></View>
      ) : (
        <FlatList
          data={chats}
          keyExtractor={(item) => item.id_chat.toString()}
          renderItem={renderItem}
          contentContainerStyle={s.list}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchChats(); }} />
          }
          ListEmptyComponent={
            <View style={s.center}>
              <Text style={{color: '#64748b'}}>No tienes clases asignadas todavía.</Text>
            </View>
          }
        />
      )}
    </View>
  );
};

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  header: { flexDirection: 'row', alignItems: 'center', padding: 20, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#f1f5f9', paddingTop: 50 },
  mainTitle: { fontSize: 24, fontWeight: '800', color: '#1e293b' },
  badge: { backgroundColor: '#6366f1', paddingHorizontal: 8, borderRadius: 10, marginLeft: 10 },
  badgeText: { color: '#fff', fontSize: 12, fontWeight: 'bold' },
  list: { padding: 16 },
  chatCard: { flexDirection: 'row', backgroundColor: '#fff', padding: 16, borderRadius: 16, marginBottom: 12, alignItems: 'center', elevation: 2, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10 },
  avatar: { width: 48, height: 48, borderRadius: 12, backgroundColor: '#6366f1', justifyContent: 'center', alignItems: 'center' },
  avatarText: { color: '#fff', fontWeight: 'bold', fontSize: 18 },
  claseTitle: { fontSize: 16, fontWeight: '700', color: '#1e293b', flex: 1, marginRight: 5 },
  cursoTagContainer: { backgroundColor: '#eef2ff', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
  cursoTag: { fontSize: 10, color: '#6366f1', fontWeight: 'bold' },
  profesorName: { fontSize: 13, color: '#64748b', marginTop: 4 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', marginTop: 100 }
});