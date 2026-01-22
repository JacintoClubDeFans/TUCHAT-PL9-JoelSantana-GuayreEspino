import React, { useState, useEffect, useRef } from 'react';
import { 
  View, FlatList, TextInput, TouchableOpacity, Text, 
  KeyboardAvoidingView, Platform, Image, ActivityIndicator 
} from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { io } from 'socket.io-client';
import * as SecureStore from 'expo-secure-store';
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import { styles } from './chat.styles';
import { 
  getMessagesByRoom, 
  saveMessageLocal, 
  saveDraftLocal, 
  getDraftLocal 
} from '../../db/database';
import axios from 'axios';

const API_URL = "http://172.20.200.18:4000";

// Iconos SVG
const ChevronLeftIcon = () => (
  <Svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="#1e293b" style={{ width: 28, height: 28 }}>
    <Path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
  </Svg>
);

const PhoneIcon = () => (
  <Svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="#6366f1" style={{ width: 22, height: 22 }}>
    <Path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 0 0 2.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 0 1-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 0 0-1.091-.852H4.5A2.25 2.25 0 0 0 2.25 4.5v2.25Z" />
  </Svg>
);

const VideoIcon = () => (
  <Svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="#6366f1" style={{ width: 24, height: 24 }}>
    <Path strokeLinecap="round" strokeLinejoin="round" d="m15.75 10.5 4.72-4.72a.75.75 0 0 1 1.28.53v11.38a.75.75 0 0 1-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 0 0 2.25-2.25v-9a2.25 2.25 0 0 0-2.25-2.25h-9A2.25 2.25 0 0 0 2.25 7.5v9a2.25 2.25 0 0 0 2.25 2.25Z" />
  </Svg>
);

const SmileIcon = () => (
  <Svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="#64748b" style={{ width: 24, height: 24 }}>
    <Path strokeLinecap="round" strokeLinejoin="round" d="M15.182 15.182a4.5 4.5 0 0 1-6.364 0M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0ZM9.75 9.75c0 .414-.168.75-.375.75S9 10.164 9 9.75 9.168 9 9.375 9s.375.336.375.75Zm-.375 0h.008v.015h-.008V9.75Zm5.625 0c0 .414-.168.75-.375.75s-.375-.336-.375-.75.168-.75.375-.75.375.336.375.75Zm-.375 0h.008v.015h-.008V9.75Z" />
  </Svg>
);

const PaperclipIcon = () => (
  <Svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="#64748b" style={{ width: 22, height: 22 }}>
    <Path strokeLinecap="round" strokeLinejoin="round" d="m18.375 12.739-7.693 7.693a4.5 4.5 0 0 1-6.364-6.364l10.94-10.94A3 3 0 1 1 19.5 7.372L8.552 18.32m.009-.01-.01.01m5.699-9.941-7.81 7.81a1.5 1.5 0 0 0 2.112 2.13" />
  </Svg>
);

const SendIcon = () => (
  <Svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="white" style={{ width: 20, height: 20 }}>
    <Path strokeLinecap="round" strokeLinejoin="round" d="M6 12 3.269 3.125A59.769 59.769 0 0 1 21.485 12 59.768 59.768 0 0 1 3.27 20.875L5.999 12Zm0 0h7.5" />
  </Svg>
);

// Función para decodificar el token JWT
const getUserIdFromToken = (token: string) => {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64).split('').map(c => 
        '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)
      ).join('')
    );
    return JSON.parse(jsonPayload).sub;
  } catch (e) {
    console.error("Error decodificando token:", e);
    return null;
  }
};

const socket = io(API_URL);

