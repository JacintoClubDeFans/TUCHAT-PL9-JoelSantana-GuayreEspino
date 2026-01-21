import React, { useEffect, useState, useCallback } from 'react';
import { 
  View, 
  Text, 
  FlatList, 
  ActivityIndicator, 
  RefreshControl, 
  TouchableOpacity,
  Platform,
  Alert
} from 'react-native';
import Svg, { Path } from 'react-native-svg';
import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import { router } from "expo-router"; // CAMBIO: Usamos el router de Expo
import { styles } from './home.styles';
import { ChatItem } from '../../components/ChatItem';

// Definimos la interfaz para que TypeScript reconozca las propiedades
interface Chat {
  id_asignatura: string;
  nombre: string;
  clase: string;
}

const API_URL = "http://192.168.56.1:4000";

// Icono de Cerrar Sesión (Estilo elegante)
const LogoutIcon = () => (
  <Svg fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="#E11D48" style={{ width: 18, height: 18 }}>
    <Path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" />
  </Svg>
);

// Icono para lista vacía
const EmptyIcon = () => (
  <Svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="#94a3b8" style={{ width: 64, height: 64 }}>
    <Path strokeLinecap="round" strokeLinejoin="round" d="M20.25 8.511c.884.284 1.5 1.128 1.5 2.097v4.286c0 1.136-.847 2.1-1.98 2.193-.34.027-.68.052-1.02.072v3.091l-3-3c-1.354 0-2.694-.055-4.02-.163a2.115 2.115 0 0 1-.825-.242m9.345-8.334a2.126 2.126 0 0 0-.476-.095 48.64 48.64 0 0 0-8.048 0c-1.131.094-1.976 1.057-1.976 2.192v4.286c0 .837.46 1.58 1.155 1.951m9.345-8.334V6.637c0-1.621-1.152-3.026-2.76-3.235A48.455 48.455 0 0 0 11.25 3c-2.115 0-4.198.137-6.24.402-1.608.209-2.76 1.614-2.76 3.235v6.226c0 1.621 1.152 3.026 2.76 3.235.577.075 1.157.14 1.74.194V21l4.155-4.155" />
  </Svg>
);

export const HomeScreen = () => {
  // Estado tipado para evitar el error de 'id_asignatura does not exist on type never'
  const [chats, setChats] = useState<Chat[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [syncing, setSyncing] = useState(false);

  const getToken = async () => {
    return Platform.OS === 'web' 
      ? localStorage.getItem('token') 
      : await SecureStore.getItemAsync('token');
  };

  /**
   * Lógica de Cierre de Sesión para Expo Router
   */
  const handleLogout = () => {
    const performLogout = async () => {
      try {
        if (Platform.OS === 'web') {
          localStorage.removeItem('token');
        } else {
          await SecureStore.deleteItemAsync('token');
        }

        // REDIRECCIÓN: En Expo Router usamos replace para limpiar el historial
        router.replace("/login"); 
        
      } catch (error) {
        console.error("Error logout:", error);
      }
    };

    if (Platform.OS === 'web') {
      if (window.confirm("¿Estás seguro de que quieres cerrar sesión?")) {
        performLogout();
      }
    } else {
      Alert.alert("Cerrar Sesión", "¿Seguro que quieres salir de TuChat?", [
        { text: "Cancelar", style: "cancel" },
        { text: "Sí, salir", style: "destructive", onPress: performLogout }
      ]);
    }
  };

  const fetchChats = useCallback(async () => {
    try {
      const token = await getToken();
      if (!token) return;

      const response = await axios.get(`${API_URL}/academico/chats-disponibles`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.ok) {
        setChats(response.data.chats);
      }
    } catch (error) {
      console.error("Error cargando chats:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  const handleSync = async () => {
    setSyncing(true);
    try {
      const token = await getToken();
      if (!token) return;

      await axios.post(`${API_URL}/academico/sync-forzar`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (Platform.OS !== 'web') Alert.alert("Éxito", "Sincronización completada");
      await fetchChats();
    } catch (error) {
      console.error("Error en sync:", error);
    } finally {
      setSyncing(false);
    }
  };

  useEffect(() => {
    fetchChats();
  }, [fetchChats]);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Mis Chats</Text>
          <Text style={styles.headerSubtitle}>
            {chats.length} {chats.length === 1 ? 'asignatura' : 'asignaturas'}
          </Text>
        </View>
        
        <TouchableOpacity 
          onPress={handleLogout} 
          style={styles.logoutButton}
          activeOpacity={0.7}
        >
          <LogoutIcon />
          <Text style={styles.logoutText}>Salir</Text>
        </TouchableOpacity>
      </View>

      {/* Listado */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2563EB" />
          <Text style={styles.loadingText}>Cargando chats...</Text>
        </View>
      ) : (
        <FlatList
          data={chats}
          keyExtractor={(item) => item.id_asignatura}
          renderItem={({ item }) => <ChatItem chat={item} />}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl 
              refreshing={refreshing} 
              onRefresh={() => {
                setRefreshing(true);
                fetchChats();
              }}
              tintColor="#2563EB"
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <EmptyIcon />
              <Text style={styles.emptyTitle}>No hay chats disponibles</Text>
              <Text style={styles.emptyText}>
                No tienes asignaturas en curso actualmente.
              </Text>
              <TouchableOpacity 
                onPress={handleSync}
                style={[styles.emptyButton, syncing && { opacity: 0.5 }]}
                disabled={syncing}
                activeOpacity={0.8}
              >
                <Text style={styles.emptyButtonText}>
                  {syncing ? "Sincronizando..." : "Sincronizar ahora"}
                </Text>
              </TouchableOpacity>
            </View>
          }
        />
      )}
    </View>
  );
};