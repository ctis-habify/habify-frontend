import { useAuth } from '@/hooks/use-auth';
import { categoryService } from '@/services/category.service';
import type { CreateRoutineFormState } from '@/types/create-routine';
import React, { useState } from 'react';
import { Alert, StyleSheet, Switch, Text, TextInput, TouchableOpacity, View } from 'react-native';
import DropDownPicker from 'react-native-dropdown-picker';
import Animated, { SlideInRight, SlideOutLeft } from 'react-native-reanimated';

const ACCENT_COLOR = '#E879F9';
const INPUT_BG = 'rgba(0,0,0,0.2)';

interface Props {
  formState: CreateRoutineFormState;
  updateForm: (updates: Partial<CreateRoutineFormState>) => void;
  categories: any[];
  loadCategories: () => Promise<void>;
  loadingCategories: boolean;
}

export function StepBasicInfo({ formState, updateForm, categories, loadCategories, loadingCategories }: Props) {
  const { token } = useAuth();
  const [categoryOpen, setCategoryOpen] = useState(false);
  const [showNewCategory, setShowNewCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');

  const categoryItems = categories.map(c => ({ label: c.name, value: c.categoryId ?? c.id }));

  const handleCreateCategory = async () => {
    if (!newCategoryName.trim()) return;
    try {
      await categoryService.createCategory(newCategoryName.trim(), 'collaborative');
      setNewCategoryName('');
      setShowNewCategory(false);
      await loadCategories();
    } catch (e) {
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
          updateForm({ categoryId: null });
          await loadCategories();
        } catch (e) {
          Alert.alert("Error", "Failed to delete category");
        }
      }}
    ]);
  };

  return (
    <Animated.View exiting={SlideOutLeft} entering={SlideInRight} style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Let's get started</Text>
      <Text style={styles.stepSub}>Define the basics of your group routine.</Text>

      {/* Category Selection */}
      <View style={[styles.fieldContainer, { zIndex: 2000 }]}>
        <View style={styles.rowBetween}>
          <Text style={[styles.label, { marginBottom: 0 }]}>Category</Text>
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <TouchableOpacity onPress={handleDeleteCategory} disabled={!formState.categoryId}>
                <Text style={{ color: formState.categoryId ? '#ef4444' : 'rgba(255,255,255,0.3)', fontSize: 13, fontWeight: '600' }}>Delete</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setShowNewCategory(!showNewCategory)}>
                <Text style={{ color: ACCENT_COLOR, fontSize: 13, fontWeight: '600' }}>+ New Category</Text>
              </TouchableOpacity>
          </View>
        </View>
        
        {/* New Category Input Overlay */}
        {showNewCategory && (
          <View style={{ marginBottom: 15, flexDirection: 'row', gap: 10 }}>
            <TextInput 
              style={[styles.input, { flex: 1, padding: 12 }]}
              placeholder="New Category Name"
              placeholderTextColor="rgba(255,255,255,0.4)"
              value={newCategoryName}
              onChangeText={setNewCategoryName}
              autoFocus
            />
              <TouchableOpacity 
              onPress={handleCreateCategory}
              style={{ backgroundColor: ACCENT_COLOR, borderRadius: 12, justifyContent: 'center', paddingHorizontal: 20 }}
              >
                <Text style={{ color: '#000', fontWeight: 'bold' }}>Save</Text>
              </TouchableOpacity>
          </View>
        )}

        <DropDownPicker
          open={categoryOpen}
          value={formState.categoryId}
          items={categoryItems}
          setOpen={setCategoryOpen}
          setValue={(valFn) => {
             // DropDownPicker accepts a value or a function receiving the current value
             const val = valFn instanceof Function ? valFn(formState.categoryId) : valFn;
             updateForm({ categoryId: val });
          }}
          theme="DARK"
          style={styles.dropdown}
          dropDownContainerStyle={styles.dropdownContainer}
          placeholder={loadingCategories ? "Loading categories..." : "Select a category"}
          placeholderStyle={{ color: 'rgba(255,255,255,0.5)' }}
          textStyle={{ color: '#fff', fontSize: 15 }}
          labelStyle={{ fontWeight: '600' }}
          arrowIconStyle={{ width: 20, height: 20 }}
          tickIconStyle={{ width: 20, height: 20 }}
          listMode="SCROLLVIEW"
          searchable={true}
          searchPlaceholder="Search category..."
          searchContainerStyle={{ borderBottomColor: 'rgba(255,255,255,0.1)', paddingVertical: 10 }}
          searchTextInputStyle={{ 
            color: '#fff', 
            borderColor: 'rgba(255,255,255,0.1)',
            backgroundColor: 'rgba(255,255,255,0.05)'
          }}
        />
      </View>

      {/* Name */}
      <View style={styles.fieldContainer}>
        <Text style={styles.label}>Routine Name</Text>
        <TextInput 
          style={styles.input}
          placeholder="e.g. Morning Yoga"
          placeholderTextColor="rgba(255,255,255,0.4)"
          value={formState.routineName}
          onChangeText={(text) => updateForm({ routineName: text })}
        />
      </View>

      {/* Description */}
      <View style={styles.fieldContainer}>
        <Text style={styles.label}>Description & Rules</Text>
        <TextInput 
          style={[styles.input, { height: 80, textAlignVertical: 'top' }]}
          placeholder="Tell participants what they need to do..."
          placeholderTextColor="rgba(255,255,255,0.4)"
          value={formState.description}
          onChangeText={(text) => updateForm({ description: text })}
          multiline
        />
      </View>

      {/* Privacy */}
      <View style={styles.rowBetween}>
        <View>
          <Text style={styles.label}>Public Routine</Text>
          <Text style={styles.subLabel}>{formState.isPublic ? 'Anyone can find and join' : 'Invite only'}</Text>
        </View>
        <Switch 
          value={formState.isPublic}
          onValueChange={(val) => updateForm({ isPublic: val })}
          trackColor={{ false: '#555', true: ACCENT_COLOR }}
          thumbColor="#fff"
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
});
