import { useAuth } from '@/hooks/useAuth';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { routineService } from '../../../services/routine.service';

export default function EditRoutineScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { token } = useAuth(); 
  const [isLoading, setIsLoading] = useState(false);
  // Form State
  const [routineName, setName] = useState('');
  const [start_time, setStartTime] = useState('');
  const [end_time, setEndTime] = useState('');
  const [category, setCategory] = useState('');

  // Fetch data on load (Mocked for now as we don't have the full context)
  useEffect(() => {
    // In a real app, fetch routine details by ID here
    setName('Sport Routine 1');
    setStartTime('08:00');
    setEndTime('09:00');
    setCategory('Sport')
  }, [id]);

  const handleClose = async () => {
    router.back();
  }

  const handleSave = async () => {
    setIsLoading(true);

    if (!token) {
      Alert.alert('Not authenticated', 'Please login again.');
      router.push('/(auth)');
      return;
    }

    try {
      await routineService.updateRoutine(id as string, {
        routineName,
        start_time,
        end_time,
      }, token);
      
      Alert.alert('Success', 'Routine updated successfully');
      router.back();
    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!token) {
      Alert.alert('Not authenticated', 'Please login again.');
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
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{routineName}</Text>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="close" size={24} color="#333" />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        
        {/* 1. Routine Tracker (Calendar Mock) */}
        <View style={styles.trackerCard}>
          <Text style={styles.trackerTitle}>Routine Tracker</Text>
          <Text style={styles.month}>April</Text>
          
          {/* Mock Grid */}
          <View style={styles.calendarGrid}>
            {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((day, index) => (
              <View key={index} style={styles.dayCol}>
                <Text style={styles.dayText}>{day}</Text>
                {[1, 2, 3, 4].map((week) => (
                  <View key={week} style={[styles.checkBox, Math.random() > 0.5 && styles.checked]}>
                    {Math.random() > 0.5 && <Ionicons name="checkmark" size={12} color="white" />}
                  </View>
                ))}
              </View>
            ))}
          </View>
        </View>

        {/* 2. Edit Form */}
        <View style={styles.formCard}>
          <Text style={styles.formTitle}>Edit Routine</Text>

          {/* Time Row */}
          <View style={styles.row}>
            <View style={styles.halfInput}>
              <Text style={styles.label}>Routine Start Time</Text>
              <TextInput
                style={styles.input}
                value={start_time}
                onChangeText={setStartTime}
                placeholder="00:00"
              />
            </View>
            <View style={styles.halfInput}>
              <Text style={styles.label}>Routine End Time</Text>
              <TextInput
                style={styles.input}
                value={end_time}
                onChangeText={setEndTime}
                placeholder="00:00"
              />
            </View>
          </View>

          {/* Name */}
          <Text style={styles.label}>Name</Text>
          <TextInput
            style={styles.input}
            value={routineName}
            onChangeText={setName}
            placeholder="Routine Name"
          />

          {/* Category (Dropdown Mock) */}
          <Text style={styles.label}>Category</Text>
          <View style={styles.dropdown}>
            <Text style={styles.dropdownText}>{category}</Text>
            <Ionicons name="chevron-down" size={20} color="#fff" />
          </View>

          {/* Save Button */}
          <TouchableOpacity style={styles.saveBtn} onPress={handleSave} disabled={isLoading}>
            {isLoading ? (
              <ActivityIndicator color="#007AFF" />
            ) : (
              <Text style={styles.saveBtnText}>Save Routine</Text>
            )}
          </TouchableOpacity>

          {/* Divider */}
          <View style={styles.divider} />

          {/* Delete Button */}
          <TouchableOpacity onPress={handleDelete}>
            <Text style={styles.deleteText}>Delete Routine</Text>
          </TouchableOpacity>
        </View>

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    top: 20,
    backgroundColor: '#fff',
  },
  headerTitle: { fontSize: 18, fontWeight: 'bold' },
  scroll: { padding: 20 },
  
  // Tracker Card
  trackerCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    marginTop: 10,
    alignItems: 'center',
  },
  trackerTitle: { fontSize: 16, fontWeight: '600', color: '#666', marginBottom: 10 },
  month: { fontSize: 14, color: '#999', marginBottom: 15 },
  calendarGrid: { flexDirection: 'row', justifyContent: 'space-between', width: '100%' },
  dayCol: { alignItems: 'center', gap: 8 },
  dayText: { fontSize: 12, fontWeight: 'bold', marginBottom: 5 },
  checkBox: {
    width: 24,
    height: 24,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checked: { backgroundColor: '#333', borderColor: '#333' },

  // Form Card
  formCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
  },
  formTitle: { fontSize: 16, fontWeight: '600', color: '#333', marginBottom: 20, textAlign: 'center' },
  row: { flexDirection: 'row', gap: 15, marginBottom: 15 },
  halfInput: { flex: 1 },
  label: { fontSize: 12, color: '#666', marginBottom: 5, marginLeft: 4 },
  input: {
    backgroundColor: '#007AFF', // Blue background from prototype
    borderRadius: 10,
    padding: 12,
    color: '#fff',
    marginBottom: 15,
  },
  dropdown: {
    backgroundColor: '#007AFF',
    borderRadius: 10,
    padding: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 25,
  },
  dropdownText: { color: '#fff' },
  
  // Buttons
  saveBtn: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#007AFF', // Inverted style for visibility in this layout
    borderRadius: 20,
    paddingVertical: 12,
    alignItems: 'center',
    marginBottom: 20,
    width: '60%',
    alignSelf: 'center',
  },
  saveBtnText: { color: '#007AFF', fontWeight: 'bold' },
  divider: { height: 1, backgroundColor: '#eee', marginBottom: 20 },
  deleteText: { color: '#D9534F', fontWeight: 'bold', textAlign: 'center' },
});