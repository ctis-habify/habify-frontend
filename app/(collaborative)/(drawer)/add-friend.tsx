import { Colors } from '@/constants/theme';
import { friendService, UserSearchResult } from '@/services/friend.service';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as React from 'react';
import { useCallback, useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Image,
    KeyboardAvoidingView,
    Platform,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';

const COLLABORATIVE_PRIMARY = '#E879F9';
const SEARCH_DEBOUNCE_MS = 400;

export default function AddFriendScreen(): React.ReactElement {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<UserSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [sendingId, setSendingId] = useState<string | null>(null);

  const search = useCallback(async () => {
    const q = query.trim();
    if (!q) {
      setResults([]);
      return;
    }
    setLoading(true);
    try {
      const data = await friendService.searchUsers(q);
      setResults(data);
    } catch (e: unknown) {
      const msg =
        e && typeof e === 'object' && 'message' in e
          ? String((e as { message?: string }).message)
          : 'Search failed';
      Alert.alert('Error', msg);
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, [query]);

  // Yazarken otomatik arama
  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }
    const t = setTimeout(() => search(), SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(t);
  }, [query, search]);

  const sendRequest = useCallback(async (user: UserSearchResult) => {
    setSendingId(user.id);
    try {
      await friendService.sendFriendRequest(user.id);
      setResults((prev) => prev.filter((r) => r.id !== user.id));
      Alert.alert('Sent', `Friend request sent to ${user.name}`);
    } catch (e: unknown) {
      const res = e && typeof e === 'object' && 'response' in e ? (e as { response?: { data?: { message?: string } } }).response : undefined;
      const msg = res?.data?.message ?? 'Failed to send request';
      Alert.alert('Error', msg);
    } finally {
      setSendingId(null);
    }
  }, []);

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} hitSlop={12}>
          <Ionicons name="arrow-back" size={24} color={Colors.light.text} />
        </TouchableOpacity>
        <Text style={styles.title}>Add Friend</Text>
      </View>

      <View style={styles.searchRow}>
        <View style={styles.inputWrap}>
          <Ionicons name="search" size={20} color={Colors.light.icon} style={styles.searchIcon} />
          <TextInput
            style={styles.input}
            placeholder="Search by ID, username or name..."
            placeholderTextColor={Colors.light.icon}
            value={query}
            onChangeText={setQuery}
            onSubmitEditing={search}
            returnKeyType="search"
            autoCapitalize="none"
            autoCorrect={false}
          />
          {query.length > 0 && (
            <TouchableOpacity
              onPress={() => {
                setQuery('');
                setResults([]);
              }}
              style={styles.clearBtn}
            >
              <Ionicons name="close-circle" size={20} color={Colors.light.icon} />
            </TouchableOpacity>
          )}
        </View>
        <TouchableOpacity
          style={[styles.searchBtn, (!query.trim() || loading) && styles.searchBtnDisabled]}
          onPress={search}
          disabled={!query.trim() || loading}
        >
          {loading ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.searchBtnText}>Search</Text>
          )}
        </TouchableOpacity>
      </View>

      <View style={styles.results}>
        {results.length === 0 && !loading && query.trim() && (
          <Text style={styles.emptyText}>No users found. Try ID, username or name.</Text>
        )}
        {results.length === 0 && !loading && !query.trim() && (
          <Text style={styles.hintText}>Enter a user ID, username or name to search.</Text>
        )}
        {results.map((user) => (
          <View key={user.id} style={styles.row}>
            <View style={styles.avatarWrap}>
              {user.avatarUrl ? (
                <Image source={{ uri: user.avatarUrl }} style={styles.avatar} />
              ) : (
                <View style={styles.avatarPlaceholder}>
                  <Text style={styles.avatarLetter}>{user.name.charAt(0).toUpperCase()}</Text>
                </View>
              )}
            </View>
            <View style={styles.info}>
              <Text style={styles.name} numberOfLines={1}>
                {user.name}
              </Text>
              {(user.username || user.id) && (
                <Text style={styles.meta} numberOfLines={1}>
                  @{user.username || user.id.slice(0, 8)}
                </Text>
              )}
              <Text style={styles.xp}>{user.totalXp} XP</Text>
            </View>
            <TouchableOpacity
              style={[styles.sendBtn, sendingId === user.id && styles.sendBtnDisabled]}
              onPress={() => sendRequest(user)}
              disabled={sendingId !== null}
            >
              {sendingId === user.id ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <>
                  <Ionicons name="person-add" size={18} color="#fff" />
                  <Text style={styles.sendBtnText}>Add</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        ))}
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    paddingTop: 56,
    backgroundColor: Colors.light.card,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
  },
  backBtn: {
    marginRight: 12,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.light.text,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 12,
  },
  inputWrap: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.light.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  searchIcon: {
    marginLeft: 12,
  },
  input: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 10,
    fontSize: 16,
    color: Colors.light.text,
  },
  clearBtn: {
    padding: 8,
    marginRight: 4,
  },
  searchBtn: {
    backgroundColor: COLLABORATIVE_PRIMARY,
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  searchBtnDisabled: {
    opacity: 0.6,
  },
  searchBtnText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 15,
  },
  results: {
    flex: 1,
    paddingHorizontal: 16,
  },
  emptyText: {
    marginTop: 24,
    textAlign: 'center',
    color: Colors.light.icon,
    fontSize: 15,
  },
  hintText: {
    marginTop: 24,
    textAlign: 'center',
    color: Colors.light.icon,
    fontSize: 15,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.light.card,
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  avatarWrap: {
    marginRight: 12,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  avatarPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLLABORATIVE_PRIMARY,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarLetter: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '700',
  },
  info: {
    flex: 1,
  },
  name: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.light.text,
  },
  meta: {
    fontSize: 13,
    color: Colors.light.icon,
    marginTop: 2,
  },
  xp: {
    fontSize: 12,
    color: Colors.light.icon,
    marginTop: 2,
  },
  sendBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: COLLABORATIVE_PRIMARY,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 10,
  },
  sendBtnDisabled: {
    opacity: 0.7,
  },
  sendBtnText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
});
