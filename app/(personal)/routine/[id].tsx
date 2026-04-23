import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Button } from '@/components/ui/button';
import { TextInput } from '@/components/ui/text-input';
import { Toast } from '@/components/ui/toast';
import { Colors, getBackgroundGradient } from '@/constants/theme';
import { useAuth } from '@/hooks/use-auth';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Routine } from '@/types/routine';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from "@react-native-community/datetimepicker";
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  DeviceEventEmitter,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View
} from 'react-native';
import Animated, { FadeIn, FadeInDown, FadeInUp, FadeOut } from 'react-native-reanimated';
import { RoutineHistory } from '../../../components/routines/routine-history';
import { routineService } from '../../../services/routine.service';

const FREQUENCY_ITEMS = [
  { 
    label: 'Daily', 
    value: 'DAILY',
    icon: () => <Ionicons name="sunny" size={20} color="#F59E0B" /> 
  },
  { 
    label: 'Weekly', 
    value: 'WEEKLY',
    icon: () => <Ionicons name="calendar-outline" size={20} color="#3B82F6" /> 
  },
];

const parseTime = (timeStr: string) => {
  const d = new Date();
  if (!timeStr) return d;
  const [h, m] = timeStr.split(':').map(Number);
  return new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate(), h, m, 0));
};

const formatTime = (d: Date) => {
  return `${d.getUTCHours().toString().padStart(2, "0")}:${d.getUTCMinutes().toString().padStart(2, "0")}:00`;
};

