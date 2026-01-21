import { StyleSheet, Platform } from 'react-native';

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },

  // Header styles
  header: {
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingHorizontal: 20,
    paddingBottom: 20,
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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

  headerTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.5,
  },

  headerSubtitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#64748B',
    marginTop: 4,
  },

  syncButton: {
    padding: 8,
  },

  syncButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    gap: 8,
    ...Platform.select({
      ios: {
        shadowColor: '#2563EB',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
      web: {
        boxShadow: '0px 2px 8px rgba(37, 99, 235, 0.15)',
      }
    }),
  },

  syncButtonDisabled: {
    opacity: 0.6,
  },

  syncButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2563EB',
    letterSpacing: 0.2,
  },

  // Loading state
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },

  loadingText: {
    marginTop: 16,
    fontSize: 15,
    fontWeight: '500',
    color: '#64748B',
  },

  // List styles
  listContent: {
    paddingVertical: 16,
    paddingBottom: 32,
  },

  // Chat card styles
  chatCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginBottom: 12,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 12,
      },
      android: {
        elevation: 3,
      },
      web: {
        boxShadow: '0px 2px 12px rgba(0, 0, 0, 0.06)',
        cursor: 'pointer',
        transition: 'all 0.2s ease',
      }
    }),
  },

  iconContainer: {
    width: 52,
    height: 52,
    borderRadius: 14,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
    borderWidth: 1,
    borderColor: '#DBEAFE',
  },

  chatContent: {
    flex: 1,
    justifyContent: 'center',
  },

  subjectName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
    letterSpacing: -0.2,
    marginBottom: 4,
  },

  className: {
    fontSize: 14,
    fontWeight: '500',
    color: '#64748B',
    letterSpacing: 0.1,
  },

  chevronContainer: {
    marginLeft: 12,
    opacity: 0.5,
  },

  // Empty state
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
    paddingTop: 100,
  },

  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#334155',
    marginTop: 24,
    marginBottom: 8,
    textAlign: 'center',
  },

  emptyText: {
    fontSize: 15,
    fontWeight: '500',
    color: '#94A3B8',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 32,
  },

  emptyButton: {
    backgroundColor: '#2563EB',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
    ...Platform.select({
      ios: {
        shadowColor: '#2563EB',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 10,
      },
      android: {
        elevation: 6,
      },
      web: {
        boxShadow: '0px 4px 16px rgba(37, 99, 235, 0.35)',
        cursor: 'pointer',
      }
    }),
  },

  emptyButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
    letterSpacing: 0.2,
  },

  logoutButton: {
  flexDirection: 'row',
  alignItems: 'center',
  backgroundColor: '#FFF1F2', // Fondo rosado muy suave
  paddingHorizontal: 12,
  paddingVertical: 6,
  borderRadius: 20, // Bordes redondeados tipo píldora
  borderWidth: 1,
  borderColor: '#FECACA',
},
logoutText: {
  color: '#E11D48', // Rojo elegante
  fontSize: 13,
  fontWeight: '600',
  marginLeft: 4,
},
});