'use client';

import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Picker } from '@react-native-picker/picker';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  Alert,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
// Tema dosyasını root 'app/' klasöründen içe aktar
import { useCategories } from '../../hooks/useCategories';
import { useRoutines } from '../../hooks/useRoutines';
import { FrequencyType } from '../../types/routine';
import { BACKGROUND_GRADIENT, COLORS } from '../theme';

// Constants
const INPUT_BLUE = COLORS.inputBlue; 
const TEXT_DARK = COLORS.textDark;

export default function CreateRoutineScreen() {
  const router = useRouter();
  const { categories, isLoading: categoriesLoading, fetchCategories } = useCategories();
  const { createRoutine, createRoutineList, isLoading: routinesLoading } = useRoutines();

  // --- State'ler ---
  const [category, setCategory] = useState<number | undefined>();
  const [newRoutineText, setNewRoutineText] = useState('');
  const [routineName, setRoutineName] = useState('');
  const [startTime, setStartTime] = useState(new Date(new Date().setHours(9, 0, 0)));
  const [endTime, setEndTime] = useState(new Date(new Date().setHours(10, 0, 0)));
  const [startDate, setStartDate] = useState(new Date());
  const [frequency, setFrequency] = useState<FrequencyType | undefined>('daily'); 
  const [repeatAt, setRepeatAt] = useState<string | undefined>('Morning'); 
  const [showStartTimePicker, setShowStartTimePicker] = useState(false);
  const [showEndTimePicker, setShowEndTimePicker] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);

  const isLoading = categoriesLoading || routinesLoading;

  // --- API Çağrısı: Kategorileri Çekme ---
  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

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
      // On iOS, user can cancel
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
      // On iOS, user can cancel
      setShowDatePicker(false);
    }
  };
  
  const handleCreate = async () => {
    if (!routineName || !category || !frequency) {
      Alert.alert('Uyarı', 'Lütfen tüm zorunlu alanları doldurun.');
      return;
    }

    try {
      // Önce routine list (routine group) oluştur
      const routineList = await createRoutineList(category, routineName);
      
      // Sonra routine oluştur
      await createRoutine({
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
          onPress: () => router.back(),
        },
      ]);
    } catch (error: any) {
      Alert.alert('error', error.message || 'routien cannot be created.');
    }
  };
  
  const handleAddRoutine = async () => {
    if (!newRoutineText.trim() || !category) {
      Alert.alert('warning', 'please select category!');
      return;
    }

    try {
      await createRoutineList(category, newRoutineText.trim());
      setNewRoutineText('');
      Alert.alert('successfull', 'Routine list is added!');
      // Kategorileri yeniden yükle (gerekirse)
    } catch (error: any) {
      Alert.alert('error', error.message || 'routine cannot be added.');
    }
  };

  // --- UI RENDER ---
  return (
    // Arka planı koyu mavi gradient
    <LinearGradient colors={BACKGROUND_GRADIENT as any} style={styles.screen}>
      <View style={styles.outerWrapper}>
        {/* Form Kartı */}
        <View style={styles.sheet}>
          <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

            {/* Header (Başlık ve Kapatma İkonu) */}
            <View style={styles.headerRow}>
              <Text style={styles.title}>Create Routine</Text>
              <TouchableOpacity onPress={() => router.back()}>
                <Ionicons name="close" size={30} color={TEXT_DARK} />
              </TouchableOpacity>
            </View>

            {/* Category */}
            <Text style={styles.sectionLabel}>Category</Text>
            <View style={styles.row}>
              <View style={styles.pickerWrapper}>
                <Picker
                  selectedValue={category}
                  onValueChange={(itemValue) => setCategory(itemValue as number)}
                  style={styles.picker}
                  dropdownIconColor="#ffffff"
                  enabled={!isLoading}
                >
                  <Picker.Item label="Select Category" value={undefined} color="#ffffff" />
                  {categories.map((cat) => (
                    <Picker.Item
                      key={cat.id}
                      label={cat.name}
                      value={cat.id}
                      color="#ffffff"
                    />
                  ))}
                </Picker>
              </View>
            </View>

            {/* Add Routine (Input + Buton) */}
            <View style={[styles.row, {marginTop: 15}]}>
                {/* Add Routine Input */}
              <View style={[styles.inputContainer, styles.routineInputWrapper]}>
                <TextInput
                  value={newRoutineText} 
                  onChangeText={setNewRoutineText}
                  placeholder="Add Routine"
                  placeholderTextColor="#ffffff99"
                  style={styles.textInput}
                  editable={!isLoading}
                />
              </View>
              {/* Add Routine Butonu */}
              <TouchableOpacity 
                style={styles.addIconBtn} 
                onPress={handleAddRoutine}
                disabled={isLoading}
              >
                <Ionicons name="add" size={26} color="#ffffff" />
              </TouchableOpacity>
            </View>
            
            {/* Routine Start Time / End Time Labels */}
            <View style={[styles.rowSpace, {marginTop: 30}]}>
              <Text style={styles.smallLabel}>Routine Start Time</Text>
              <Text style={styles.smallLabel}>Routine End Time</Text>
            </View>

            {/* Time inputs */}
            <View style={styles.rowSpace}>
              <TouchableOpacity style={styles.timeBox} onPress={() => setShowStartTimePicker(true)}>
                <Text style={styles.timeText}>{formatTime(startTime)}</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.timeBox} onPress={() => setShowEndTimePicker(true)}>
                <Text style={styles.timeText}>{formatTime(endTime)}</Text>
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
            <Text style={styles.sectionLabel}>Name</Text>
            <View style={styles.inputContainer}>
              <TextInput
                value={routineName}
                onChangeText={setRoutineName}
                placeholder="Enter your name"
                placeholderTextColor="#ffffff99"
                style={styles.textInput}
              />
            </View>

            {/* Start Date */}
            <Text style={styles.sectionLabel}>Start Date</Text>
            <TouchableOpacity style={styles.dateInputContainer} onPress={() => setShowDatePicker(true)}>
              <Text style={styles.dateText}>{formatDate(startDate)}</Text>
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
            <Text style={styles.sectionLabel}>Frequency</Text>
            <View style={styles.pickerContainer}>
              <Picker 
                selectedValue={frequency} 
                onValueChange={(v) => setFrequency(v as FrequencyType)} 
                style={styles.picker} 
                dropdownIconColor="#ffffff"
                enabled={!isLoading}
              >
                <Picker.Item label="Select as daily/weekly" value={undefined} color="#ffffff" />
                <Picker.Item label="Daily" value="daily" color="#ffffff" />
                <Picker.Item label="Weekly" value="weekly" color="#ffffff" />
                <Picker.Item label="Monthly" value="monthly" color="#ffffff" />
              </Picker>
            </View>

            {/* Repeat at */}
            <Text style={styles.sectionLabel}>Repeat at</Text>
            <View style={styles.pickerContainer}>
              <Picker 
                selectedValue={repeatAt} 
                onValueChange={(v) => setRepeatAt(v as string)} 
                style={styles.picker} 
                dropdownIconColor="#ffffff"
                enabled={!isLoading}
              >
                <Picker.Item label="Select as" value={undefined} color="#ffffff" />
                <Picker.Item label="Morning" value="Morning" color="#ffffff" />
                <Picker.Item label="Afternoon" value="Afternoon" color="#ffffff" />
                <Picker.Item label="Evening" value="Evening" color="#ffffff" />
              </Picker>
            </View>

            {/* Create button */}
            <TouchableOpacity style={styles.createBtn} onPress={handleCreate} disabled={isLoading}>
              <Text style={styles.createBtnText}>{isLoading ? 'Oluşturuluyor...' : 'Create New Routine'}</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </LinearGradient>
  );
}

