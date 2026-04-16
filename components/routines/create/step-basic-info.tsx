import { Colors } from '@/constants/theme';
import { useAuth } from '@/hooks/use-auth';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { categoryService } from '@/services/category.service';
import type { Category } from '@/types/category';
import type { CreateRoutineFormState } from '@/types/create-routine';
import React, { useMemo, useState } from 'react';
import { Alert, StyleSheet, Switch, Text, TextInput, TouchableOpacity, View } from 'react-native';
import DropDownPicker from 'react-native-dropdown-picker';
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
  
  const [categoryOpen, setCategoryOpen] = useState(false);
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
      <View style={[styles.fieldContainer, { zIndex: 2000 }]}>
        <View style={styles.rowBetween}>
          <Text style={[styles.label, { marginBottom: 0, color: colors.text }]}>Category</Text>
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <TouchableOpacity onPress={handleDeleteCategory} disabled={!formState.categoryId}>
                <Text style={{ color: formState.categoryId ? colors.error : colors.icon, fontSize: 13, fontWeight: '600', opacity: formState.categoryId ? 1 : 0.5 }}>Delete</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setShowNewCategory(!showNewCategory)}>
                <Text style={{ color: colors.collaborativePrimary, fontSize: 13, fontWeight: '600' }}>+ New Category</Text>
              </TouchableOpacity>
          </View>
        </View>
        
        {/* New Category Input Overlay */}
        {showNewCategory && (
          <View style={{ marginBottom: 15, flexDirection: 'row', gap: 10 }}>
            <TextInput 
              style={[...inputStyle, { flex: 1, padding: 12 }]}
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
                <Text style={{ color: colors.white, fontWeight: 'bold' }}>Save</Text>
              </TouchableOpacity>
          </View>
        )}

        <DropDownPicker
          open={categoryOpen}
          value={formState.categoryId}
          items={categoryItems}
          setOpen={setCategoryOpen}
          setValue={(callback) => {
            if (typeof callback === 'function') {
              const newValue = callback(formState.categoryId);
              updateForm({ categoryId: newValue as number | null });
            } else {
              updateForm({ categoryId: callback as number | null });
            }
          }}
          onChangeValue={(value) => {
            updateForm({ categoryId: value });
          }}
          theme={isDark ? "DARK" : "LIGHT"}
          style={[styles.dropdown, { backgroundColor: colors.surface, borderColor: colors.border }]}
          dropDownContainerStyle={[styles.dropdownContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}
          listItemLabelStyle={{ color: colors.text }}
          selectedItemLabelStyle={{ color: colors.collaborativePrimary, fontWeight: 'bold' }}
          placeholder={loadingCategories ? "Loading categories..." : "Select a category"}
          placeholderStyle={{ color: colors.icon, opacity: 0.6 }}
          textStyle={{ color: colors.text, fontSize: 15 }}
          labelStyle={{ fontWeight: '600' }}
          arrowIconStyle={{ width: 20, height: 20, tintColor: colors.icon }}
          tickIconStyle={{ width: 20, height: 20, tintColor: colors.collaborativePrimary }}
          listMode="SCROLLVIEW"
          zIndex={3000}
          zIndexInverse={1000}
          searchable={true}
          searchPlaceholder="Search category..."
          searchContainerStyle={{ borderBottomColor: colors.border, paddingVertical: 10 }}
          searchTextInputStyle={{ 
            color: colors.text, 
            borderColor: colors.border,
            backgroundColor: colors.background
          }}
        />
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
