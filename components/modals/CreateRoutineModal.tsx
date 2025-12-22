import { categoryService } from '@/services/category.service';
import { routineService } from '@/services/routine.service';
import { Category } from '@/types/category';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import axios from 'axios';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import DropDownPicker from 'react-native-dropdown-picker';
import { BACKGROUND_GRADIENT } from '../../app/theme';
import { FrequencyType } from '../../types/routine';
import { routineFormStyles } from '.././routine-form-styles';

interface CreateRoutineModalProps {
  onClose?: () => void;
}

export default function CreateRoutineModal({ onClose }: CreateRoutineModalProps) {
  const router = useRouter();

  // --- Dropdown States ---
  const [categories, setCategories] = useState<Category[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Dropdown Open States
  const [catOpen, setCatOpen] = useState(false);
  const [freqOpen, setFreqOpen] = useState(false);
  const [repeatOpen, setRepeatOpen] = useState(false);

  // Dropdown açıldığında diğerlerini kapatma fonksiyonu
  const onCatOpen = useCallback(() => {
    setFreqOpen(false);
    setRepeatOpen(false);
  }, []);
  const onFreqOpen = useCallback(() => {
    setCatOpen(false);
    setRepeatOpen(false);
  }, []);
  const onRepeatOpen = useCallback(() => {
    setCatOpen(false);
    setFreqOpen(false);
  }, []);

  // --- Form States ---
  const [category, setCategory] = useState<number | null>(null);
  const [routineName, setRoutineName] = useState(''); // routine list + routine title
  const [startTime, setStartTime] = useState(new Date(new Date().setHours(9, 0, 0)));
  const [endTime, setEndTime] = useState(new Date(new Date().setHours(10, 0, 0)));
  const [startDate, setStartDate] = useState(new Date());
  const [frequency, setFrequency] = useState<FrequencyType>('DAILY');
  const [repeatAt, setRepeatAt] = useState<string>('Morning');

  const [showStartTimePicker, setShowStartTimePicker] = useState(false);
  const [showEndTimePicker, setShowEndTimePicker] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);

  // Yeni kategori oluşturma UI
  const [showNewCategoryInput, setShowNewCategoryInput] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');

  // --- API: Kategorileri Çekme ---
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const data = await categoryService.getCategories();
        setCategories(data);
      } catch (e) {
        console.error('Categories fetch failed', e);
      } finally {
        setLoadingCategories(false);
      }
    };
    fetchCategories();
  }, []);

  const categoryItems = useMemo(
    () => categories.map((c) => ({ label: c.name, value: c.categoryId })),
    [categories],
  );

  const frequencyItems = [
    { label: 'Daily', value: 'DAILY' as FrequencyType },
    { label: 'Weekly', value: 'WEEKLY' as FrequencyType },
  ];

  const repeatItems = [
    { label: 'Morning', value: 'Morning' },
    { label: 'Afternoon', value: 'Afternoon' },
    { label: 'Evening', value: 'Evening' },
  ];

  // Helper formatters
  const formatTime = (d: Date) =>
    `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
  const formatTimeForAPI = (d: Date) => `${formatTime(d)}:00`;
  const formatDate = (d: Date) =>
    `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1)
      .toString()
      .padStart(2, '0')}/${d.getFullYear()}`;
  const formatDateForAPI = (d: Date) => d.toISOString().split('T')[0];

  // Time / Date change handlers
  const handleStartTimeChange = (event: any, selectedDate?: Date) => {
    if (Platform.OS === 'android') setShowStartTimePicker(false);
    if (selectedDate) setStartTime(selectedDate);
  };

  const handleEndTimeChange = (event: any, selectedDate?: Date) => {
    if (Platform.OS === 'android') setShowEndTimePicker(false);
    if (selectedDate) setEndTime(selectedDate);
  };

  const handleDateChange = (event: any, selectedDate?: Date) => {
    if (Platform.OS === 'android') setShowDatePicker(false);
    if (selectedDate) setStartDate(selectedDate);
  };

  // Yeni kategori oluşturma
  const handleCreateCategory = async () => {
    if (!newCategoryName.trim()) {
      Alert.alert('Warning', 'Please enter a category name.');
      return;
    }

    try {
      // categoryService.createCategory fonksiyonunu backend’ine göre implemente etmen gerekiyor.
      const created = await categoryService.createCategory(newCategoryName.trim());
      setCategories((prev) => [...prev, created]);
      setCategory(created.categoryId);
      setNewCategoryName('');
      setShowNewCategoryInput(false);
    } catch (e: any) {
      console.error('Create category failed', e.response?.data || e);
      Alert.alert('Error', e.response?.data?.message || 'Failed to create category');
    }
  };

  // Form validasyonu
  const validateForm = () => {
    const errors: string[] = [];

    if (!category) errors.push('Please select a category.');
    if (!routineName.trim()) errors.push('Please enter a routine name.');
    if (!startDate) errors.push('Please select a start date.');

    if (startTime >= endTime) {
      errors.push('Routine end time must be after start time.');
    }

    if (!frequency) errors.push('Please select a frequency.');

    if (frequency === 'WEEKLY' && !repeatAt) {
      errors.push('Please select repeat time for weekly frequency.');
    }

    if (errors.length) {
      Alert.alert('Warning', errors.join('\n'));
      return false;
    }

    return true;
  };

  const handleCreate = async () => {
    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      // 1) ÖNCE routine list oluştur (DTO: CreateRoutineListDto)
      const routineList = await routineService.createRoutineList(
        Number(category), // categoryId (dropdown'dan gelen)
        routineName.trim(), // title
      );

      // 2) WEEKLY ise frequencyDetail hesapla (backend: number | undefined)
      const frequencyDetail =
        frequency === 'DAILY'
          ? undefined
          : repeatAt === 'Morning'
            ? 1
            : repeatAt === 'Afternoon'
              ? 2
              : 3;

      // 3) BACKEND DTO: CreateRoutineDto ile birebir aynı body
      const body = {
        routineListId: Number(routineList.id), // int
        routineName: routineName.trim(), // string
        frequencyType: frequency, // 'DAILY' | 'WEEKLY'
        ...(frequencyDetail !== undefined && { frequencyDetail }),
        startTime: formatTimeForAPI(startTime), // "HH:mm:00"
        endTime: formatTimeForAPI(endTime), // "HH:mm:00"
        isAiVerified: false, // şimdilik sabit false
        startDate: formatDateForAPI(startDate), // "YYYY-MM-DD"
      };

      console.log('CreateRoutine body:', JSON.stringify(body, null, 2));

      const res = await routineService.createRoutine(body);
      console.log('CreateRoutine response:', res);

      Alert.alert('Success', 'Routine created successfully!', [
        { text: 'OK', onPress: handleClose },
      ]);
    } catch (err: any) {
      if (axios.isAxiosError(err)) {
        console.log('Create routine failed STATUS:', err.response?.status);
        console.log('Create routine failed DATA:', JSON.stringify(err.response?.data, null, 2));
        const msg = err.response?.data?.message;
        Alert.alert(
          'Error',
          Array.isArray(msg) ? msg.join('\n') : (msg ?? 'Failed to create routine'),
        );
      } else {
        console.log('Create routine failed UNKNOWN:', err);
        Alert.alert('Error', 'Unexpected error while creating routine');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => (onClose ? onClose() : router.back());

  // Dropdown ortak stil
  const dropDownStyle = {
    backgroundColor: '#2196F3',
    borderColor: 'transparent',
    borderRadius: 8,
    minHeight: 50,
  };

  return (
    <LinearGradient colors={BACKGROUND_GRADIENT as any} style={routineFormStyles.screen}>
      <View style={routineFormStyles.outerWrapper}>
        <View style={routineFormStyles.sheet}>
          <ScrollView
            contentContainerStyle={[routineFormStyles.content, { paddingBottom: 60 }]}
            nestedScrollEnabled
            keyboardShouldPersistTaps="handled"
          >
            <View style={routineFormStyles.headerRow}>
              <Text style={routineFormStyles.title}>Create Routine</Text>
              <TouchableOpacity onPress={handleClose}>
                <Ionicons name="close" size={30} color="#111827" />
              </TouchableOpacity>
            </View>

            {/* Category */}
            <Text style={routineFormStyles.sectionLabel}>Category</Text>
            <View style={[routineFormStyles.row, { zIndex: 3000, alignItems: 'center' }]}>
              <View style={{ flex: 1, marginRight: 10 }}>
                <DropDownPicker
                  open={catOpen}
                  value={category}
                  items={categoryItems}
                  setOpen={setCatOpen}
                  setValue={setCategory}
                  onOpen={onCatOpen}
                  loading={loadingCategories}
                  placeholder="Select Category"
                  style={dropDownStyle}
                  textStyle={{ color: '#fff', fontSize: 16 }}
                  dropDownContainerStyle={{
                    backgroundColor: '#2196F3',
                    borderColor: '#1E88E5',
                  }}
                  placeholderStyle={{ color: '#ffffffcc' }}
                  listMode="SCROLLVIEW"
                />
              </View>

              {/* Create Category Button */}
              <TouchableOpacity
                style={[routineFormStyles.addIconBtn, { width: 44, height: 44, borderRadius: 22 }]}
                onPress={() => setShowNewCategoryInput((prev) => !prev)}
              >
                <Ionicons name="add" size={24} color="#ffffff" />
              </TouchableOpacity>
            </View>

            {/* New Category Input */}
            {showNewCategoryInput && (
              <View style={{ marginTop: 10 }}>
                <View
                  style={[
                    routineFormStyles.inputContainer,
                    { backgroundColor: '#2196F3', flexDirection: 'row', alignItems: 'center' },
                  ]}
                >
                  <TextInput
                    value={newCategoryName}
                    onChangeText={setNewCategoryName}
                    placeholder="New category name"
                    placeholderTextColor="#ffffffcc"
                    style={[routineFormStyles.textInput, { color: '#fff', flex: 1 }]}
                  />
                  <TouchableOpacity onPress={handleCreateCategory} style={{ paddingHorizontal: 8 }}>
                    <Text style={{ color: '#fff', fontWeight: '600' }}>Save</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {/* Routine Name (Routine List Name) */}
            <Text style={[routineFormStyles.sectionLabel, { marginTop: 20 }]}>Routine Name</Text>
            <View style={[routineFormStyles.inputContainer, { backgroundColor: '#2196F3' }]}>
              <TextInput
                value={routineName}
                onChangeText={setRoutineName}
                placeholder="Enter your routine name"
                placeholderTextColor="#ffffffcc"
                style={[routineFormStyles.textInput, { color: '#fff' }]}
              />
            </View>

            {/* Times */}
            <View style={[routineFormStyles.rowSpace, { marginTop: 25 }]}>
              {/* START TIME */}
              <View style={{ flex: 1, marginRight: 10 }}>
                <Text style={routineFormStyles.smallLabel}>Routine Start Time</Text>
                <TouchableOpacity
                  style={[routineFormStyles.timeBox, { backgroundColor: '#2196F3' }]}
                  onPress={() => setShowStartTimePicker(true)}
                >
                  <Text style={[routineFormStyles.timeText, { color: '#fff' }]}>
                    {formatTime(startTime)}
                  </Text>
                </TouchableOpacity>

                {showStartTimePicker && (
                  <DateTimePicker
                    value={startTime}
                    mode="time"
                    is24Hour
                    display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                    onChange={handleStartTimeChange}
                  />
                )}
              </View>

              {/* END TIME */}
              <View style={{ flex: 1 }}>
                <Text style={routineFormStyles.smallLabel}>Routine End Time</Text>
                <TouchableOpacity
                  style={[routineFormStyles.timeBox, { backgroundColor: '#2196F3' }]}
                  onPress={() => setShowEndTimePicker(true)}
                >
                  <Text style={[routineFormStyles.timeText, { color: '#fff' }]}>
                    {formatTime(endTime)}
                  </Text>
                </TouchableOpacity>

                {showEndTimePicker && (
                  <DateTimePicker
                    value={endTime}
                    mode="time"
                    is24Hour
                    display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                    onChange={handleEndTimeChange}
                  />
                )}
              </View>
            </View>

            {/* Start Date */}
            <Text style={[routineFormStyles.sectionLabel, { marginTop: 20 }]}>Start Date</Text>
            <View>
              <TouchableOpacity
                style={[
                  routineFormStyles.dateInputContainer,
                  {
                    backgroundColor: '#2196F3',
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    paddingHorizontal: 15,
                  },
                ]}
                onPress={() => setShowDatePicker(true)}
              >
                <Text style={{ color: '#fff', fontSize: 16 }}>{formatDate(startDate)}</Text>
                <MaterialIcons name="calendar-today" size={22} color="#ffffff" />
              </TouchableOpacity>

              {showDatePicker && (
                <DateTimePicker
                  value={startDate}
                  mode="date"
                  display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                  onChange={handleDateChange}
                />
              )}
            </View>

            {/* Frequency Dropdown */}
            <Text style={[routineFormStyles.sectionLabel, { marginTop: 20 }]}>Frequency</Text>
            <View style={{ zIndex: 2000 }}>
              <DropDownPicker
                open={freqOpen}
                value={frequency}
                items={frequencyItems}
                setOpen={setFreqOpen}
                setValue={setFrequency}
                onOpen={onFreqOpen}
                placeholder="Select Frequency"
                style={dropDownStyle}
                textStyle={{ color: '#fff', fontSize: 16 }}
                dropDownContainerStyle={{
                  backgroundColor: '#2196F3',
                  borderColor: '#1E88E5',
                }}
                placeholderStyle={{ color: '#ffffffcc' }}
                listMode="SCROLLVIEW"
              />
            </View>

            {/* Repeat At Dropdown – sadece WEEKLY için */}
            {frequency === 'WEEKLY' && (
              <>
                <Text style={[routineFormStyles.sectionLabel, { marginTop: 20 }]}>Repeat at</Text>
                <View style={{ zIndex: 1000 }}>
                  <DropDownPicker
                    open={repeatOpen}
                    value={repeatAt}
                    items={repeatItems}
                    setOpen={setRepeatOpen}
                    setValue={setRepeatAt}
                    onOpen={onRepeatOpen}
                    placeholder="Select Repeat Time"
                    style={dropDownStyle}
                    textStyle={{ color: '#fff', fontSize: 16 }}
                    dropDownContainerStyle={{
                      backgroundColor: '#2196F3',
                      borderColor: '#1E88E5',
                    }}
                    placeholderStyle={{ color: '#ffffffcc' }}
                    listMode="SCROLLVIEW"
                  />
                </View>
              </>
            )}

            {/* Create Button */}
            <TouchableOpacity
              style={[routineFormStyles.createBtn, { marginTop: 40, backgroundColor: '#111827' }]}
              onPress={handleCreate}
              disabled={isSubmitting}
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
  );
}