export default function EditRoutineScreen(): React.ReactElement {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { token } = useAuth(); 
  const theme = useColorScheme() ?? 'light';
  const colors = Colors[theme];
  const isDark = theme === 'dark';
  const screenColors = getBackgroundGradient(theme);
  const [isLoading, setIsLoading] = useState(false);
  
  // Form State
  const [routine_name, setName] = useState('');
  const [start_time, setStartTime] = useState('');
  const [end_time, setEndTime] = useState('');
  const [routineListId, setRoutineListId] = useState(0);
  const [frequency_type, setFrequencyType] = useState('');
  const [frequency_detail, setFrequencyDetail] = useState<number>(0);
  const [isAiVerified, setIsAiVerified] = useState(false);
  const [start_date, setStartDate] = useState('2025-10-10');
  const [streak, setStreak] = useState(0);
  const [originalData, setOriginalData] = useState<Routine | null>(null);
  const [showStartTimePicker, setShowStartTimePicker] = useState(false);
  const [showEndTimePicker, setShowEndTimePicker] = useState(false);
  
  // Toast State
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage] = useState("");
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);

  // Time Helpers (Fake UTC Pattern to avoid timezone shifts)
  // Moved outside component for performance

  // ... (useEffect)
  useEffect(() => {
    if (!id || !token) return;
    const fetchData = async () => {
      try {
        const data = await routineService.getRoutineById(id, token || '');
        setOriginalData(data);
        
        setName(data?.routineName || '');
        setStartTime(data?.startTime || '');
        setEndTime(data?.endTime || '');
        setRoutineListId(data?.routineListId || 1);
        setFrequencyDetail(data?.frequencyDetail || 0);
        setFrequencyType((data?.frequencyType || 'DAILY').toUpperCase());
        setIsAiVerified(data?.isAiVerified || false);
        setStartDate(data?.startDate || '2025-01-01');
        setStreak(data?.streak || 0);
      } catch (err) {
        console.error("Failed to fetch routine:", err);
      }
    };
    fetchData();
  }, [id, token]);

  const handleSave = useCallback(async () => {
    setIsLoading(true);
    if (!token) {
      Alert.alert('Giriş Yapılmadı', 'Lütfen tekrar giriş yapın.');
      router.push('/(auth)');
      return;
    }
    
    // Construct partial payload
    const payload: Partial<Routine> = {};
    const origName = originalData?.routineName;
    const origStartTime = originalData?.startTime;
    const origEndTime = originalData?.endTime;
    const origListId = originalData?.routineListId;
    const origFreqType = originalData?.frequencyType;
    const origFreqDetail = originalData?.frequencyDetail;
    const origAi = originalData?.isAiVerified;
    const origStartDate = originalData?.startDate;

    if (start_time !== origStartTime || end_time !== origEndTime) {
        payload.startTime = start_time;
        payload.endTime = end_time;
    }
    
    if (routine_name !== origName) payload.routineName = routine_name;
    if (routineListId !== origListId) payload.routineListId = routineListId;
    if (frequency_type !== origFreqType) payload.frequencyType = frequency_type;
    if (frequency_detail !== origFreqDetail) payload.frequencyDetail = frequency_detail;
    if (isAiVerified !== origAi) payload.isAiVerified = isAiVerified;
    if (start_date !== origStartDate) payload.startDate = start_date;
    
    // Always send at least one field or handle empty? 
    // If empty, maybe just back?
    if (Object.keys(payload).length === 0) {
        router.back();
        return;
    }

    try {
      await routineService.updateRoutine(id, payload, token);
      
      // Update originalData so details card reflects changes immediately
      const updatedData = await routineService.getRoutineById(id, token || '');
      setOriginalData(updatedData);

      DeviceEventEmitter.emit('SHOW_TOAST', 'Routine updated successfully!');
      DeviceEventEmitter.emit('refreshPersonalRoutines');
      DeviceEventEmitter.emit('refreshCollaborativeRoutines');
      setIsEditModalVisible(false); // Close modal on success

    } catch (error: unknown) {
      let msg = 'Failed to update routine';
      if (error instanceof Error) msg = error.message;
      else if (typeof error === 'object' && error !== null && 'message' in error) {
        msg = String((error as { message: unknown }).message);
      }
      Alert.alert('Error', msg);
    } finally {
      setIsLoading(false);
    }
  }, [
    token, router, originalData, id, start_time, end_time, 
    routine_name, routineListId, frequency_type,
    frequency_detail, isAiVerified, start_date
  ]);

  const handleDelete = useCallback(async () => {
    if (!token) {
      Alert.alert('Not Authenticated', 'Please login again.');
      router.push('/(auth)');
      return;
    }
    Alert.alert(
      'Delete Routine',
      'Are you sure you want to delete this routine?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await routineService.deleteRoutine(id as string, token);
              DeviceEventEmitter.emit('refreshPersonalRoutines');
              router.back();
            } catch (error: unknown) {
              const msg = error instanceof Error ? error.message : "Failed to delete routine";
              Alert.alert('Error', msg);
            }
          },
        },
      ]
    );
  }, [token, router, id]);

  return (
    <LinearGradient colors={getBackgroundGradient(theme)} style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={[styles.closeBtn, { backgroundColor: Colors[theme].surface }]}>
          <Ionicons name="close" size={24} color={Colors[theme].text} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        
        {/* 1. Routine Tracker (Chain Design) */}
        <ThemedView variant="card" style={styles.trackerCard}>
          <ThemedText type="subtitle" style={styles.trackerTitle}>Current Streak</ThemedText>
          <View style={styles.chainContainer}>
             {/* Mock Chain of 7 days */}
              {Array.from({ length: 7 }).map((_, index) => {
                // Visualize streak
              // If streak is larger than 7, show all filled, or maybe we want to show the last 7 days?
              // For now, let's just show up to 7 "filled" blocks if streak >= index+1
              const filled = index < Math.min(streak, 7);
              
              return (
                <View key={index} style={styles.chainItem}>
                   {/* Link Line (except for first item) */}
                  {index > 0 && <View style={[styles.chainLink, { backgroundColor: filled ? colors.primary : colors.border }]} />}
                  
                  {/* Node */}
                  <View style={[
                    styles.chainNode,
                    { borderColor: filled ? colors.success : colors.border },
                    filled && { backgroundColor: colors.success },
                  ]}>
                    {filled ? (
                      <Ionicons name="checkmark" size={14} color={colors.white} />
                    ) : (
                      <ThemedText style={[styles.chainText, { color: colors.border }]}>{index + 1}</ThemedText>
                    )}
                  </View>
                </View>
              );
            })}
          </View>
          <ThemedText style={[styles.streakLabel, { color: colors.text }]}>You are on a {streak} day streak!</ThemedText>
        </ThemedView>

        {/* Routine History Grid */}
        <RoutineHistory routineId={id as string} themeColor={colors.primary} createdAt={originalData?.startDate} endTime={originalData?.endTime} />

        {/* 3. Fancy Routine Details Card */}
        <Animated.View 
          entering={FadeInDown.duration(800).delay(200).springify()}
          style={[
            styles.detailsCard, 
            { 
              backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(255,255,255,0.8)',
              borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
              shadowColor: colors.primary,
            }
          ]}
        >
          {/* Card Header Gradient Area */}
          <View style={styles.detailsHeader}>
            <View>
              <ThemedText type="subtitle" style={styles.detailsTitle}>Routine Details</ThemedText>
              <ThemedText style={{ fontSize: 13, opacity: 0.5 }}>Manage your habit settings</ThemedText>
            </View>
            <TouchableOpacity 
              onPress={() => setIsEditModalVisible(true)}
              activeOpacity={0.7}
              style={[
                styles.editIconBtn, 
                { 
                  backgroundColor: colors.primary + '15',
                  borderColor: colors.primary + '30',
                }
              ]}
            >
              <Ionicons name="pencil" size={18} color={colors.primary} />
            </TouchableOpacity>
          </View>

          <View style={styles.detailsList}>
            {/* Name Row */}
            <View style={[styles.detailRow, { borderBottomColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)' }]}>
              <View style={styles.detailLabelRow}>
                <View style={[styles.iconBox, { backgroundColor: '#A855F720' }]}>
                  <Ionicons name="text" size={18} color="#A855F7" />
                </View>
                <View>
                  <ThemedText style={styles.detailLabel}>Name</ThemedText>
                  <ThemedText style={styles.detailValue}>{originalData?.routineName || '-'}</ThemedText>
                </View>
              </View>
            </View>

            {/* Time Row */}
            <View style={[styles.detailRow, { borderBottomColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)' }]}>
              <View style={styles.detailLabelRow}>
                <View style={[styles.iconBox, { backgroundColor: '#3B82F620' }]}>
                  <Ionicons name="time" size={18} color="#3B82F6" />
                </View>
                <View>
                  <ThemedText style={styles.detailLabel}>Time Window</ThemedText>
                  <ThemedText style={styles.detailValue}>
                    {originalData?.startTime ? originalData.startTime.substring(0, 5) : '00:00'} — {originalData?.endTime ? originalData.endTime.substring(0, 5) : '23:59'}
                  </ThemedText>
                </View>
              </View>
            </View>

            {/* Frequency Row */}
            <View style={[styles.detailRow, { borderBottomColor: 'transparent' }]}>
              <View style={styles.detailLabelRow}>
                <View style={[styles.iconBox, { backgroundColor: '#F59E0B20' }]}>
                  <Ionicons name="repeat" size={18} color="#F59E0B" />
                </View>
                <View>
                  <ThemedText style={styles.detailLabel}>Frequency</ThemedText>
                  <ThemedText style={styles.detailValue}>{originalData?.frequencyType || 'DAILY'}</ThemedText>
                </View>
              </View>
            </View>
          </View>

          {/* Bottom Accent Line */}
          <LinearGradient
            colors={[colors.primary + '00', colors.primary + '40', colors.primary + '00']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.accentLine}
          />
        </Animated.View>

        <Modal
          visible={isEditModalVisible}
          animationType="none"
          transparent
          onRequestClose={() => setIsEditModalVisible(false)}
        >
          <Animated.View entering={FadeIn.duration(300)} exiting={FadeOut.duration(300)} style={[styles.modalOverlay, { backgroundColor: 'rgba(0,0,0,0.6)' }]}>
            <TouchableOpacity style={{ position: 'absolute', top: 0, bottom: 0, left: 0, right: 0 }} activeOpacity={1} onPress={() => setIsEditModalVisible(false)} />
            <Animated.View entering={FadeInUp.duration(350)} style={[styles.editModalContainer, { backgroundColor: colors.background }]} pointerEvents="box-none">
              <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
                <ThemedText type="subtitle">Edit Routine</ThemedText>
                <TouchableOpacity onPress={() => setIsEditModalVisible(false)} style={styles.modalCloseBtn}>
                  <Ionicons name="close" size={24} color={colors.text} />
                </TouchableOpacity>
              </View>

              <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
                {/* Time Row */}
                {frequency_type?.toUpperCase() !== 'WEEKLY' && (
                  <View style={[styles.row, { gap: 12 }]}>
                    <View style={[styles.halfInput, { flex: 1 }]}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 10, marginBottom: 8 }}>
                         <View style={{ width: 32, height: 32, borderRadius: 10, backgroundColor: '#10B98120', alignItems: 'center', justifyContent: 'center' }}>
                            <Ionicons name="time-outline" size={16} color="#10B981" />
                         </View>
                         <ThemedText style={{ fontSize: 13, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 1.5, color: isDark ? 'rgba(255,255,255,0.5)' : '#8B5CF6' }}>Start Time</ThemedText>
                      </View>
                      <TouchableOpacity
                        style={[styles.timeBox, { backgroundColor: colors.surface, borderColor: colors.border }]}
                        onPress={() => setShowStartTimePicker(true)}
                      >
                        <ThemedText>{start_time || '00:00'}</ThemedText>
                      </TouchableOpacity>
                      
                      {showStartTimePicker && (
                        Platform.OS === 'ios' ? (
                          <Modal visible={showStartTimePicker} transparent animationType="fade">
                            <View style={[styles.modalOverlay, { backgroundColor: 'rgba(0,0,0,0.5)' }]}>
                              <View style={[styles.iosPickerContainer, { backgroundColor: colors.surface }]}>
                                <View style={[styles.pickerHeader, { borderBottomColor: colors.border }]}>
                                  <TouchableOpacity onPress={() => setShowStartTimePicker(false)}>
                                    <ThemedText style={[styles.doneButton, { color: colors.primary }]}>Done</ThemedText>
                                  </TouchableOpacity>
                                </View>
                                <DateTimePicker
                                  value={parseTime(start_time)}
                                  mode="time"
                                  is24Hour
                                  display="spinner"
                                  timeZoneName="UTC"
                                  onChange={(e, d) => {
                                    if (d) setStartTime(formatTime(d));
                                  }}
                                  textColor={colors.text}
                                />
                              </View>
                            </View>
                          </Modal>
                        ) : (
                          <DateTimePicker
                            value={parseTime(start_time)}
                            mode="time"
                            is24Hour
                            display="default"
                            onChange={(e, d) => {
                              setShowStartTimePicker(false);
                              if (d) setStartTime(formatTime(d));
                            }}
                          />
                        )
                      )}
                    </View>

                    <View style={styles.halfInput}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 10, marginBottom: 8 }}>
                         <View style={{ width: 32, height: 32, borderRadius: 10, backgroundColor: '#EF444420', alignItems: 'center', justifyContent: 'center' }}>
                            <Ionicons name="time-outline" size={16} color="#EF4444" />
                         </View>
                         <ThemedText style={{ fontSize: 13, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 1.5, color: isDark ? 'rgba(255,255,255,0.5)' : '#8B5CF6' }}>End Time</ThemedText>
                      </View>
                      <TouchableOpacity
                        style={[styles.timeBox, { backgroundColor: colors.surface, borderColor: colors.border }]}
                        onPress={() => setShowEndTimePicker(true)}
                      >
                        <ThemedText>{end_time || '00:00'}</ThemedText>
                      </TouchableOpacity>

                      {showEndTimePicker && (
                        Platform.OS === 'ios' ? (
                          <Modal visible={showEndTimePicker} transparent animationType="fade">
                            <View style={[styles.modalOverlay, { backgroundColor: 'rgba(0,0,0,0.5)' }]}>
                              <View style={[styles.iosPickerContainer, { backgroundColor: colors.surface }]}>
                                <View style={[styles.pickerHeader, { borderBottomColor: colors.border }]}>
                                  <TouchableOpacity onPress={() => setShowEndTimePicker(false)}>
                                    <ThemedText style={[styles.doneButton, { color: colors.primary }]}>Done</ThemedText>
                                  </TouchableOpacity>
                                </View>
                                <DateTimePicker
                                  value={parseTime(end_time)}
                                  mode="time"
                                  is24Hour
                                  display="spinner"
                                  timeZoneName="UTC"
                                  onChange={(e, d) => {
                                    if (d) setEndTime(formatTime(d));
                                  }}
                                  textColor={colors.text}
                                />
                              </View>
                            </View>
                          </Modal>
                        ) : (
                          <DateTimePicker
                            value={parseTime(end_time)}
                            mode="time"
                            is24Hour
                            display="default"
                            onChange={(e, d) => {
                              setShowEndTimePicker(false);
                              if (d) setEndTime(formatTime(d));
                            }}
                          />
                        )
                      )}
                    </View>
                  </View>
                )}

                {/* Name */}
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 20, marginBottom: 8 }}>
                   <View style={{ width: 32, height: 32, borderRadius: 10, backgroundColor: '#8B5CF620', alignItems: 'center', justifyContent: 'center' }}>
                      <Ionicons name="text-outline" size={16} color="#8B5CF6" />
                   </View>
                   <ThemedText style={{ fontSize: 13, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 1.5, color: isDark ? 'rgba(255,255,255,0.5)' : '#8B5CF6' }}>Routine Name</ThemedText>
                </View>
                <TextInput
                  value={routine_name}
                  onChangeText={setName}
                  placeholder="Routine Name"
                />

                {/* Frequency */}
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                     <View style={{ width: 32, height: 32, borderRadius: 10, backgroundColor: '#F59E0B20', alignItems: 'center', justifyContent: 'center' }}>
                        <Ionicons name="repeat" size={16} color="#F59E0B" />
                     </View>
                     <ThemedText style={{ fontSize: 13, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 1.5, color: isDark ? 'rgba(255,255,255,0.5)' : '#8B5CF6' }}>Frequency</ThemedText>
                  </View>
                <View style={{ flexDirection: 'row', gap: 12, marginTop: 10, marginBottom: 15 }}>
                  <TouchableOpacity
                    style={[
                      {
                        flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, height: 50, borderRadius: 16,
                        borderWidth: 2, borderColor: frequency_type === 'DAILY' ? '#F59E0B' : 'transparent',
                        backgroundColor: theme === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)',
                      },
                      frequency_type === 'DAILY' && { backgroundColor: '#F59E0B20' }
                    ]}
                    onPress={() => setFrequencyType('DAILY')}
                  >
                    <Ionicons name="sunny" size={20} color={frequency_type === 'DAILY' ? '#F59E0B' : colors.text} />
                    <ThemedText style={{ fontSize: 16, fontWeight: '600', color: frequency_type === 'DAILY' ? '#F59E0B' : colors.text }}>Daily</ThemedText>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      {
                        flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, height: 50, borderRadius: 16,
                        borderWidth: 2, borderColor: frequency_type === 'WEEKLY' ? '#3B82F6' : 'transparent',
                        backgroundColor: theme === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)',
                      },
                      frequency_type === 'WEEKLY' && { backgroundColor: '#3B82F620' }
                    ]}
                    onPress={() => setFrequencyType('WEEKLY')}
                  >
                    <Ionicons name="calendar-outline" size={20} color={frequency_type === 'WEEKLY' ? '#3B82F6' : colors.text} />
                    <ThemedText style={{ fontSize: 16, fontWeight: '600', color: frequency_type === 'WEEKLY' ? '#3B82F6' : colors.text }}>Weekly</ThemedText>
                  </TouchableOpacity>
                </View>

                {/* Save Button */}
                <View style={{ marginTop: 24, marginBottom: 16 }}>
                  <Button
                    title="Save Changes"
                    onPress={handleSave}
                    isLoading={isLoading}
                    variant="primary"
                  />
                </View>

                {/* Delete Button */}
                <Button
                  title="Delete Routine"
                  onPress={handleDelete}
                  variant="destructive"
                  icon={<Ionicons name="trash-outline" size={20} color="#fff" style={{ marginRight: 8 }} />}
                  style={{ marginBottom: 40 }}
                />
              </ScrollView>
            </Animated.View>
          </Animated.View>
        </Modal>

      </ScrollView>

      <Toast 
        visible={toastVisible} 
        message={toastMessage} 
        onClose={() => setToastVisible(false)} 
      />

    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 58,
    paddingHorizontal: 16,
    paddingBottom: 15,
  },
  closeBtn: {
    padding: 8,
    borderRadius: 20,
  },
  scroll: { padding: 20, paddingBottom: 50 },
  
  // Tracker Card (Chain)
  trackerCard: {
    padding: 24,
    marginBottom: 20,
    alignItems: 'center',
  },
  trackerTitle: { marginBottom: 12 },
  chainContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 0,
    width: '100%',
  },
  chainItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  chainLink: {
    width: 15,
    height: 3,
  },
  chainNode: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },

  chainText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  streakLabel: {
    marginTop: 4,
    fontWeight: '600',
    fontSize: 13,
  },

  // History Grid
  historyGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'center',
    width: '100%',
  },
  historyCell: {
    width: Math.floor((100 - 8*6) / 7) + 5,
    minWidth: 28,
    height: 20,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  historyLegend: {
    flexDirection: 'row',
    marginTop: 15,
    gap: 12,
    justifyContent: 'center',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendColor: {
    width: 12,
    height: 12,
    borderRadius: 4,
  },
  legendText: {
    fontSize: 13,
  },

  // Details Card
  detailsCard: {
    padding: 24,
    marginTop: 5,
    borderRadius: 24,
    borderWidth: 1,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 8,
    overflow: 'hidden',
  },
  detailsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  detailsTitle: {
    marginBottom: 3,
    fontSize: 20,
  },
  editIconBtn: {
    padding: 10,
    borderRadius: 14,
    borderWidth: 1,
  },
  detailsList: {
    gap: 0,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  detailLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    flex: 1,
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailLabel: {
    fontSize: 12,
    opacity: 0.5,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 0,
  },
  detailValue: {
    fontSize: 16,
    fontWeight: '700',
  },
  accentLine: {
    height: 2,
    width: '100%',
    position: 'absolute',
    bottom: 0,
    left: 24,
  },

  // Edit Modal Styles
  editModalContainer: {
    width: '90%',
    maxWidth: 400,
    borderRadius: 36,
    paddingTop: 20,
    maxHeight: '90%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 6,
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingBottom: 20,
    borderBottomWidth: 1,
  },
  modalCloseBtn: {
    padding: 4,
  },
  modalBody: {
    padding: 24,
  },
  row: { flexDirection: 'row', gap: 15, marginBottom: 15 },
  halfInput: { flex: 1 },
  
  // Time Picker Styles
  timeBox: {
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    height: 50,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iosPickerContainer: {
    paddingBottom: 40,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  pickerHeader: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    padding: 16,
    borderBottomWidth: 1,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  doneButton: {
    fontWeight: '700',
    fontSize: 17,
  },
});
