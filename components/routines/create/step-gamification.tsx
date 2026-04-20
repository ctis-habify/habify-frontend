import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import type { CreateRoutineFormState } from '@/types/create-routine';
import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import DropDownPicker from 'react-native-dropdown-picker';
import Animated, { SlideInRight, SlideOutLeft } from 'react-native-reanimated';

interface Props {
  formState: CreateRoutineFormState;
  updateForm: (updates: Partial<CreateRoutineFormState>) => void;
}

const GENDER_OPTIONS = [
    { label: 'No Requirement', value: 'na' },
    { label: 'Female Only', value: 'female' },
    { label: 'Male Only', value: 'male' },
    { label: 'Other', value: 'other' },
];

export function StepGamification({ formState, updateForm }: Props) {
  const theme = useColorScheme() ?? 'light';
  const isDark = theme === 'dark';
  const colors = Colors[theme];
  const [genderOpen, setGenderOpen] = useState(false);

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
      <Text style={[styles.stepTitle, { color: colors.text }]}>Gamification Rules</Text>
      <Text style={[styles.stepSub, { color: colors.text, opacity: 0.7 }]}>Make it fun and challenging!</Text>

      {/* Lives */}
      <View style={styles.fieldContainer}>
         <Text style={[styles.label, { color: colors.text }]}>Lives Limit (0-10)</Text>
         <View style={[styles.counterRow, { backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1 }]}>
             <TouchableOpacity 
                onPress={() => updateForm({ lives: Math.max(0, formState.lives - 1) })} 
                style={[styles.counterBtn, { backgroundColor: colors.card }]}
             >
                 <Ionicons name="remove" size={24} color={colors.text} />
             </TouchableOpacity>
             <View style={styles.counterValue}>
                <Ionicons name="heart" size={24} color={colors.error} style={{ marginRight: 8 }} />
                 <Text style={[styles.counterText, { color: colors.text }]}>{formState.lives}</Text>
             </View>
             <TouchableOpacity 
                onPress={() => updateForm({ lives: Math.min(10, formState.lives + 1) })} 
                style={[styles.counterBtn, { backgroundColor: colors.card }]}
             >
                 <Ionicons name="add" size={24} color={colors.text} />
             </TouchableOpacity>
         </View>
         <Text style={[styles.subLabel, { color: colors.textSecondary, opacity: 0.7 }]}>Participants fail if they miss more than {formState.lives} times.</Text>
      </View>

      {/* Reward Condition */}
       <View style={styles.fieldContainer}>
        <Text style={[styles.label, { color: colors.text }]}>Reward Condition</Text>
        <TextInput 
            style={inputStyle}
            placeholder="e.g. Master Badge"
            placeholderTextColor={colors.icon}
            value={formState.rewardCondition}
            onChangeText={(text) => updateForm({ rewardCondition: text })}
        />
      </View>

      {formState.isPublic && (
        <>
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          <Text style={[styles.stepTitle, { fontSize: 18, marginTop: 4, color: colors.text }]}>Entry Requirements</Text>
          <Text style={[styles.stepSub, { fontSize: 14, marginBottom: 20, color: colors.textSecondary, opacity: 0.7 }]}>Who can join this routine?</Text>

          {/* Age Requirement */}
          <View style={styles.fieldContainer}>
            <Text style={[styles.label, { color: colors.text }]}>Minimum Age</Text>
            <TextInput 
                style={inputStyle}
                placeholder="None (e.g. 18)"
                placeholderTextColor={colors.icon}
                value={formState.ageRequirement}
                onChangeText={(text) => updateForm({ ageRequirement: text })}
                keyboardType="numeric"
            />
          </View>

          {/* Gender Requirement */}
          <View style={[styles.fieldContainer, { zIndex: 3000 }]}>
            <Text style={[styles.label, { color: colors.text }]}>Gender Requirement</Text>
            <DropDownPicker
                open={genderOpen}
                value={formState.genderRequirement}
                items={GENDER_OPTIONS}
                setOpen={setGenderOpen}
                setValue={(valFn) => {
                    const val = valFn instanceof Function ? valFn(formState.genderRequirement) : valFn;
                    updateForm({ genderRequirement: val });
                }}
                theme={isDark ? "DARK" : "LIGHT"}
                style={[styles.dropdown, { backgroundColor: colors.surface, borderColor: colors.border }]}
                dropDownContainerStyle={[styles.dropdownContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}
                listItemLabelStyle={{ color: colors.text }}
                selectedItemLabelStyle={{ color: colors.collaborativePrimary, fontWeight: 'bold' }}
                textStyle={{ color: colors.text }}
                listMode="SCROLLVIEW"
                zIndex={2000}
                zIndexInverse={2000}
            />
          </View>

          {/* Completion XP Reward */}
          <View style={styles.fieldContainer}>
            <Text style={[styles.label, { color: colors.text }]}>Completion XP Reward</Text>
            <TextInput 
                style={inputStyle}
                placeholder="e.g. 10 (Default)"
                placeholderTextColor={colors.icon}
                value={formState.completionXp}
                onChangeText={(text) => updateForm({ completionXp: text })}
                keyboardType="numeric"
            />
          </View>
        </>
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
  subLabel: { fontSize: 12, marginTop: 4 },
  input: {
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    borderWidth: 1,
  },
  dropdown: {
    borderRadius: 16,
    paddingHorizontal: 16,
  },
  dropdownContainer: {
    borderRadius: 16,
    marginTop: 8,
  },
  divider: { height: 1, marginVertical: 12 },
  counterRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    borderRadius: 16, padding: 10,
  },
  counterBtn: {
    width: 44, height: 44, borderRadius: 22,
    alignItems: 'center', justifyContent: 'center',
  },
  counterValue: {
    flex: 1, alignItems: 'center', flexDirection: 'row', justifyContent: 'center',
  },
  counterText: { fontSize: 24, fontWeight: 'bold' },
});
