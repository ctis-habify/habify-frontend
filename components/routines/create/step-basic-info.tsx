import { Colors } from '@/constants/theme';
import { useAuth } from '@/hooks/use-auth';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { categoryService } from '@/services/category.service';
import type { Category } from '@/types/category';
import type { CreateRoutineFormState } from '@/types/create-routine';
import { Ionicons } from '@expo/vector-icons';
import React, { useMemo, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Switch, Text, TextInput, TouchableOpacity, View } from 'react-native';
import Animated, { SlideInRight, SlideOutLeft } from 'react-native-reanimated';

interface Props {
  formState: CreateRoutineFormState;
  updateForm: (updates: Partial<CreateRoutineFormState>) => void;
  categories: Category[];
  loadCategories: () => Promise<void>;
  loadingCategories: boolean;
}

export function StepBasicInfo({ formState, updateForm, categories, loadCategories, loadingCategories }: Props) {
  const { token } = useAuth();
  const theme = useColorScheme() ?? 'light';
  const isDark = theme === 'dark';
  const colors = Colors[theme];
  
  const [showNewCategory, setShowNewCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');

  const categoryItems = useMemo(() => categories.map(c => ({ label: c.name, value: c.categoryId })), [categories]);

  const handleCreateCategory = async () => {
    if (!newCategoryName.trim()) return;
    try {
      await categoryService.createCategory(newCategoryName.trim(), 'collaborative');
      setNewCategoryName('');
      await loadCategories();
    } catch {
      Alert.alert("Error", "Failed to create category");
    }
  };

  const handleDeleteCategory = async () => {
    if (!formState.categoryId) return;
    Alert.alert("Delete", "Delete this category?", [
      { text: "Cancel" },
      { text: "Delete", style: 'destructive', onPress: async () => {
        try {
          await categoryService.deleteCategory(formState.categoryId!, token || '');
          await loadCategories();
        } catch {
          Alert.alert("Error", "Failed to delete category");
        }
      }}
    ]);
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
      <Text style={[styles.stepTitle, { color: colors.text }]}>Let's get started</Text>
      <Text style={[styles.stepSub, { color: colors.text, opacity: 0.7 }]}>Define the basics of your group routine.</Text>

      {/* Category Selection */}
      <View style={[styles.fieldContainer, { marginBottom: 16 }]}>
        <View style={styles.rowBetween}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <View style={{ width: 32, height: 32, borderRadius: 10, backgroundColor: colors.collaborativePrimary + '20', alignItems: 'center', justifyContent: 'center' }}>
              <Ionicons name="folder-open" size={16} color={colors.collaborativePrimary} />
            </View>
            <Text style={[styles.label, { marginBottom: 0, color: colors.text }]}>Category</Text>
          </View>
          <View style={{ flexDirection: 'row', gap: 12 }}>
              {formState.categoryId && (
                <TouchableOpacity onPress={handleDeleteCategory} style={{ width: 34, height: 34, borderRadius: 17, backgroundColor: colors.error + '15', alignItems: 'center', justifyContent: 'center' }}>
                   <Ionicons name="trash-outline" size={16} color={colors.error} />
                </TouchableOpacity>
              )}
              <TouchableOpacity 
                onPress={() => setShowNewCategory(!showNewCategory)} 
                  style={{ 
                    width: 34, 
                    height: 34, 
                    borderRadius: 17, 
                    backgroundColor: colors.collaborativePrimary, 
                    alignItems: 'center', 
                    justifyContent: 'center', 
                  }}
                >
                 <Ionicons name="add" size={20} color="#fff" />
              </TouchableOpacity>
          </View>
        </View>
        
        {/* New Category Input Wrap */}
        {showNewCategory && (
          <View style={{ marginBottom: 15, flexDirection: 'row', gap: 10, height: 52 }}>
            <TextInput 
              style={[...inputStyle, { flex: 1, paddingHorizontal: 16 }]}
              placeholder="New Category Name"
              placeholderTextColor={colors.icon}
              value={newCategoryName}
              onChangeText={setNewCategoryName}
              autoFocus
            />
            <TouchableOpacity 
              onPress={handleCreateCategory}
              style={{ backgroundColor: colors.collaborativePrimary, borderRadius: 12, justifyContent: 'center', paddingHorizontal: 20 }}
            >
              <Text style={{ color: colors.white, fontWeight: '800' }}>Add</Text>
            </TouchableOpacity>
          </View>
        )}

        {loadingCategories ? (
           <ActivityIndicator style={{ paddingVertical: 20 }} color={colors.collaborativePrimary} />
        ) : (
           <ScrollView 
             horizontal 
             showsHorizontalScrollIndicator={false} 
             contentContainerStyle={{ 
               gap: 10, 
               paddingHorizontal: 2, 
               paddingVertical: 1, 
             }}
           >
             {categories.map(c => {
               const isSelected = formState.categoryId === c.categoryId;
               return (
                 <TouchableOpacity
                   key={c.categoryId}
                   onPress={() => updateForm({ categoryId: c.categoryId })}
                   style={[
                    { paddingHorizontal: 18, paddingVertical: 12, borderRadius: 20, borderWidth: 1, borderColor: colors.border, backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : colors.surface },
                    isSelected && { 
                      backgroundColor: colors.collaborativePrimary, 
                      borderColor: colors.collaborativePrimary, 
                    }
                  ]}
                 >
                   <Text style={{ fontSize: 14, fontWeight: isSelected ? '700' : '500', color: isSelected ? '#fff' : colors.text }}>{c.name}</Text>
                 </TouchableOpacity>
               );
             })}
             {categories.length === 0 && (
               <Text style={{ color: colors.icon, fontStyle: 'italic', paddingVertical: 10 }}>No categories found.</Text>
             )}
           </ScrollView>
        )}
      </View>

      {/* Name */}
      <View style={styles.fieldContainer}>
        <Text style={[styles.label, { color: colors.text }]}>Routine Name</Text>
        <TextInput 
          style={inputStyle}
          placeholder="e.g. Morning Yoga"
          placeholderTextColor={colors.icon}
          value={formState.routineName}
          onChangeText={(text) => updateForm({ routineName: text })}
        />
      </View>

      {/* Description */}
      <View style={styles.fieldContainer}>
        <Text style={[styles.label, { color: colors.text }]}>Description & Rules</Text>
        <TextInput 
          style={[...inputStyle, { height: 80, textAlignVertical: 'top' }]}
          placeholder="Tell participants what they need to do..."
          placeholderTextColor={colors.icon}
          value={formState.description}
          onChangeText={(text) => updateForm({ description: text })}
          multiline
        />
      </View>

      {/* Privacy */}
      <View style={styles.rowBetween}>
        <View>
          <Text style={[styles.label, { color: colors.text }]}>Public Routine</Text>
          <Text style={[styles.subLabel, { color: colors.text, opacity: 0.5 }]}>{formState.isPublic ? 'Anyone can find and join' : 'Invite only'}</Text>
        </View>
        <Switch 
          value={formState.isPublic}
          onValueChange={(val) => updateForm({ isPublic: val })}
          trackColor={{ false: colors.border, true: colors.collaborativePrimary }}
          thumbColor={colors.white}
        />
      </View>
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
  dropdown: {
    borderRadius: 16,
    paddingHorizontal: 16,
  },
  dropdownContainer: {
    borderRadius: 16,
    marginTop: 8,
  },
  input: {
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    borderWidth: 1,
  },
  rowBetween: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24,
  },
});