export const ChatScreen = ({ id, nombre }: any) => {
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState("");
  const [myUserId, setMyUserId] = useState("");
  const [myUserName, setMyUserName] = useState("Usuario");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [miembros, setMiembros] = useState<string[]>([]);
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    const setup = async () => {
      try {
        // Obtener token y extraer userId
        const token = Platform.OS === 'web' 
          ? localStorage.getItem('token') 
          : await SecureStore.getItemAsync('token');
        
        if (token) {
          const uid = getUserIdFromToken(token);
          if (uid) {
            setMyUserId(uid);
            
            // Obtener datos del usuario
            const userDataStr = Platform.OS === 'web'
              ? localStorage.getItem('usuario')
              : await SecureStore.getItemAsync('usuario');
            
            if (userDataStr) {
              const userData = JSON.parse(userDataStr);
              setMyUserName(userData.nombre || "Usuario");
            }

            // Conectar socket con userId
            socket.io.opts.query = { userId: uid };
            socket.connect();
          }
        }

        // Cargar mensajes locales
        const localMessages = getMessagesByRoom(id);
        setMessages(localMessages);

        // Cargar borrador
        setInput(getDraftLocal(id));

        // Obtener miembros de la clase
        try {
          const token = Platform.OS === 'web' 
            ? localStorage.getItem('token') 
            : await SecureStore.getItemAsync('token');
          
          const response = await axios.get(
            `${API_URL}/academico/miembros/${id}`,
            { headers: { Authorization: `Bearer ${token}` } }
          );
          
          if (response.data.ok) {
            setMiembros(response.data.ids || []);
          }
        } catch (error) {
          console.error("Error obteniendo miembros:", error);
        }

        // Unirse a la sala
        socket.emit("join_room", id);
        
        setLoading(false);
      } catch (error) {
        console.error("Error en setup:", error);
        setLoading(false);
      }
    };

    setup();

    // Escuchar mensajes entrantes
    socket.on("chat:receive", (msg) => {
      console.log("📨 Mensaje recibido:", msg);
      
      if (msg.roomId === id) {
        setMessages(prev => {
          // Evitar duplicados
          if (prev.find(m => m.msg_id === msg.msg_id)) return prev;
          
          // Guardar localmente
          saveMessageLocal(msg);
          
          return [...prev, msg];
        });
      }
    });

    return () => {
      socket.off("chat:receive");
      socket.emit("leave_room", id);
    };
  }, [id]);

  const sendMessage = async (imageUri?: string) => {
    if (!input.trim() && !imageUri) return;
    if (!myUserId) {
      console.error("No se puede enviar mensaje: userId no disponible");
      return;
    }

    setSending(true);

    const msg = {
      msg_id: `msg_${Date.now()}_${Math.random()}`,
      roomId: id,
      text: input.trim(),
      image: imageUri || null,
      senderId: myUserId,
      senderName: myUserName,
      timestamp: Date.now(),
      recipients: miembros,
      read: false
    };

    try {
      // Emitir mensaje
      if (imageUri) {
        socket.emit("chat:send_media", msg);
      } else {
        socket.emit("chat:send", msg);
      }

      // Guardar localmente
      saveMessageLocal(msg);
      
      // Agregar a la lista
      setMessages(prev => [...prev, msg]);
      
      // Limpiar input y borrador
      setInput("");
      saveDraftLocal(id, "");

      // Scroll al final
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    } catch (error) {
      console.error("Error enviando mensaje:", error);
    } finally {
      setSending(false);
    }
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.5,
      base64: true
    });
    
    if (!result.canceled && result.assets[0].base64) {
      sendMessage(`data:image/jpeg;base64,${result.assets[0].base64}`);
    }
  };

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6366f1" />
        <Text style={styles.loadingText}>Cargando chat...</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === "ios" ? "padding" : "height"} 
      style={{ flex: 1 }}
      keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 0}
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <ChevronLeftIcon />
          </TouchableOpacity>
          <View style={styles.headerInfo}>
            <Text style={styles.headerTitle} numberOfLines={1}>{nombre}</Text>
            <Text style={styles.headerSubtitle}>
              {miembros.length} {miembros.length === 1 ? 'participante' : 'participantes'}
            </Text>
          </View>
          <View style={styles.headerActions}>
            <TouchableOpacity style={styles.iconButton}>
              <PhoneIcon />
            </TouchableOpacity>
            <TouchableOpacity style={styles.iconButton}>
              <VideoIcon />
            </TouchableOpacity>
          </View>
        </View>

        {/* Lista de mensajes */}
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item) => item.msg_id}
          contentContainerStyle={styles.messagesList}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: false })}
          renderItem={({ item }) => {
            const isMe = item.senderId === myUserId;
            
            return (
              <View style={[
                styles.messageContainer,
                isMe ? styles.myMessageContainer : styles.theirMessageContainer
              ]}>
                {!isMe && (
                  <Text style={styles.senderName}>{item.senderName || "Usuario"}</Text>
                )}
                
                <View style={[
                  styles.messageBubble,
                  isMe ? styles.myMessage : styles.theirMessage
                ]}>
                  {item.image && (
                    <Image 
                      source={{ uri: item.image }} 
                      style={styles.messageImage}
                      resizeMode="cover"
                    />
                  )}
                  {item.text && (
                    <Text style={[
                      styles.messageText,
                      isMe ? styles.myMessageText : styles.theirMessageText
                    ]}>
                      {item.text}
                    </Text>
                  )}
                  <Text style={[
                    styles.messageTime,
                    isMe ? styles.myMessageTime : styles.theirMessageTime
                  ]}>
                    {formatTime(item.timestamp)}
                  </Text>
                </View>
              </View>
            );
          }}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>
                No hay mensajes aún.{'\n'}¡Sé el primero en escribir!
              </Text>
            </View>
          }
        />

        {/* Input de mensaje */}
        <View style={styles.inputContainer}>
          <View style={styles.inputWrapper}>
            <TouchableOpacity 
              onPress={pickImage}
              style={styles.attachButton}
            >
              <PaperclipIcon />
            </TouchableOpacity>
            
            <TextInput 
              style={styles.input}
              value={input}
              onChangeText={(text) => {
                setInput(text);
                saveDraftLocal(id, text);
              }}
              placeholder="Escribe un mensaje..."
              placeholderTextColor="#94a3b8"
              multiline
              maxLength={1000}
            />
            
            <TouchableOpacity 
              onPress={() => sendMessage()}
              style={[
                styles.sendButton,
                (!input.trim() || sending) && styles.sendButtonDisabled
              ]}
              disabled={!input.trim() || sending}
            >
              {sending ? (
                <ActivityIndicator size="small" color="white" />
              ) : (
                <SendIcon />
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
};