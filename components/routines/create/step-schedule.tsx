import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import type { CreateRoutineFormState } from '@/types/create-routine';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import React, { useState } from 'react';
import { Modal, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Animated, { SlideInRight, SlideOutLeft } from 'react-native-reanimated';

interface Props {
  formState: CreateRoutineFormState;
  updateForm: (updates: Partial<CreateRoutineFormState>) => void;
}

export function StepSchedule({ formState, updateForm }: Props) {
  const theme = useColorScheme() ?? 'light';
  const isDark = theme === 'dark';
  const colors = Colors[theme];

  const [showStartDate, setShowStartDate] = useState(false);
  const [showStartTime, setShowStartTime] = useState(false);
  const [showEndTime, setShowEndTime] = useState(false);

  // Helper to render picker based on Platform
  const renderDatePicker = (
    show: boolean,
    value: Date,
    onChange: (event: DateTimePickerEvent, date?: Date) => void,
    mode: 'date' | 'time',
    onClose: () => void
  ) => {
    if (!show) return null;

    if (Platform.OS === 'ios') {
      return (
        <Modal transparent animationType="fade" visible={show}>
          <View style={styles.modalOverlay}>
            <TouchableOpacity style={styles.modalBackdrop} onPress={onClose} />
            <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
              <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
                <TouchableOpacity onPress={onClose}>
                  <Text style={[styles.modalDoneText, { color: colors.collaborativePrimary }]}>Done</Text>
                </TouchableOpacity>
              </View>
              <DateTimePicker
                value={value}
                mode={mode}
                display="spinner"
                onChange={onChange}
                textColor={colors.text}
                themeVariant={theme}
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

  const inputStyle = [
    styles.input, 
    { 
      backgroundColor: colors.surface, 
      color: colors.text,
      borderColor: colors.border
    }
  ];

  return (
    <Animated.View exiting={SlideOutLeft} entering={SlideInRight} style={styles.stepContainer}>
      <Text style={[styles.stepTitle, { color: colors.text }]}>Schedule & Frequency</Text>
      <Text style={[styles.stepSub, { color: colors.text, opacity: 0.7 }]}>When should this routine happen?</Text>

      {/* Start Date */}
      <View style={styles.fieldContainer}>
        <Text style={[styles.label, { color: colors.text }]}>Start Date</Text>
        <TouchableOpacity onPress={() => setShowStartDate(true)} style={inputStyle}>
          <Text style={{ color: colors.text }}>{formState.startDate.toDateString()}</Text>
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
      {formState.frequency === 'Daily' && (
        <View style={styles.rowBetween}>
          <View style={{ flex: 1, marginRight: 10 }}>
            <Text style={[styles.label, { color: colors.text }]}>Start Time</Text>
            <TouchableOpacity onPress={() => setShowStartTime(true)} style={inputStyle}>
               <Text style={{ color: colors.text }}>
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
            <Text style={[styles.label, { color: colors.text }]}>End Time</Text>
            <TouchableOpacity onPress={() => setShowEndTime(true)} style={inputStyle}>
              <Text style={{ color: colors.text }}>
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
      )}

      {/* Frequency */}
      <View style={styles.fieldContainer}>
        <Text style={[styles.label, { color: colors.text }]}>Frequency</Text>
        <View style={[styles.segmentContainer, { backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1 }]}>
           {['Daily', 'Weekly'].map((f) => (
             <TouchableOpacity 
              key={f} 
              style={[
                styles.segmentBtn, 
                formState.frequency === f && [styles.segmentBtnActive, { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)' }]
              ]}
              onPress={() => updateForm({ frequency: f as 'Daily' | 'Weekly' })}
             >
               <Text style={[
                styles.segmentText, 
                { color: colors.text, opacity: formState.frequency === f ? 1 : 0.4 },
                formState.frequency === f && styles.segmentTextActive
               ]}>{f}</Text>
             </TouchableOpacity>
           ))}
        </View>
      </View>

       {formState.frequency === 'Daily' ? (
         <View style={[styles.infoBox, { backgroundColor: isDark ? 'rgba(232, 121, 249, 0.1)' : 'rgba(219, 39, 119, 0.05)' }]}>
           <Ionicons name="information-circle-outline" size={20} color={colors.collaborativePrimary} />
           <Text style={[styles.infoText, { color: colors.text }]}>
            Collaborators must complete the routine within the {String(formState.startTime.getHours()).padStart(2, '0')}:{String(formState.startTime.getMinutes()).padStart(2, '0')} - {String(formState.endTime.getHours()).padStart(2, '0')}:{String(formState.endTime.getMinutes()).padStart(2, '0')} window.
           </Text>
         </View>
       ) : (
         <View style={[styles.infoBox, { backgroundColor: isDark ? 'rgba(232, 121, 249, 0.1)' : 'rgba(219, 39, 119, 0.05)' }]}>
           <Ionicons name="information-circle-outline" size={20} color={colors.collaborativePrimary} />
           <Text style={[styles.infoText, { color: colors.text }]}>
            Collaborators can complete this routine anytime during the week.
           </Text>
         </View>
       )}

    </Animated.View>
  );
}

const styles = StyleSheet.create({
  stepContainer: { width: '100%' },
  stepTitle: { fontSize: 24, fontWeight: '800', marginBottom: 8 },
  stepSub: { fontSize: 16, marginBottom: 30 },
  fieldContainer: { marginBottom: 24 },
  label: { marginBottom: 8, fontWeight: '600' },
  input: {
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    borderWidth: 1,
  },
  rowBetween: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24,
  },
  segmentContainer: {
    flexDirection: 'row', borderRadius: 12, padding: 4,
  },
  segmentBtn: {
    flex: 1, paddingVertical: 12, alignItems: 'center', borderRadius: 10,
  },
  segmentBtnActive: {},
  segmentText: { fontWeight: '600' },
  segmentTextActive: { fontWeight: '700' },
  infoBox: {
    flexDirection: 'row',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 10,
  },
  infoText: {
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
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 40,
  },
  modalHeader: {
    alignItems: 'flex-end',
    padding: 16,
    borderBottomWidth: 1,
  },
  modalDoneText: {
    fontWeight: 'bold',
    fontSize: 16,
  },
});
