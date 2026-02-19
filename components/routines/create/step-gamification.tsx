import type { CreateRoutineFormState } from '@/types/create-routine';
import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import DropDownPicker from 'react-native-dropdown-picker';
import Animated, { SlideInRight, SlideOutLeft } from 'react-native-reanimated';

const INPUT_BG = 'rgba(0,0,0,0.2)';

interface Props {
  formState: CreateRoutineFormState;
  updateForm: (updates: Partial<CreateRoutineFormState>) => void;
}

export function StepGamification({ formState, updateForm }: Props) {
  const [genderOpen, setGenderOpen] = useState(false);

  return (
    <Animated.View exiting={SlideOutLeft} entering={SlideInRight} style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Gamification Rules</Text>
      <Text style={styles.stepSub}>Make it fun and challenging!</Text>

      {/* Lives */}
      <View style={styles.fieldContainer}>
         <Text style={styles.label}>Lives Limit (0-10)</Text>
         <View style={styles.counterRow}>
             <TouchableOpacity onPress={() => updateForm({ lives: Math.max(0, formState.lives - 1) })} style={styles.counterBtn}>
                 <Ionicons name="remove" size={24} color="#fff" />
             </TouchableOpacity>
             <View style={styles.counterValue}>
                <Ionicons name="heart" size={24} color="#ef4444" style={{ marginRight: 8 }} />
                 <Text style={styles.counterText}>{formState.lives}</Text>
             </View>
             <TouchableOpacity onPress={() => updateForm({ lives: Math.min(10, formState.lives + 1) })} style={styles.counterBtn}>
                 <Ionicons name="add" size={24} color="#fff" />
             </TouchableOpacity>
         </View>
         <Text style={styles.subLabel}>Participants fail if they miss more than {formState.lives} times.</Text>
      </View>

      {/* Reward Condition */}
       <View style={styles.fieldContainer}>
        <Text style={styles.label}>Reward Condition</Text>
        <TextInput 
            style={styles.input}
            placeholder="e.g. Master Badge"
            placeholderTextColor="rgba(255,255,255,0.4)"
            value={formState.rewardCondition}
            onChangeText={(text) => updateForm({ rewardCondition: text })}
        />
      </View>


      <View style={styles.divider} />
      <Text style={[styles.stepTitle, { fontSize: 18, marginTop: 10 }]}>Entry Requirements</Text>
      <Text style={[styles.stepSub, { fontSize: 14, marginBottom: 20 }]}>Who can join this routine?</Text>

      {/* Age Requirement */}
      <View style={styles.fieldContainer}>
        <Text style={styles.label}>Minimum Age</Text>
        <TextInput 
            style={styles.input}
            placeholder="None (e.g. 18)"
            placeholderTextColor="rgba(255,255,255,0.4)"
            value={formState.ageRequirement}
            onChangeText={(text) => updateForm({ ageRequirement: text })}
            keyboardType="numeric"
        />
      </View>

      {/* Gender Requirement */}
      <View style={[styles.fieldContainer, { zIndex: 3000 }]}>
        <Text style={styles.label}>Gender Requirement</Text>
        <DropDownPicker
            open={genderOpen}
            value={formState.genderRequirement}
            items={[
                { label: 'No Requirement', value: 'na' },
                { label: 'Female Only', value: 'female' },
                { label: 'Male Only', value: 'male' },
                { label: 'Other', value: 'other' },
            ]}
            setOpen={setGenderOpen}
            setValue={(valFn) => {
                const val = valFn instanceof Function ? valFn(formState.genderRequirement) : valFn;
                updateForm({ genderRequirement: val });
            }}
            theme="DARK"
            style={styles.dropdown}
            dropDownContainerStyle={styles.dropdownContainer}
            textStyle={{ color: '#fff' }}
            listMode="SCROLLVIEW"
        />
      </View>

      {/* Completion XP Reward */}
      <View style={styles.fieldContainer}>
        <Text style={styles.label}>Completion XP Reward</Text>
        <TextInput 
            style={styles.input}
            placeholder="e.g. 10 (Default)"
            placeholderTextColor="rgba(255,255,255,0.4)"
            value={formState.completionXp}
            onChangeText={(text) => updateForm({ completionXp: text })}
            keyboardType="numeric"
        />
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
  subLabel: { color: 'rgba(255,255,255,0.5)', fontSize: 12, marginTop: 4 },
  input: {
    backgroundColor: INPUT_BG,
    borderRadius: 12,
    padding: 16,
    color: '#fff',
    fontSize: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  dropdown: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderColor: 'rgba(255,255,255,0.1)',
    borderRadius: 16,
    paddingHorizontal: 16,
  },
  dropdownContainer: {
    backgroundColor: '#1e1b4b',
    borderColor: 'rgba(255,255,255,0.1)',
    borderRadius: 16,
    marginTop: 8,
  },
  divider: { height: 1, backgroundColor: 'rgba(255,255,255,0.1)', marginVertical: 20 },
  counterRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: INPUT_BG, borderRadius: 16, padding: 10,
  },
  counterBtn: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.1)', 
    alignItems: 'center', justifyContent: 'center',
  },
  counterValue: {
    flex: 1, alignItems: 'center', flexDirection: 'row', justifyContent: 'center',
  },
  counterText: { color: '#fff', fontSize: 24, fontWeight: 'bold' },
});
