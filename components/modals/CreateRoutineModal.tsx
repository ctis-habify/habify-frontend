import { categoryService } from '@/services/category.service';
import { routineService } from '@/services/routine.service';
import { Category } from '@/types/category';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import DropDownPicker from 'react-native-dropdown-picker';
import { BACKGROUND_GRADIENT } from '../../app/theme';
import { routineFormStyles } from '.././routine-form-styles';

interface CreateRoutineModalProps {
  onClose?: () => void;
}

export default function CreateRoutineModal({ onClose }: CreateRoutineModalProps) {
  const router = useRouter();

  // --- Category dropdown states ---
  const [categories, setCategories] = useState<Category[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [catOpen, setCatOpen] = useState(false);

  // --- Form states ---
  const [category, setCategory] = useState<number | null>(null);

  // Routine List Title
  const [routineListTitle, setRoutineListTitle] = useState('');

  // Routine Name
  const [routineName, setRoutineName] = useState('');

  // Yeni kategori oluşturma UI
  const [showNewCategoryInput, setShowNewCategoryInput] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');

  const handleClose = () => (onClose ? onClose() : router.back());

  // Dropdown açıldığında diğerlerini kapatma
  const onCatOpen = useCallback(() => {}, []);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const data = await categoryService.getCategories();
        setCategories(data);
      } catch (e) {
        console.error('Categories fetch failed', e);
      } finally {
        setLoadingCategories(false);
      }
      const data = await categoryService.getCategories();
      console.log('CATEGORIES:', data);
      setCategories(data);
    };
    fetchCategories();
  }, []);

  const categoryItems = useMemo(() => {
    return (categories ?? [])
      .map((c: any) => ({
        label: String(c?.name ?? ''),
        value: Number(c?.categoryId ?? c?.id),
      }))
      .filter((x) => x.label && Number.isFinite(x.value));
  }, [categories]);

  // Yeni kategori oluşturma
  const handleCreateCategory = async () => {
    if (!newCategoryName.trim()) {
      Alert.alert('Warning', 'Please enter a category name.');
      return;
    }

    try {
      const created = await categoryService.createCategory(newCategoryName.trim());
      setCategories((prev) => [...prev, created]);
      setCategory(created.categoryId);
      setNewCategoryName('');
      setShowNewCategoryInput(false);
    } catch (e: any) {
      console.error('Create category failed', e.response?.data || e);
      Alert.alert('Error', e.response?.data?.message || 'Failed to create category');
    }
  };

  const validateForm = () => {
    const errors: string[] = [];
    if (!category) errors.push('Please select a category.');
    if (!routineListTitle.trim()) errors.push('Please enter a routine list title.');

    if (errors.length) {
      Alert.alert('Warning', errors.join('\n'));
      return false;
    }
    return true;
  };

  const handleCreate = async () => {
    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      //routine list oluştur (category + title)
      const routineList = await routineService.createRoutineList(
        Number(category),
        routineListTitle.trim(),
      );

      // routine oluştur (gizli default değerlerle)
      // Backend DTO'nun zorunlulukları için default atıyoruz
      console.log('CreateRoutineList response:', routineList);

      Alert.alert('Success', 'Routine list created successfully!', [
        { text: 'OK', onPress: handleClose },
      ]);
    } catch (err: any) {
      if (axios.isAxiosError(err)) {
        console.log('Create routine/list failed STATUS:', err.response?.status);
        console.log(
          'Create routine/list failed DATA:',
          JSON.stringify(err.response?.data, null, 2),
        );
        const msg = err.response?.data?.message;
        Alert.alert(
          'Error',
          Array.isArray(msg) ? msg.join('\n') : (msg ?? 'Failed to create routine list'),
        );
      } else {
        console.log('Create routine/list failed UNKNOWN:', err);
        Alert.alert('Error', 'Unexpected error while creating routine list');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const dropDownStyle = {
    backgroundColor: '#2196F3',
    borderColor: 'transparent',
    borderRadius: 8,
    minHeight: 50,
  };

  return (
    <LinearGradient colors={BACKGROUND_GRADIENT as any} style={routineFormStyles.screen}>
      <View style={routineFormStyles.outerWrapper}>
        <View style={[routineFormStyles.sheet, { overflow: 'visible' }]}>
          <ScrollView
            contentContainerStyle={[routineFormStyles.content, { paddingBottom: 60 }]}
            nestedScrollEnabled
            keyboardShouldPersistTaps="handled"
            scrollEnabled={!catOpen}
          >
            <View style={routineFormStyles.headerRow}>
              <Text style={routineFormStyles.title}>Create Routine List</Text>
              <TouchableOpacity onPress={handleClose}>
                <Ionicons name="close" size={30} color="#111827" />
              </TouchableOpacity>
            </View>

            {/* Category */}
            <Text style={routineFormStyles.sectionLabel}>Category</Text>
            <View style={[routineFormStyles.row, { zIndex: 9999, alignItems: 'center' }]}>
              <View style={{ flex: 1, marginRight: 10 }}>
                <DropDownPicker
                  open={catOpen}
                  value={category}
                  items={categoryItems}
                  setOpen={setCatOpen}
                  setValue={setCategory}
                  onOpen={onCatOpen}
                  loading={loadingCategories}
                  placeholder="Select Category"
                  style={dropDownStyle}
                  textStyle={{ color: '#fff', fontSize: 16 }}
                  placeholderStyle={{ color: '#ffffffcc' }}
                  listMode="SCROLLVIEW"
                  dropDownDirection="BOTTOM"
                  dropDownContainerStyle={{
                    backgroundColor: '#2196F3',
                    borderColor: '#1E88E5',
                    zIndex: 9999,
                  }}
                  modalTitle="Select Category"
                  modalAnimationType="slide"
                  searchPlaceholder="Search..."
                  searchable={true}
                  closeAfterSelecting={true}
                />
              </View>

              {/* Add Category Button */}
              <TouchableOpacity
                style={[routineFormStyles.addIconBtn, { width: 44, height: 44, borderRadius: 22 }]}
                onPress={() => setShowNewCategoryInput((prev) => !prev)}
              >
                <Ionicons name="add" size={24} color="#ffffff" />
              </TouchableOpacity>
            </View>

            {/* New Category Input */}
            {showNewCategoryInput && (
              <View style={{ marginTop: 10 }}>
                <View
                  style={[
                    routineFormStyles.inputContainer,
                    { backgroundColor: '#2196F3', flexDirection: 'row', alignItems: 'center' },
                  ]}
                >
                  <TextInput
                    value={newCategoryName}
                    onChangeText={setNewCategoryName}
                    placeholder="New category name"
                    placeholderTextColor="#ffffffcc"
                    style={[routineFormStyles.textInput, { color: '#fff', flex: 1 }]}
                  />
                  <TouchableOpacity onPress={handleCreateCategory} style={{ paddingHorizontal: 8 }}>
                    <Text style={{ color: '#fff', fontWeight: '600' }}>Save</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {/* Routine List Title */}
            <Text style={[routineFormStyles.sectionLabel, { marginTop: 20 }]}>Routine List</Text>
            <View style={[routineFormStyles.inputContainer, { backgroundColor: '#2196F3' }]}>
              <TextInput
                value={routineListTitle}
                onChangeText={setRoutineListTitle}
                placeholder="Enter routine list title"
                placeholderTextColor="#ffffffcc"
                style={[routineFormStyles.textInput, { color: '#fff' }]}
              />
            </View>

            {/* Create Button */}
            <TouchableOpacity
              style={[routineFormStyles.createBtn, { marginTop: 40, backgroundColor: '#111827' }]}
              onPress={handleCreate}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 16 }}>
                  Create Routine List
                </Text>
              )}
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </LinearGradient>
  );
}
