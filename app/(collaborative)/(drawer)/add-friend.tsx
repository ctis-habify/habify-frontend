import { HomeButton } from '@/components/navigation/home-button';
import { Colors } from '@/constants/theme';
import { friendService, UserSearchResult } from '@/services/friend.service';
import { useColorScheme } from '@/hooks/use-color-scheme';
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

const SEARCH_DEBOUNCE_MS = 400;

export default function AddFriendScreen(): React.ReactElement {
  const router = useRouter();
  const theme = useColorScheme() ?? 'light';
  const colors = Colors[theme];
  const collaborativePrimary = colors.collaborativePrimary;
  const isDark = theme === 'dark';

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
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={[styles.header, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <View style={styles.headerLeft}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} hitSlop={12}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.title, { color: colors.text }]}>Add Friend</Text>
        </View>
        <HomeButton color={colors.text} />
      </View>
      </View>

      <View style={styles.searchRow}>
        <View style={[styles.inputWrap, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Ionicons name="search" size={20} color={colors.icon} style={styles.searchIcon} />
          <TextInput
            style={[styles.input, { color: colors.text }]}
            placeholder="Search by ID, username or name..."
            placeholderTextColor={colors.icon}
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
              <Ionicons name="close-circle" size={20} color={colors.icon} />
            </TouchableOpacity>
          )}
        </View>
        <TouchableOpacity
          style={[styles.searchBtn, { backgroundColor: collaborativePrimary }, (!query.trim() || loading) && styles.searchBtnDisabled]}
          onPress={search}
          disabled={!query.trim() || loading}
        >
          {loading ? (
            <ActivityIndicator size="small" color={colors.white} />
          ) : (
            <Text style={[styles.searchBtnText, { color: colors.white }]}>Search</Text>
          )}
        </TouchableOpacity>
      </View>

      <View style={styles.results}>
        {results.length === 0 && !loading && query.trim() && (
          <Text style={[styles.emptyText, { color: colors.icon }]}>No users found. Try ID, username or name.</Text>
        )}
        {results.length === 0 && !loading && !query.trim() && (
          <Text style={[styles.hintText, { color: colors.icon }]}>Enter a user ID, username or name to search.</Text>
        )}
        {results.map((user) => (
          <View key={user.id} style={[styles.row, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.avatarWrap}>
              {user.avatarUrl ? (
                <Image source={{ uri: user.avatarUrl }} style={styles.avatar} />
              ) : (
                <View style={[styles.avatarPlaceholder, { backgroundColor: collaborativePrimary }]}>
                  <Text style={[styles.avatarLetter, { color: colors.white }]}>{user.name.charAt(0).toUpperCase()}</Text>
                </View>
              )}
            </View>
            <View style={styles.info}>
              <Text style={[styles.name, { color: colors.text }]} numberOfLines={1}>
                {user.name}
              </Text>
              {(user.username || user.id) && (
                <Text style={[styles.meta, { color: colors.icon }]} numberOfLines={1}>
                  @{user.username || user.id.slice(0, 8)}
                </Text>
              )}
              <Text style={[styles.xp, { color: colors.icon }]}>{user.totalXp} XP</Text>
            </View>
            <TouchableOpacity
              style={[styles.sendBtn, { backgroundColor: collaborativePrimary }, sendingId === user.id && styles.sendBtnDisabled]}
              onPress={() => sendRequest(user)}
              disabled={sendingId !== null}
            >
              {sendingId === user.id ? (
                <ActivityIndicator size="small" color={colors.white} />
              ) : (
                <>
                  <Ionicons name="person-add" size={18} color={colors.white} />
                  <Text style={[styles.sendBtnText, { color: colors.white }]}>Add</Text>
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
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    paddingTop: 56,
    borderBottomWidth: 1,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backBtn: {
    marginRight: 12,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
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
    borderRadius: 12,
    borderWidth: 1,
  },
  searchIcon: {
    marginLeft: 12,
  },
  input: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 10,
    fontSize: 16,
  },
  clearBtn: {
    padding: 8,
    marginRight: 4,
  },
  searchBtn: {
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
    fontSize: 15,
  },
  hintText: {
    marginTop: 24,
    textAlign: 'center',
    fontSize: 15,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
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
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarLetter: {
    fontSize: 20,
    fontWeight: '700',
  },
  info: {
    flex: 1,
  },
  name: {
    fontSize: 16,
    fontWeight: '600',
  },
  meta: {
    fontSize: 13,
    marginTop: 2,
  },
  xp: {
    fontSize: 12,
    marginTop: 2,
  },
  sendBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 10,
  },
  sendBtnDisabled: {
    opacity: 0.7,
  },
  sendBtnText: {
    fontWeight: '600',
    fontSize: 14,
  },
});
