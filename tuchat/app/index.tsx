import React, { useEffect, useState } from "react";
import { View, ActivityIndicator, StyleSheet } from "react-native";
import * as SecureStore from "expo-secure-store";
import { router } from "expo-router";
import { Platform } from "react-native";

import { HomeScreen } from "../src/pages/home/HomeScreen";

export default function Index() {
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    checkAuthentication();
  }, []);

  const checkAuthentication = async () => {
    try {
      let token = null;
      
      // 1. Obtener el token según la plataforma
      if (Platform.OS === 'web') {
        token = localStorage.getItem("token");
      } else {
        token = await SecureStore.getItemAsync("token");
      }

      // 2. Lógica de redirección
      if (token) {
        console.log("[Index] Token detectado, entrando a Home");
        setIsAuthenticated(true);
      } else {
        console.log("[Index] No hay token, redirigiendo a Login");
        router.replace("/login");
      }
    } catch (error) {
      console.error("[Index] Error verificando autenticación:", error);
      router.replace("/login");
    } finally {
      setLoading(false);
    }
  };

  // Pantalla de carga mientras se decide si va a Login o Home
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2563EB" />
      </View>
    );
  }

  // Si está autenticado, renderiza la Home directamente
  // Si no, el useEffect ya se habrá encargado del router.replace("/login")
  return isAuthenticated ? <HomeScreen /> : null;
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
  },
});