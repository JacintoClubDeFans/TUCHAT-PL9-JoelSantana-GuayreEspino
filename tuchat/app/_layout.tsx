import { Slot, router, useSegments } from "expo-router";
import { useEffect, useState } from "react";
import { Platform } from "react-native";
import * as SecureStore from "expo-secure-store";

export default function Layout() {
  const [ready, setReady] = useState(false);
  const [hasToken, setHasToken] = useState(false);
  const segments = useSegments();

  const checkAuth = async () => {
    try {
      let token;
      if (Platform.OS === 'web') {
        token = localStorage.getItem("token");
      } else {
        token = await SecureStore.getItemAsync("token");
      }
      setHasToken(!!token);
    } catch (e) {
      setHasToken(false);
    } finally {
      setReady(true);
    }
  };

  useEffect(() => {
    checkAuth();
  }, [segments]); // <-- Importante: re-comprobar cuando cambie la ruta

  useEffect(() => {
    if (!ready) return;

    const inAuthGroup = segments[0] === "login";

    if (!hasToken && !inAuthGroup) {
      router.replace("/login");
    } else if (hasToken && inAuthGroup) {
      router.replace("/"); // Si tiene token y está en login, mándalo a home
    }
  }, [ready, hasToken, segments]);

  if (!ready) return null;

  return <Slot />;
}