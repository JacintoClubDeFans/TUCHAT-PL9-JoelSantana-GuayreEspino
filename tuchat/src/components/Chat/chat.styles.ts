import { StyleSheet, Platform } from 'react-native';

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },

  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
  },

  loadingText: {
    marginTop: 16,
    fontSize: 15,
    fontWeight: '500',
    color: '#64748B',
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: 16,
    paddingHorizontal: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
      web: {
        boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.05)',
      }
    }),
  },

  backButton: {
    padding: 4,
    marginRight: 12,
  },

  headerInfo: {
    flex: 1,
    justifyContent: 'center',
  },

  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
    letterSpacing: -0.3,
  },

  headerSubtitle: {
    fontSize: 13,
    fontWeight: '500',
    color: '#64748B',
    marginTop: 2,
  },

  headerActions: {
    flexDirection: 'row',
    gap: 12,
  },

  iconButton: {
    padding: 8,
    borderRadius: 10,
    backgroundColor: '#EFF6FF',
  },

  // Lista de mensajes
  messagesList: {
    paddingHorizontal: 16,
    paddingVertical: 20,
    paddingBottom: 8,
  },

  messageContainer: {
    marginBottom: 16,
    maxWidth: '80%',
  },

  myMessageContainer: {
    alignSelf: 'flex-end',
    alignItems: 'flex-end',
  },

  theirMessageContainer: {
    alignSelf: 'flex-start',
    alignItems: 'flex-start',
  },

  senderName: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
    marginBottom: 4,
    marginLeft: 12,
  },

  messageBubble: {
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 10,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.08,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
      web: {
        boxShadow: '0px 1px 4px rgba(0, 0, 0, 0.08)',
      }
    }),
  },

  myMessage: {
    backgroundColor: '#6366F1',
    borderBottomRightRadius: 4,
  },

  theirMessage: {
    backgroundColor: '#FFFFFF',
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },

  messageText: {
    fontSize: 15,
    lineHeight: 20,
    letterSpacing: 0.1,
  },

  myMessageText: {
    color: '#FFFFFF',
  },

  theirMessageText: {
    color: '#1E293B',
  },

  messageTime: {
    fontSize: 11,
    fontWeight: '500',
    marginTop: 4,
  },

  myMessageTime: {
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'right',
  },

  theirMessageTime: {
    color: '#94A3B8',
    textAlign: 'left',
  },

  messageImage: {
    width: 200,
    height: 200,
    borderRadius: 12,
    marginBottom: 8,
  },

  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
    paddingHorizontal: 40,
  },

  emptyText: {
    fontSize: 15,
    fontWeight: '500',
    color: '#94A3B8',
    textAlign: 'center',
    lineHeight: 22,
  },

  // Input
  inputContainer: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: Platform.OS === 'ios' ? 32 : 12,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
      },
      android: {
        elevation: 8,
      },
      web: {
        boxShadow: '0px -2px 8px rgba(0, 0, 0, 0.05)',
      }
    }),
  },

  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: '#F8FAFC',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 4,
    paddingVertical: 4,
    minHeight: 48,
  },

  attachButton: {
    padding: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },

  input: {
    flex: 1,
    fontSize: 15,
    color: '#1E293B',
    paddingHorizontal: 12,
    paddingVertical: 10,
    maxHeight: 100,
    ...Platform.select({
      web: {
        outlineStyle: 'none' as any,
      }
    }),
  },

  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#6366F1',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 4,
    ...Platform.select({
      ios: {
        shadowColor: '#6366F1',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 6,
      },
      android: {
        elevation: 4,
      },
      web: {
        boxShadow: '0px 2px 8px rgba(99, 102, 241, 0.3)',
        cursor: 'pointer' as any,
      }
    }),
  },

  sendButtonDisabled: {
    backgroundColor: '#CBD5E1',
    opacity: 0.5,
    ...Platform.select({
      ios: {
        shadowOpacity: 0.1,
      },
      android: {
        elevation: 1,
      },
      web: {
        boxShadow: '0px 1px 4px rgba(0, 0, 0, 0.1)',
        cursor: 'not-allowed' as any,
      }
    }),
  },
});