import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import type { CreateRoutineFormState } from '@/types/create-routine';
import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
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
          <View style={[styles.fieldContainer]}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 }}>
               <View style={{ width: 32, height: 32, borderRadius: 10, backgroundColor: colors.collaborativePrimary + '20', alignItems: 'center', justifyContent: 'center' }}>
                 <Ionicons name="people" size={16} color={colors.collaborativePrimary} />
               </View>
               <Text style={[styles.label, { marginBottom: 0, color: colors.text }]}>Gender Requirement</Text>
            </View>
            
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
              {GENDER_OPTIONS.map((option) => {
                const isSelected = formState.genderRequirement === option.value;
                let iconName: any = 'body-outline';
                let activeColor = colors.collaborativePrimary;
                
                if (option.value === 'female') {
                  iconName = 'female';
                  activeColor = '#F472B6';
                } else if (option.value === 'male') {
                  iconName = 'male';
                  activeColor = '#3B82F6';
                } else if (option.value === 'other') {
                  iconName = 'male-female';
                  activeColor = '#10B981';
                }

                return (
                  <TouchableOpacity
                    key={option.value}
                    onPress={() => updateForm({ genderRequirement: option.value as any })}
                    style={[
                      styles.segmentedButton,
                      {
                        width: '48.5%', // 2 columns
                        backgroundColor: isSelected ? activeColor : colors.surface,
                        borderColor: isSelected ? activeColor : colors.border,
                        height: 50,
                      },
                      isSelected && {
                        shadowColor: activeColor,
                        shadowOpacity: 0.35,
                        shadowRadius: 10,
                        shadowOffset: { width: 0, height: 4 },
                        elevation: 6
                      }
                    ]}
                  >
                    <Ionicons 
                      name={iconName} 
                      size={18} 
                      color={isSelected ? '#fff' : colors.icon} 
                      style={{ marginRight: 8 }} 
                    />
                    <Text style={{ 
                      fontSize: 13, 
                      fontWeight: isSelected ? '700' : '500', 
                      color: isSelected ? '#fff' : colors.text 
                    }}>
                      {option.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
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
  segmentedButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
    borderWidth: 1.5,
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