// --- TASARIMA ÖZEL STİLLER ---
const styles = StyleSheet.create({
  screen: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  // Koyu arka plan üzerinde kartı tutan dış kap
  outerWrapper: {
    width: '90%', 
    maxWidth: 400,
    // Kartın hafif gölgesi
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 6, 
    borderRadius: 36,
    overflow: 'hidden',
  },
  // Form Kartı (Beyaz)
  sheet: {
    backgroundColor: COLORS.formBackground,
    borderRadius: 36,
  },
  content: {
    paddingHorizontal: 22,
    paddingVertical: 20,
    paddingBottom: 40, 
  },
  // Başlık ve Kapatma İkonu
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 25, // Daha fazla boşluk
    paddingTop: 10,
  },
  title: {
    fontSize: 26, // Daha büyük başlık
    fontWeight: '700',
    color: TEXT_DARK,
  },
  // Input Etiketleri
  sectionLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: TEXT_DARK,
    marginBottom: 8,
    marginTop: 20, // Inputlar arası daha belirgin boşluk
  },
  smallLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: TEXT_DARK,
    marginBottom: 6,
    flex: 1, 
    textAlign: 'left',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 4,
  },
  rowSpace: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
    marginBottom: 8,
  },

  // --- Mavi Input Stilleri (Tasarımın anahtar noktası) ---
  inputContainer: {
    flex: 1,
    backgroundColor: INPUT_BLUE, 
    borderRadius: 8, 
    paddingHorizontal: 16,
    paddingVertical: 14, 
    justifyContent: 'center',
    height: 50,
  },
  // Picker (Dropdown) Container
  pickerWrapper: {
    flex: 1,
    backgroundColor: INPUT_BLUE,
    borderRadius: 8,
    height: 50, 
    overflow: 'hidden',
    justifyContent: 'center',
  },
  pickerContainer: { // Frequency/Repeat at için
    backgroundColor: INPUT_BLUE,
    borderRadius: 8,
    height: 50,
    overflow: 'hidden',
    justifyContent: 'center',
  },
  picker: {
    width: '100%',
    backgroundColor: 'transparent',
    color: '#ffffff',
    ...Platform.select({
      ios: { height: 50 },
      android: { height: 50 },
    }),
  },
  textInput: {
    fontSize: 15,
    color: '#ffffff',
    padding: 0, 
  },

  // Input Yanındaki Yuvarlak Ekle Butonu
  addIconBtn: {
    width: 44,
    height: 44,
    borderRadius: 22, // Tam yuvarlaklık
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: INPUT_BLUE, 
    borderWidth: 0, 
  },

  // Zaman Inputları
  timeBox: {
    flex: 1,
    backgroundColor: INPUT_BLUE, 
    borderRadius: 8, 
    paddingHorizontal: 16,
    paddingVertical: 14, 
    alignItems: 'center', 
    justifyContent: 'center',
    height: 50,
  },
  timeText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '500',
    textAlign: 'center',
  },

  // Tarih Inputu
  dateInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: INPUT_BLUE,
    borderRadius: 8,
    paddingHorizontal: 16,
    height: 50, 
    justifyContent: 'space-between',
  },
  dateText: {
    color: '#ffffff',
    fontSize: 15,
    flex: 1,
    padding: 0,
  },

  // Create New Routine Butonu
  createBtn: {
    marginTop: 35, // Daha büyük boşluk
    marginBottom: 10,
    backgroundColor: '#00163a', // Koyu renk
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  createBtnText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
  routineInputWrapper: {
    // Sadece Add Routine inputu için
  },
});