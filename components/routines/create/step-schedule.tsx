import type { CreateRoutineFormState } from '@/types/create-routine';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import React, { useState } from 'react';
import { Modal, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Animated, { SlideInRight, SlideOutLeft } from 'react-native-reanimated';

const ACCENT_COLOR = '#E879F9';
const INPUT_BG = 'rgba(0,0,0,0.2)';

interface Props {
  formState: CreateRoutineFormState;
  updateForm: (updates: Partial<CreateRoutineFormState>) => void;
}

export function StepSchedule({ formState, updateForm }: Props) {
  const [showStartDate, setShowStartDate] = useState(false);
  const [showStartTime, setShowStartTime] = useState(false);
  const [showEndTime, setShowEndTime] = useState(false);

  // Helper to render picker based on Platform
  const renderDatePicker = (
    show: boolean,
    value: Date,
    onChange: (event: any, date?: Date) => void,
    mode: 'date' | 'time',
    onClose: () => void
  ) => {
    if (!show) return null;

    if (Platform.OS === 'ios') {
      return (
        <Modal transparent animationType="fade" visible={show}>
          <View style={styles.modalOverlay}>
            <TouchableOpacity style={styles.modalBackdrop} onPress={onClose} />
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <TouchableOpacity onPress={onClose}>
                  <Text style={styles.modalDoneText}>Done</Text>
                </TouchableOpacity>
              </View>
              <DateTimePicker
                value={value}
                mode={mode}
                display="spinner"
                onChange={onChange}
                textColor="#fff"
                themeVariant="dark"
                style={{ height: 200, width: '100%' }} 
              />
            </View>
          </View>
        </Modal>
      );
    }

    // Android
    return (
      <DateTimePicker
        value={value}
        mode={mode}
        display="default"
        onChange={(e, d) => {
          onClose();
          if (d) onChange(e, d);
        }}
      />
    );
  };

  return (
    <Animated.View exiting={SlideOutLeft} entering={SlideInRight} style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Schedule & Frequency</Text>
      <Text style={styles.stepSub}>When should this routine happen?</Text>

      {/* Start Date */}
      <View style={styles.fieldContainer}>
        <Text style={styles.label}>Start Date</Text>
        <TouchableOpacity onPress={() => setShowStartDate(true)} style={styles.input}>
          <Text style={{ color: '#fff' }}>{formState.startDate.toDateString()}</Text>
        </TouchableOpacity>
        {renderDatePicker(
          showStartDate,
          formState.startDate,
          (e, d) => d && updateForm({ startDate: d }),
          'date',
          () => setShowStartDate(false)
        )}
      </View>

      {/* Time Window */}
      <View style={styles.rowBetween}>
        <View style={{ flex: 1, marginRight: 10 }}>
          <Text style={styles.label}>Start Time</Text>
          <TouchableOpacity onPress={() => setShowStartTime(true)} style={styles.input}>
             <Text style={{ color: '#fff' }}>
              {formState.startTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })}
             </Text>
          </TouchableOpacity>
          {renderDatePicker(
            showStartTime,
            formState.startTime,
            (e, d) => d && updateForm({ startTime: d }),
            'time',
            () => setShowStartTime(false)
          )}
        </View>

         <View style={{ flex: 1, marginLeft: 10 }}>
          <Text style={styles.label}>End Time</Text>
          <TouchableOpacity onPress={() => setShowEndTime(true)} style={styles.input}>
            <Text style={{ color: '#fff' }}>
            {formState.endTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })}
            </Text>
          </TouchableOpacity>
          {renderDatePicker(
             showEndTime,
             formState.endTime,
             (e, d) => d && updateForm({ endTime: d }),
             'time',
             () => setShowEndTime(false)
           )}
        </View>
      </View>

      {/* Frequency */}
      <View style={styles.fieldContainer}>
        <Text style={styles.label}>Frequency</Text>
        <View style={styles.segmentContainer}>
           {['Daily', 'Weekly'].map((f) => (
             <TouchableOpacity 
              key={f} 
              style={[styles.segmentBtn, formState.frequency === f && styles.segmentBtnActive]}
              onPress={() => updateForm({ frequency: f as 'Daily' | 'Weekly' })}
             >
               <Text style={[styles.segmentText, formState.frequency === f && styles.segmentTextActive]}>{f}</Text>
             </TouchableOpacity>
           ))}
        </View>
      </View>

       <View style={styles.infoBox}>
         <Ionicons name="information-circle-outline" size={20} color={ACCENT_COLOR} />
         <Text style={styles.infoText}>
          Collaborators must complete the routine within the {formState.startTime.getHours()}:{formState.startTime.getMinutes()} - {formState.endTime.getHours()}:{formState.endTime.getMinutes()} window.
         </Text>
       </View>

    </Animated.View>
  );
}

const styles = StyleSheet.create({
  stepContainer: { width: '100%' },
  stepTitle: { color: '#fff', fontSize: 24, fontWeight: '800', marginBottom: 8 },
  stepSub: { color: 'rgba(255,255,255,0.7)', fontSize: 16, marginBottom: 30 },
  fieldContainer: { marginBottom: 24 },
  label: { color: '#fff', marginBottom: 8, fontWeight: '600' },
  input: {
    backgroundColor: INPUT_BG,
    borderRadius: 12,
    padding: 16,
    color: '#fff',
    fontSize: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  rowBetween: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24,
  },
  segmentContainer: {
    flexDirection: 'row', backgroundColor: INPUT_BG, borderRadius: 12, padding: 4,
  },
  segmentBtn: {
    flex: 1, paddingVertical: 12, alignItems: 'center', borderRadius: 10,
  },
  segmentBtnActive: {
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  segmentText: { color: 'rgba(255,255,255,0.5)', fontWeight: '600' },
  segmentTextActive: { color: '#fff' },
  infoBox: {
    flexDirection: 'row',
    backgroundColor: 'rgba(232, 121, 249, 0.1)',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 10,
  },
  infoText: {
    color: '#e9d5ff',
    marginLeft: 10,
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  modalContent: {
    backgroundColor: '#1E1E1E',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 40,
  },
  modalHeader: {
    alignItems: 'flex-end',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  modalDoneText: {
    color: ACCENT_COLOR,
    fontWeight: 'bold',
    fontSize: 16,
  },
});
