import { categoryService } from '@/services/category.service';
import { routineService } from '@/services/routine.service';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Picker } from '@react-native-picker/picker';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import {
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
  const [categories, setCategories] = useState<{ id: number; name: string }[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [open, setOpen] = useState(false);
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const data = await categoryService.getCategories();
        setCategories(data);
      } catch {
        Alert.alert('Error', 'Categories could not be loaded');
      } finally {
        setLoadingCategories(false);
      }
    };

    fetchCategories();
  }, []);

  const items = useMemo(
    () =>
      categories.map((c) => ({
        label: c.name,
        value: c.id,
      })),
    [categories],
  );

  // --- State'ler ---
  const [category, setCategory] = useState<number | null>(null);
  const [newRoutineText, setNewRoutineText] = useState('');
  const [routineName, setRoutineName] = useState('');
  const [startTime, setStartTime] = useState(new Date(new Date().setHours(9, 0, 0)));
  const [endTime, setEndTime] = useState(new Date(new Date().setHours(10, 0, 0)));
  const [startDate, setStartDate] = useState(new Date());
  const [frequency, setFrequency] = useState<FrequencyType | undefined>('DAILY');
  const [repeatAt, setRepeatAt] = useState<string | undefined>('Morning');
  const [showStartTimePicker, setShowStartTimePicker] = useState(false);
  const [showEndTimePicker, setShowEndTimePicker] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);

  // const isLoading = categoriesLoading || routinesLoading;

  // --- API Çağrısı: Kategorileri Çekme ---

  // Format time for display (HH:MM)
  const formatTime = (d: Date) => {
    const hours = d.getHours().toString().padStart(2, '0');
    const minutes = d.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
  };

  // Format time for API (HH:MM:SS)
  const formatTimeForAPI = (d: Date) => {
    const hours = d.getHours().toString().padStart(2, '0');
    const minutes = d.getMinutes().toString().padStart(2, '0');
    const seconds = d.getSeconds().toString().padStart(2, '0');
    return `${hours}:${minutes}:${seconds}`;
  };

  // Format date for display (DD/MM/YYYY)
  const formatDate = (d: Date) => {
    const day = d.getDate().toString().padStart(2, '0');
    const month = (d.getMonth() + 1).toString().padStart(2, '0');
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  };

  // Format date for API (YYYY-MM-DD)
  const formatDateForAPI = (d: Date) => {
    const year = d.getFullYear();
    const month = (d.getMonth() + 1).toString().padStart(2, '0');
    const day = d.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const handleTimeChange = (type: 'start' | 'end') => (event: any, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setShowStartTimePicker(false);
      setShowEndTimePicker(false);
    }
    if (selectedDate) {
      if (type === 'start') {
        setStartTime(selectedDate);
        if (Platform.OS === 'ios') {
          setShowStartTimePicker(false);
        }
      } else {
        setEndTime(selectedDate);
        if (Platform.OS === 'ios') {
          setShowEndTimePicker(false);
        }
      }
    } else if (Platform.OS === 'ios') {
      setShowStartTimePicker(false);
      setShowEndTimePicker(false);
    }
  };

  const handleDateChange = (event: any, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setShowDatePicker(false);
    }
    if (selectedDate) {
      setStartDate(selectedDate);
      if (Platform.OS === 'ios') {
        setShowDatePicker(false);
      }
    } else if (Platform.OS === 'ios') {
      setShowDatePicker(false);
    }
  };

  const handleClose = () => {
    if (onClose) {
      onClose();
    } else {
      router.back();
    }
  };

  const handleCreate = async () => {
    if (!routineName || !category || !frequency) {
      Alert.alert('Uyarı', 'Lütfen tüm zorunlu alanları doldurun.');
      return;
    }
    try {
      // Önce routine list (routine group) oluştur
      const routineList = await routineService.createRoutineList(category, routineName);

      // Sonra routine oluştur
      await routineService.createRoutine({
        routine_group_id: routineList.id,
        category_id: category,
        title: routineName,
        start_time: formatTimeForAPI(startTime),
        end_time: formatTimeForAPI(endTime),
        start_date: formatDateForAPI(startDate),
        frequency_type: frequency,
        frequency_detail: repeatAt === 'Morning' ? 1 : repeatAt === 'Afternoon' ? 2 : 3,
      });

      Alert.alert('succesful', 'routine is created successfully!', [
        {
          text: 'okey',
          onPress: handleClose,
        },
      ]);
    } catch (error: any) {
      Alert.alert('error', error.message || 'routien cannot be created.');
    }
  };

  const handleAddRoutine = async () => {
    // Ayrı kontroller ve ayrı alert verilmesi 
    if (!newRoutineText.trim() || !category) {
      Alert.alert('warning', 'please select category!');
      return;
    }

    try {
      await routineService.createRoutineList(category, newRoutineText.trim());
      setNewRoutineText('');
      Alert.alert('successfull', 'Routine list is added!');
    } catch (error: any) {
      Alert.alert('error', error.message || 'routine cannot be added.');
    }
  };

  // --- UI RENDER ---
  return (
    <LinearGradient colors={BACKGROUND_GRADIENT as any} style={routineFormStyles.screen}>
      <View style={routineFormStyles.outerWrapper}>
        <View style={routineFormStyles.sheet}>
          <ScrollView
            contentContainerStyle={routineFormStyles.content}
            showsVerticalScrollIndicator={false}
            nestedScrollEnabled
            keyboardShouldPersistTaps="handled"
          >
            {/* Header (Başlık ve Kapatma İkonu) */}
            <View style={routineFormStyles.headerRow}>
              <Text style={routineFormStyles.title}>Create Routine</Text>
              <TouchableOpacity onPress={handleClose}>
                <Ionicons name="close" size={30} color="#111827" />
              </TouchableOpacity>
            </View>

            {/* Category */}
            <Text style={routineFormStyles.sectionLabel}>Category</Text>
            <DropDownPicker
              open={open}
              value={category}
              items={items}
              setOpen={setOpen}
              setValue={setCategory}
              loading={loadingCategories}
              placeholder="Select Category"
              style={{ backgroundColor: '#fff' }}
              dropDownContainerStyle={{ backgroundColor: '#fff' }}
              textStyle={{ color: '#000' }}
              zIndex={3000}
              zIndexInverse={1000}
              listMode="SCROLLVIEW"
              dropDownDirection="BOTTOM"
            />

            {/* Add Routine (Input + Buton) */}
            <View style={[routineFormStyles.row, { marginTop: 15 }]}>
              <View style={[routineFormStyles.inputContainer, routineFormStyles.routineInputWrapper]}>
                <TextInput
                  value={newRoutineText}
                  onChangeText={setNewRoutineText}
                  placeholder="Add Routine"
                  placeholderTextColor="#ffffff99"
                  style={routineFormStyles.textInput}
                />
              </View>
              <TouchableOpacity
                style={routineFormStyles.addIconBtn}
                onPress={handleAddRoutine}
              >
                <Ionicons name="add" size={26} color="#ffffff" />
              </TouchableOpacity>
            </View>

            {/* Routine Start Time / End Time Labels */}
            <View style={[routineFormStyles.rowSpace, { marginTop: 30 }]}>
              <Text style={routineFormStyles.smallLabel}>Routine Start Time</Text>
              <Text style={routineFormStyles.smallLabel}>Routine End Time</Text>
            </View>

            {/* Time inputs */}
            <View style={routineFormStyles.rowSpace}>
              <TouchableOpacity
                style={routineFormStyles.timeBox}
                onPress={() => setShowStartTimePicker(true)}
              >
                <Text style={routineFormStyles.timeText}>{formatTime(startTime)}</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={routineFormStyles.timeBox}
                onPress={() => setShowEndTimePicker(true)}
              >
                <Text style={routineFormStyles.timeText}>{formatTime(endTime)}</Text>
              </TouchableOpacity>
            </View>

            {/* Time Pickers */}
            {showStartTimePicker && (
              <DateTimePicker
                value={startTime}
                mode="time"
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                onChange={handleTimeChange('start')}
                is24Hour={true}
              />
            )}
            {showEndTimePicker && (
              <DateTimePicker
                value={endTime}
                mode="time"
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                onChange={handleTimeChange('end')}
                is24Hour={true}
              />
            )}

            {/* Name */}
            <Text style={routineFormStyles.sectionLabel}>Name</Text>
            <View style={routineFormStyles.inputContainer}>
              <TextInput
                value={routineName}
                onChangeText={setRoutineName}
                placeholder="Enter your name"
                placeholderTextColor="#ffffff99"
                style={routineFormStyles.textInput}
              />
            </View>

            {/* Start Date */}
            <Text style={routineFormStyles.sectionLabel}>Start Date</Text>
            <TouchableOpacity
              style={routineFormStyles.dateInputContainer}
              onPress={() => setShowDatePicker(true)}
            >
              <Text style={routineFormStyles.dateText}>{formatDate(startDate)}</Text>
              <MaterialIcons name="calendar-today" size={22} color="#ffffff" />
            </TouchableOpacity>

            {/* Date Picker */}
            {showDatePicker && (
              <DateTimePicker
                value={startDate}
                mode="date"
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                onChange={handleDateChange}
                minimumDate={new Date()}
              />
            )}

            {/* Frequency */}
            <Text style={routineFormStyles.sectionLabel}>Frequency</Text>
            <View style={routineFormStyles.pickerContainer}>
              <Picker
                selectedValue={frequency}
                onValueChange={(v) => setFrequency(v as FrequencyType)}
                style={routineFormStyles.picker}
                dropdownIconColor="#ffffff"
              >
                <Picker.Item
                  label="Select as daily/weekly"
                  value={undefined}
                  color="#ffffff"
                />
                <Picker.Item label="Daily" value="daily" color="#ffffff" />
                <Picker.Item label="Weekly" value="weekly" color="#ffffff" />
                <Picker.Item label="Monthly" value="monthly" color="#ffffff" />
              </Picker>
            </View>

            {/* Repeat at */}
            <Text style={routineFormStyles.sectionLabel}>Repeat at</Text>
            <View style={routineFormStyles.pickerContainer}>
              <Picker
                selectedValue={repeatAt}
                onValueChange={(v) => setRepeatAt(v as string)}
                style={routineFormStyles.picker}
                dropdownIconColor="#ffffff"
              >
                <Picker.Item label="Select as" value={undefined} color="#ffffff" />
                <Picker.Item label="Morning" value="Morning" color="#ffffff" />
                <Picker.Item label="Afternoon" value="Afternoon" color="#ffffff" />
                <Picker.Item label="Evening" value="Evening" color="#ffffff" />
              </Picker>
            </View>

            {/* Create button */}
            <TouchableOpacity
              style={routineFormStyles.createBtn}
              onPress={handleCreate}
            >
              <Text style={routineFormStyles.createBtnText}>
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </LinearGradient>
  );
}

