import { routineService } from '@/services/routine.service';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import React, { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  Platform,
  ScrollView,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import Animated, { FadeInUp, FadeIn, FadeOut } from 'react-native-reanimated';

import { Colors, getBackgroundGradient } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { FrequencyType } from '../../types/routine';
import { getRoutineFormStyles } from '../routine-form-styles';

type Props = {
  visible: boolean;
  routineListId: number | null;
  categoryId?: number | null;
  onClose: () => void;
  onCreated?: () => void;
};

type FormErrors = {
  routineName?: string;
  frequency?: string;
  timeRange?: string;
};


export function CreateRoutineInListModal({
  visible,
  routineListId,
  categoryId,
  onClose,
  onCreated,
}: Props): React.ReactElement {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const theme = useColorScheme() ?? 'light';
  const colors = Colors[theme];
  const styles = useMemo(() => getRoutineFormStyles(theme), [theme]);
  const screenColors = theme === 'dark' ? (['#1E1B4B', '#0F172A'] as const) : getBackgroundGradient(theme);

  const createUtcTime = (h: number, m: number) => {
    const d = new Date();
    return new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate(), h, m, 0));
  };

  const [routineName, setRoutineName] = useState('');
  const [errors, setErrors] = useState<FormErrors>({});
  const [routineNameFocused, setRoutineNameFocused] = useState(false);
  const [startTime, setStartTime] = useState(createUtcTime(9, 0));
  const [endTime, setEndTime] = useState(createUtcTime(10, 0));

  const [startDate] = useState(new Date());
  const [frequency, setFrequency] = useState<FrequencyType>('DAILY');

  const [hasSpecificTime, setHasSpecificTime] = useState(false);

  const [showStartTimePicker, setShowStartTimePicker] = useState(false);
  const [showEndTimePicker, setShowEndTimePicker] = useState(false);


  const formatTime = (d: Date) =>
    `${d.getUTCHours().toString().padStart(2, '0')}:${d.getUTCMinutes().toString().padStart(2, '0')}`;
  const formatTimeForAPI = (d: Date) => `${formatTime(d)}:00`;
  const formatDateForAPI = (d: Date) => d.toISOString().split('T')[0];


  const validate = () => {
    if (!routineListId) {
      Alert.alert('Warning', 'Routine list id missing.');
      return false;
    }

    const nextErrors: FormErrors = {};
    if (!routineName.trim()) nextErrors.routineName = 'Please enter a routine name.';
    if (!frequency) nextErrors.frequency = 'Please select a frequency.';
    if (frequency === 'DAILY' && hasSpecificTime && startTime >= endTime) {
      nextErrors.timeRange = 'Routine end time must be after start time.';
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleCreate = async () => {
    // clicked
    if (!validate()) return;
    setIsSubmitting(true);
    try {
      let finalStartTime = '00:00:00';
      let finalEndTime = '23:59:00';

      if (frequency === 'DAILY' && hasSpecificTime) {
        finalStartTime = formatTimeForAPI(startTime);
        finalEndTime = formatTimeForAPI(endTime);
      }

      const body = {
        routineListId: Number(routineListId),
        routineName: routineName.trim(),
        frequencyType: frequency.charAt(0).toUpperCase() + frequency.slice(1).toLowerCase(),
        startTime: finalStartTime,
        endTime: finalEndTime,
        startDate: formatDateForAPI(startDate),
        isAiVerified: false,
        categoryId: categoryId ? Number(categoryId) : undefined,
      };

      await routineService.createRoutine(body);

      onCreated?.();
      onClose();
      setRoutineName('');
    } catch (e: unknown) {
      let msg = 'Failed to create routine';
      if (typeof e === 'object' && e !== null && 'response' in e) {
        const errorWithResponse = e as { response?: { data?: { message?: string } } };
        msg = errorWithResponse.response?.data?.message || msg;
      } else if (e instanceof Error) {
        msg = e.message;
      }
      console.error('CreateRoutineInList failed:', msg);
      Alert.alert('Error', msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
      <Animated.View entering={FadeIn.duration(300)} exiting={FadeOut.duration(300)} style={[styles.screen, { backgroundColor: 'rgba(0, 0, 0, 0.6)' }]}>
        <TouchableOpacity style={{ position: 'absolute', top: 0, bottom: 0, left: 0, right: 0 }} activeOpacity={1} onPress={onClose} />
        <Animated.View entering={FadeInUp.duration(350)} style={styles.outerWrapper} pointerEvents="box-none">
          <View style={styles.sheet}>
            <ScrollView
              contentContainerStyle={styles.content}
              keyboardShouldPersistTaps="handled"
              keyboardDismissMode="on-drag"
              nestedScrollEnabled
            >
              <View style={styles.headerRow}>
                <Text style={styles.title}>Create Routine</Text>
                <TouchableOpacity onPress={onClose}>
                  <Ionicons name="close" size={30} color={colors.text} />
                </TouchableOpacity>
              </View>

              <View style={[styles.detailLabelRow, { marginTop: 10 }]}>
                <View style={[styles.iconBox, { backgroundColor: '#8B5CF620' }]}>
                  <Ionicons name="text-outline" size={16} color="#8B5CF6" />
                </View>
                <Text style={styles.sectionLabel}>Routine Name</Text>
              </View>
              <View
                style={[
                styles.inputContainer,
                  {
                    borderColor: errors.routineName
                      ? colors.error
                      : routineNameFocused
                        ? colors.primary
                        : colors.border,
                  },
                ]}
              >
                <TextInput
                  value={routineName}
                  onChangeText={(value) => {
                    setRoutineName(value);
                    setErrors((prev) => ({ ...prev, routineName: undefined }));
                  }}
                  placeholder="Enter your routine name"
                  placeholderTextColor={colors.icon}
                  style={[styles.textInput]}
                  onFocus={() => setRoutineNameFocused(true)}
                  onBlur={() => setRoutineNameFocused(false)}
                />
              </View>
              {errors.routineName ? (
                <Text style={styles.errorText}>{errors.routineName}</Text>
              ) : null}

              {/* Frequency */}
              <View style={styles.detailLabelRow}>
                <View style={[styles.iconBox, { backgroundColor: '#F59E0B20' }]}>
                  <Ionicons name="repeat" size={16} color="#F59E0B" />
                </View>
                <Text style={styles.sectionLabel}>Frequency</Text>
              </View>
              <View style={{ flexDirection: 'row', gap: 12, marginTop: 10, marginBottom: 15 }}>
                <TouchableOpacity
                  style={[
                    {
                      flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, height: 50, borderRadius: 16,
                      borderWidth: 2, borderColor: frequency === 'DAILY' ? '#F59E0B' : 'transparent',
                      backgroundColor: theme === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)',
                    },
                    frequency === 'DAILY' && { backgroundColor: '#F59E0B20' }
                  ]}
                  onPress={() => { setFrequency('DAILY'); setErrors((prev) => ({...prev, frequency: undefined, timeRange: undefined })); }}
                >
                  <Ionicons name="sunny" size={20} color={frequency === 'DAILY' ? '#F59E0B' : colors.text} />
                  <Text style={{ fontSize: 16, fontWeight: '600', color: frequency === 'DAILY' ? '#F59E0B' : colors.text }}>Daily</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    {
                      flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, height: 50, borderRadius: 16,
                      borderWidth: 2, borderColor: frequency === 'WEEKLY' ? '#3B82F6' : 'transparent',
                      backgroundColor: theme === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)',
                    },
                    frequency === 'WEEKLY' && { backgroundColor: '#3B82F620' }
                  ]}
                  onPress={() => { setFrequency('WEEKLY'); setErrors((prev) => ({...prev, frequency: undefined, timeRange: undefined })); }}
                >
                  <Ionicons name="calendar-outline" size={20} color={frequency === 'WEEKLY' ? '#3B82F6' : colors.text} />
                  <Text style={{ fontSize: 16, fontWeight: '600', color: frequency === 'WEEKLY' ? '#3B82F6' : colors.text }}>Weekly</Text>
                </TouchableOpacity>
              </View>
              {errors.frequency ? (
                <Text style={styles.errorText}>{errors.frequency}</Text>
              ) : null}

              {/* Time Selection Toggle (Only for DAILY) */}
              {frequency === 'DAILY' && (
                <View style={styles.rowSpace}>
                  <View style={[styles.detailLabelRow, { marginTop: 0 }]}>
                    <View style={[styles.iconBox, { backgroundColor: '#10B98120' }]}>
                      <Ionicons name="time-outline" size={16} color="#10B981" />
                    </View>
                    <Text style={styles.sectionLabel}>Set specific time</Text>
                  </View>
                  <Switch
                    value={hasSpecificTime}
                    onValueChange={setHasSpecificTime}
                    trackColor={{ false: theme === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)', true: colors.primary }}
                    thumbColor={hasSpecificTime ? colors.white : '#f4f3f4'}
                  />
                </View>
              )}



              {/* Times (Only show if DAILY + hasSpecificTime) */}
              {frequency === 'DAILY' && hasSpecificTime && (
                <View style={[styles.rowSpace, { marginTop: 15 }]}>
                  <View style={{ flex: 1, marginRight: 10 }}>
                    <Text style={styles.smallLabel}>Routine Start Time</Text>
                    <TouchableOpacity
                      style={[styles.timeBox]}
                      onPress={() => setShowStartTimePicker(true)}
                    >
                      <Text style={[styles.timeText]}>{formatTime(startTime)}</Text>
                    </TouchableOpacity>

                    {showStartTimePicker &&
                      (Platform.OS === 'ios' ? (
                        <Modal visible={showStartTimePicker} transparent animationType="fade">
                          <View style={styles.modalOverlay}>
                            <View style={styles.iosPickerContainer}>
                              <View style={styles.pickerHeader}>
                                <TouchableOpacity onPress={() => setShowStartTimePicker(false)}>
                                  <Text style={styles.doneButton}>Done</Text>
                                </TouchableOpacity>
                              </View>
                              <DateTimePicker
                                value={startTime}
                                mode="time"
                                is24Hour
                                display="spinner"
                                timeZoneName="UTC"
                                onChange={(e, d) => {
                                  if (d) {
                                    setStartTime(d);
                                    setErrors((prev) => ({ ...prev, timeRange: undefined }));
                                  }
                                }}
                                textColor={colors.text}
                              />
                            </View>
                          </View>
                        </Modal>
                      ) : (
                        <DateTimePicker
                          value={startTime}
                          mode="time"
                          is24Hour
                          display="default"
                          timeZoneOffsetInMinutes={0}
                          onChange={(e, d) => {
                            setShowStartTimePicker(false);
                            if (d) {
                              setStartTime(d);
                              setErrors((prev) => ({ ...prev, timeRange: undefined }));
                            }
                          }}
                        />
                      ))}
                  </View>

                  <View style={{ flex: 1 }}>
                    <Text style={styles.smallLabel}>Routine End Time</Text>
                    <TouchableOpacity
                      style={[styles.timeBox]}
                      onPress={() => setShowEndTimePicker(true)}
                    >
                      <Text style={[styles.timeText]}>{formatTime(endTime)}</Text>
                    </TouchableOpacity>

                    {showEndTimePicker &&
                      (Platform.OS === 'ios' ? (
                        <Modal visible={showEndTimePicker} transparent animationType="fade">
                          <View style={styles.modalOverlay}>
                            <View style={styles.iosPickerContainer}>
                              <View style={styles.pickerHeader}>
                                <TouchableOpacity onPress={() => setShowEndTimePicker(false)}>
                                  <Text style={styles.doneButton}>Done</Text>
                                </TouchableOpacity>
                              </View>
                              <DateTimePicker
                                value={endTime}
                                mode="time"
                                is24Hour
                                display="spinner"
                                timeZoneName="UTC"
                                onChange={(e, d) => {
                                  if (d) {
                                    setEndTime(d);
                                    setErrors((prev) => ({ ...prev, timeRange: undefined }));
                                  }
                                }}
                                textColor={colors.text}
                              />
                            </View>
                          </View>
                        </Modal>
                      ) : (
                        <DateTimePicker
                          value={endTime}
                          mode="time"
                          is24Hour
                          display="default"
                          timeZoneOffsetInMinutes={0}
                          onChange={(e, d) => {
                            setShowEndTimePicker(false);
                            if (d) {
                              setEndTime(d);
                              setErrors((prev) => ({ ...prev, timeRange: undefined }));
                            }
                          }}
                        />
                      ))}
                  </View>
                </View>
              )}
              {errors.timeRange ? (
                <Text style={styles.errorText}>{errors.timeRange}</Text>
              ) : null}

              <TouchableOpacity
                style={styles.createBtn}
                onPress={handleCreate}
                disabled={isSubmitting || !routineListId}
              >
                {isSubmitting ? (
                  <ActivityIndicator color={colors.white} />
                ) : (
                  <Text style={{ color: colors.white, fontWeight: '600', fontSize: 17, letterSpacing: 0.5 }}>
                    Create New Routine
                  </Text>
                )}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}
