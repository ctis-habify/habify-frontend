import { BACKGROUND_GRADIENT } from '@/app/theme';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Button } from '@/components/ui/Button';
import { TextInput } from '@/components/ui/TextInput';
import { Toast } from '@/components/ui/Toast';
import { Colors } from '@/constants/theme';
import { useAuth } from '@/hooks/useAuth';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from "@react-native-community/datetimepicker";
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
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
import DropDownPicker from 'react-native-dropdown-picker'; // Added import
import { routineService } from '../../../services/routine.service';

export default function EditRoutineScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { token } = useAuth(); 
  const [isLoading, setIsLoading] = useState(false);
  
  // Form State
  const [routine_name, setName] = useState('');
  const [start_time, setStartTime] = useState('');
  const [end_time, setEndTime] = useState('');
  const [routineListId, setRoutineListId] = useState(0);
  const [frequency_type, setFrequencyType] = useState('');
  const [frequency_detail, setFrequencyDetail] = useState<number>(0);
  const [is_ai_verified, setIsAiVerified] = useState(false);
  const [start_date, setStartDate] = useState('2025-10-10');
  const [streak, setStreak] = useState(0);
  const [originalData, setOriginalData] = useState<any>(null);

  const [showStartTimePicker, setShowStartTimePicker] = useState(false);
  const [showEndTimePicker, setShowEndTimePicker] = useState(false);
  
  const [freqOpen, setFreqOpen] = useState(false); // Added freqOpen state

  // Toast State
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage] = useState("");

  // Time Helpers
  // Time Helpers (Fake UTC Pattern to avoid timezone shifts)
  const parseTime = (timeStr: string) => {
    const d = new Date();
    if (!timeStr) return d;
    const [h, m] = timeStr.split(':').map(Number);
    // Create a date where UTC time matches the desired clock time
    return new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate(), h, m, 0));
  };

  const formatTime = (d: Date) => {
    // Read UTC components to get back the stable clock time
    return `${d.getUTCHours().toString().padStart(2, "0")}:${d.getUTCMinutes().toString().padStart(2, "0")}:00`;
  }

  // ... (useEffect)
  useEffect(() => {
    if (!id || !token) return;
    const fetchData = async () => {
      try {
        const data: any = await routineService.getRoutineById(id, token || '');
        console.log("EditRoutine data:", data);
        setOriginalData(data);
        
        setName(data?.routineName || data?.routine_name || '');
        setStartTime(data?.startTime || data?.start_time || '');
        setEndTime(data?.endTime || data?.end_time || '');
        setRoutineListId(data?.routineListId || data?.routine_list_id || 1);
        setFrequencyDetail(data?.frequencyDetail || data?.frequency_detail || 0);
        setFrequencyType(data?.frequencyType || data?.frequency_type || 'DAILY');
        setIsAiVerified(data?.is_ai_verified || false);
        setStartDate(data?.startDate || data?.start_date || '2025-01-01');
        setStreak(data?.streak || 0);
      } catch (err) {
        console.error("Failed to fetch routine:", err);
      }
    };
    fetchData();
  }, [id, token]);

  const handleSave = async () => {
    setIsLoading(true);
    if (!token) {
      Alert.alert('Giriş Yapılmadı', 'Lütfen tekrar giriş yapın.');
      router.push('/(auth)');
      return;
    }
    
    // Construct partial payload
    const payload: any = {};
    const origName = originalData?.routineName || originalData?.routine_name;
    const origStartTime = originalData?.startTime || originalData?.start_time;
    const origEndTime = originalData?.endTime || originalData?.end_time;
    const origListId = originalData?.routineListId || originalData?.routine_list_id;
    const origFreqType = originalData?.frequencyType || originalData?.frequency_type;
    const origFreqDetail = originalData?.frequencyDetail || originalData?.frequency_detail;
    const origAi = originalData?.is_ai_verified;
    const origStartDate = originalData?.startDate || originalData?.start_date;

    if (start_time !== origStartTime || end_time !== origEndTime) {
        payload.startTime = start_time;
        payload.endTime = end_time;
    }
    // if (start_time !== origStartTime) payload.startTime = start_time;
    // if (end_time !== origEndTime) payload.endTime = end_time;
    
    if (routine_name !== origName) payload.routineName = routine_name;
    if (routineListId !== origListId) payload.routineListId = routineListId;
    if (frequency_type !== origFreqType) payload.frequencyType = frequency_type;
    if (frequency_detail !== origFreqDetail) payload.frequencyDetail = frequency_detail;
    if (is_ai_verified !== origAi) payload.isAiVerified = is_ai_verified;
    if (start_date !== origStartDate) payload.startDate = start_date;
    
    // Always send at least one field or handle empty? 
    // If empty, maybe just back?
    if (Object.keys(payload).length === 0) {
        router.back();
        return;
    }

    try {
      console.log('handleSave Partial Payload:', payload);
      await routineService.updateRoutine(id, payload, token);
      
      DeviceEventEmitter.emit('SHOW_TOAST', 'Routine updated successfully!');
      router.back();

    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
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
              router.back();
            } catch (error: any) {
              Alert.alert('Error', error.message);
            }
          },
        },
      ]
    );
  };

  return (
    <LinearGradient colors={BACKGROUND_GRADIENT} style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <ThemedText type="heading2" style={styles.headerTitle}>{routine_name}</ThemedText>
        <TouchableOpacity onPress={() => router.back()} style={styles.closeBtn}>
          <Ionicons name="close" size={24} color={Colors.light.icon} />
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
                  {index > 0 && <View style={[styles.chainLink, filled && styles.activeLink]} />}
                  
                  {/* Node */}
                  <View style={[
                    styles.chainNode,
                    filled && styles.completedNode,
                  ]}>
                    {filled ? (
                      <Ionicons name="checkmark" size={14} color="white" />
                    ) : (
                      <ThemedText style={styles.chainText}>{index + 1}</ThemedText>
                    )}
                  </View>
                </View>
              );
            })}
          </View>
          <ThemedText style={styles.streakLabel}>You are on a {streak} day streak!</ThemedText>
        </ThemedView>

        {/* 2. Edit Form */}
        <ThemedView variant="card" style={styles.formCard}>
          <ThemedText type="subtitle" style={styles.formTitle}>Edit Routine</ThemedText>

          {/* Time Row */}
          {frequency_type?.toUpperCase() !== 'WEEKLY' && (
            <View style={styles.row}>
              <View style={styles.halfInput}>
                <ThemedText type="defaultSemiBold" style={{ marginBottom: 6 }}>Start Time</ThemedText>
                <TouchableOpacity
                  style={styles.timeBox}
                  onPress={() => setShowStartTimePicker(true)}
                >
                  <ThemedText>{start_time || '00:00'}</ThemedText>
                </TouchableOpacity>
                
                {showStartTimePicker && (
                  Platform.OS === 'ios' ? (
                    <Modal visible={showStartTimePicker} transparent animationType="fade">
                      <View style={styles.modalOverlay}>
                        <View style={styles.iosPickerContainer}>
                          <View style={styles.pickerHeader}>
                            <TouchableOpacity onPress={() => setShowStartTimePicker(false)}>
                              <ThemedText style={styles.doneButton}>Done</ThemedText>
                            </TouchableOpacity>
                          </View>
                          <DateTimePicker
                            value={parseTime(start_time)}
                            mode="time"
                            is24Hour
                            display="spinner"
                            timeZoneName="UTC" // Force UTC display
                            onChange={(e, d) => {
                              if (d) setStartTime(formatTime(d));

                            }}
                            textColor={Colors.light.text}
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
                      timeZoneOffsetInMinutes={0} // Force UTC display
                      onChange={(e, d) => {
                        setShowStartTimePicker(false);
                        if (d) setStartTime(formatTime(d));
                      }}
                    />
                  )
                )}
              </View>

              <View style={styles.halfInput}>
                <ThemedText type="defaultSemiBold" style={{ marginBottom: 6 }}>End Time</ThemedText>
                <TouchableOpacity
                  style={styles.timeBox}
                  onPress={() => setShowEndTimePicker(true)}
                >
                  <ThemedText>{end_time || '00:00'}</ThemedText>
                </TouchableOpacity>

                {showEndTimePicker && (
                  Platform.OS === 'ios' ? (
                    <Modal visible={showEndTimePicker} transparent animationType="fade">
                      <View style={styles.modalOverlay}>
                        <View style={styles.iosPickerContainer}>
                          <View style={styles.pickerHeader}>
                            <TouchableOpacity onPress={() => setShowEndTimePicker(false)}>
                              <ThemedText style={styles.doneButton}>Done</ThemedText>
                            </TouchableOpacity>
                          </View>
                          <DateTimePicker
                            value={parseTime(end_time)}
                            mode="time"
                            is24Hour
                            display="spinner"
                            timeZoneName="UTC" // Force UTC display
                            onChange={(e, d) => {
                              if (d) setEndTime(formatTime(d));
                            }}
                            textColor={Colors.light.text}
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
                      timeZoneOffsetInMinutes={0} // Force UTC display
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
          <TextInput
            label="Name"
            value={routine_name}
            onChangeText={setName}
            placeholder="Routine Name"
          />

          {/* Frequency */}
          <View style={{ zIndex: 3000, marginTop: 20, marginBottom: 20 }}>
            <ThemedText type="defaultSemiBold" style={{ marginBottom: 6 }}>Frequency</ThemedText>
            <DropDownPicker
              open={freqOpen}
              value={frequency_type}
              items={[
                { label: 'Daily', value: 'DAILY' },
                { label: 'Weekly', value: 'WEEKLY' },
              ]}
              setOpen={setFreqOpen}
              setValue={setFrequencyType}
              placeholder="Select Frequency"
              style={{
                backgroundColor: Colors.light.background,
                borderColor: Colors.light.border,
                borderRadius: 12,
              }}
              dropDownContainerStyle={{
                backgroundColor: Colors.light.background,
                borderColor: Colors.light.border,
              }}
              listMode="SCROLLVIEW"
            />
          </View>

          {/* Save Button */}
          <View style={{ marginTop: 12, marginBottom: 8 }}>
            <Button
              title="Save Routine"
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
            style={{ marginTop: 0 }}
          />
        </ThemedView>

      </ScrollView>

      <Toast 
        visible={toastVisible} 
        message={toastMessage} 
        onHide={() => setToastVisible(false)} 
      />
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
  },
  headerTitle: { color: '#fff', flex: 1 },
  closeBtn: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  scroll: { padding: 20, paddingBottom: 50 },
  
  // Tracker Card (Chain)
  trackerCard: {
    padding: 24,
    marginBottom: 20,
    alignItems: 'center',
  },
  trackerTitle: { marginBottom: 20 },
  chainContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    width: '100%',
  },
  chainItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  chainLink: {
    width: 15,
    height: 3,
    backgroundColor: Colors.light.border,
  },
  activeLink: {
    backgroundColor: Colors.light.primary,
  },
  chainNode: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: Colors.light.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'white',
  },
  completedNode: {
    backgroundColor: Colors.light.success,
    borderColor: Colors.light.success,
  },

  chainText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: Colors.light.border,
  },
  streakLabel: {
    marginTop: 8,
    color: Colors.light.text,
    fontWeight: '600',
  },

  // Form Card
  formCard: {
    padding: 24,
  },
  formTitle: { marginBottom: 20, textAlign: 'center' },
  row: { flexDirection: 'row', gap: 15, marginBottom: 15 },
  halfInput: { flex: 1 },
  
  deleteText: {
    color: Colors.light.error, // or error color
    fontWeight: 'bold',
  },
  
  // Time Picker Styles
  timeBox: {
    backgroundColor: Colors.light.background,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.light.border,
    paddingHorizontal: 16,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    height: 50,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  iosPickerContainer: {
    backgroundColor: '#ffffff',
    paddingBottom: 40,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  pickerHeader: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
    backgroundColor: '#f8f9fa',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  doneButton: {
    color: Colors.light.primary,
    fontWeight: '600',
    fontSize: 17,
  },
});