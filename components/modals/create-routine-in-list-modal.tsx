import { routineService } from '@/services/routine.service';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { LinearGradient } from 'expo-linear-gradient';
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
import DropDownPicker from 'react-native-dropdown-picker';

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

const FREQUENCY_ITEMS = [
  { label: 'Daily', value: 'DAILY' as FrequencyType },
  { label: 'Weekly', value: 'WEEKLY' as FrequencyType },
];

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
  const [routineNameFocused, setRoutineNameFocused] = useState(false);
  const [startTime, setStartTime] = useState(createUtcTime(9, 0));
  const [endTime, setEndTime] = useState(createUtcTime(10, 0));

  const [startDate] = useState(new Date());
  const [frequency, setFrequency] = useState<FrequencyType>('DAILY');

  const [hasSpecificTime, setHasSpecificTime] = useState(false);

  const [showStartTimePicker, setShowStartTimePicker] = useState(false);
  const [showEndTimePicker, setShowEndTimePicker] = useState(false);

  const [freqOpen, setFreqOpen] = useState(false);

  const onFreqOpen = useCallback(() => {}, []);

  const formatTime = (d: Date) =>
    `${d.getUTCHours().toString().padStart(2, '0')}:${d.getUTCMinutes().toString().padStart(2, '0')}`;
  const formatTimeForAPI = (d: Date) => `${formatTime(d)}:00`;
  const formatDateForAPI = (d: Date) => d.toISOString().split('T')[0];

  const dropDownStyle = useMemo(
    () => ({
      backgroundColor: colors.card,
      borderColor: freqOpen ? colors.primary : 'transparent',
      borderRadius: 12,
      minHeight: 50,
    }),
    [colors, freqOpen],
  );

  const validate = () => {
    const errors: string[] = [];
    if (!routineListId) errors.push('Routine list id missing.');
    if (!routineName.trim()) errors.push('Please enter a routine name.');
    if (frequency === 'DAILY' && hasSpecificTime && startTime >= endTime)
      errors.push('Routine end time must be after start time.');
    if (!frequency) errors.push('Please select a frequency.');

    if (errors.length) {
      Alert.alert('Warning', errors.join('\n'));
      return false;
    }
    return true;
  };

  const handleCreate = async () => {
    console.log('clicked');
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
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <LinearGradient colors={screenColors} style={styles.screen}>
        <View style={styles.outerWrapper}>
          <View style={styles.sheet}>
            <ScrollView
              contentContainerStyle={[styles.content, { paddingBottom: 60 }]}
              keyboardShouldPersistTaps="handled"
              keyboardDismissMode="on-drag"
              nestedScrollEnabled
              scrollEnabled={!freqOpen}
            >
              <View style={styles.headerRow}>
                <Text style={styles.title}>Create Routine</Text>
                <TouchableOpacity onPress={onClose}>
                  <Ionicons name="close" size={30} color={colors.text} />
                </TouchableOpacity>
              </View>

              <Text style={[styles.sectionLabel, { marginTop: 20 }]}>Routine Name</Text>
              <View
                style={[
                  styles.inputContainer,
                  { borderColor: routineNameFocused ? colors.primary : 'transparent' },
                ]}
              >
                <TextInput
                  value={routineName}
                  onChangeText={setRoutineName}
                  placeholder="Enter your routine name"
                  placeholderTextColor={colors.icon}
                  style={[styles.textInput]}
                  onFocus={() => setRoutineNameFocused(true)}
                  onBlur={() => setRoutineNameFocused(false)}
                />
              </View>

              {/* Frequency */}
              <Text style={[styles.sectionLabel, { marginTop: 20 }]}>Frequency</Text>
              <View style={{ ...(Platform.OS === 'ios' && { zIndex: 2000 }) }}>
                <DropDownPicker
                  open={freqOpen}
                  value={frequency}
                  items={FREQUENCY_ITEMS}
                  setOpen={setFreqOpen}
                  setValue={setFrequency}
                  onOpen={onFreqOpen}
                  placeholder="Select Frequency"
                  style={dropDownStyle}
                  textStyle={{ color: colors.text, fontSize: 16 }}
                  dropDownContainerStyle={{
                    backgroundColor: colors.card,
                    borderColor: colors.border,
                  }}
                  placeholderStyle={{ color: colors.icon }}
                  listMode="MODAL"
                  theme={theme === 'dark' ? 'DARK' : 'LIGHT'}
                  zIndex={2000}
                  zIndexInverse={1000}
                />
              </View>

              {/* Time Selection Toggle (Only for DAILY) */}
              {frequency === 'DAILY' && (
                <View style={[styles.rowSpace, { marginTop: 20, alignItems: 'center' }]}>
                  <Text style={styles.sectionLabel}>Set specific time</Text>
                  <Switch
                    value={hasSpecificTime}
                    onValueChange={setHasSpecificTime}
                    trackColor={{ false: '#767577', true: colors.primary }}
                    thumbColor={hasSpecificTime ? '#fff' : '#f4f3f4'}
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
                                  if (d) setStartTime(d);
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
                            if (d) setStartTime(d);
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
                                  if (d) setEndTime(d);
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
                            if (d) setEndTime(d);
                          }}
                        />
                      ))}
                  </View>
                </View>
              )}

              <TouchableOpacity
                style={[styles.createBtn, { marginTop: 40 }]}
                onPress={handleCreate}
                disabled={isSubmitting || !routineListId}
              >
                {isSubmitting ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 16 }}>
                    Create New Routine
                  </Text>
                )}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </LinearGradient>
    </Modal>
  );
}
