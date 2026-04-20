import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  DeviceEventEmitter,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import axios from 'axios';
import Animated, { FadeInUp, FadeIn, FadeOut } from 'react-native-reanimated';


import { Colors, getBackgroundGradient, BACKGROUND_GRADIENT_DARK } from '@/constants/theme';
import { useAuth } from '@/hooks/use-auth';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { analyticsService } from '@/services/analytics.service';
import { categoryService } from '@/services/category.service';
import { routineService } from '@/services/routine.service';
import { Category } from '@/types/category';
import { getRoutineFormStyles } from '.././routine-form-styles';

interface CreateRoutineModalProps {
  readonly onClose?: () => void;
  readonly onCreated?: () => void;
  readonly initialRoutineListId?: number;
  readonly initialTitle?: string;
  readonly initialCategoryId?: number;
  readonly isCollaborativeMode?: boolean;
}

type FormErrors = {
  category?: string;
  routineListTitle?: string;
  newCategoryName?: string;
};

export function CreateRoutineModal({
  onClose,
  onCreated,
  initialRoutineListId,
  initialTitle,
  initialCategoryId,
  isCollaborativeMode = false,
}: CreateRoutineModalProps): React.ReactElement {
  const router = useRouter();
  const { token } = useAuth();
  const theme = useColorScheme() ?? 'light';
  const colors = Colors[theme];
  const isDark = theme === 'dark';
  const styles = useMemo(() => getRoutineFormStyles(theme), [theme]);
  
  const isEditMode = !!initialRoutineListId;

  const screenColors =
    isDark
      ? BACKGROUND_GRADIENT_DARK
      : isCollaborativeMode
        ? colors.collaborativeGradient
        : getBackgroundGradient(theme);

  // --- States ---
  const [categories, setCategories] = useState<Category[]>([]);
  const [loadingCategories, setLoadingCategories] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);
  const [catOpen, setCatOpen] = useState<boolean>(false);
  const [category, setCategory] = useState<number | null>(null);
  const [errors, setErrors] = useState<FormErrors>({});
  const [routineListTitle, setRoutineListTitle] = useState<string>('');
  const [showNewCategoryInput, setShowNewCategoryInput] = useState<boolean>(false);
  const [newCategoryName, setNewCategoryName] = useState<string>('');
  const [titleFocused, setTitleFocused] = useState<boolean>(false);

  // --- Handlers ---
  const handleClose = (): void => {
    if (onClose) {
      onClose();
    } else {
      router.back();
    }
  };

  const fetchCategories = useCallback(async (): Promise<void> => {
    try {
      const type = isCollaborativeMode ? 'collaborative' : 'personal';
      const data = await categoryService.getCategories(type, token || undefined);
      setCategories(data);
    } catch (e) {
      console.error('Categories fetch failed', e);
    } finally {
      setLoadingCategories(false);
    }
  }, [isCollaborativeMode, token]);

  // --- Effects ---
  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  useEffect(() => {
    if (initialRoutineListId) {
      if (initialTitle) {
        setRoutineListTitle(initialTitle);
      }
      if (initialCategoryId) {
        setCategory(Number(initialCategoryId));
      }
    }
  }, [initialRoutineListId, initialTitle, initialCategoryId]);

  const categoryItems = useMemo(() => {
    return (categories ?? [])
      .map((c: Category) => ({
        label: String(c?.name ?? ''),
        value: Number(c.categoryId),
      }))
      .filter((x) => x.label && Number.isFinite(x.value));
  }, [categories]);

  const handleCreateCategory = async (): Promise<void> => {
    if (!newCategoryName.trim()) {
      setErrors((prev) => ({ ...prev, newCategoryName: 'Please enter a category name.' }));
      return;
    }

    try {
      const type = isCollaborativeMode ? 'collaborative' : 'personal';
      const created = await categoryService.createCategory(newCategoryName.trim(), type, token || undefined);

      setCategories((prev) => [...prev, created]);
      setCategory(Number(created.categoryId));
      setNewCategoryName('');
      setErrors((prev) => ({ ...prev, newCategoryName: undefined, category: undefined }));
      setShowNewCategoryInput(false);
    } catch (e: unknown) {
      console.error('Create category failed', e);
      let msg = 'Failed to create category';
      if (axios.isAxiosError(e)) {
        msg = e.response?.data?.message || msg;
      }
      Alert.alert('Error', msg);
    }
  };

  const handleDeleteCategory = async (): Promise<void> => {
    if (category === null) {
      Alert.alert('Error', 'Please select a category to delete.');
      return;
    }

    const targetId = Number(category);
    const catToDelete = categories.find((c) => Number(c.categoryId) === targetId);

    if (!catToDelete) {
      Alert.alert('Error', 'Selected category not found.');
      return;
    }

    Alert.alert(
      'Delete Category',
      `Are you sure you want to delete "${catToDelete.name}"? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setIsDeleting(true);
            try {
              await categoryService.deleteCategory(targetId, token || '');
              setCategories((prev) => prev.filter((c) => Number(c.categoryId) !== targetId));
              setCategory(null);
              Alert.alert('Success', 'Category deleted successfully.');
            } catch (error: unknown) {
              let errorMsg = 'Unknown error occurred.';
              if (axios.isAxiosError(error)) {
                errorMsg = error.response?.data?.message || errorMsg;
              } else if (error instanceof Error) {
                errorMsg = error.message;
              }
              Alert.alert('Error', `Failed to delete category: ${errorMsg}`);
            } finally {
              setIsDeleting(false);
            }
          },
        },
      ],
    );
  };

  const validateForm = (): boolean => {
    const nextErrors: FormErrors = {};
    if (!category) {
      nextErrors.category = 'Please select a category.';
    }
    if (!routineListTitle.trim()) {
      nextErrors.routineListTitle = 'Please enter a list title.';
    }

    if (Object.keys(nextErrors).length > 0) {
      analyticsService.logEvent('Validation Error', `Routine creation failed: ${Object.keys(nextErrors).join(', ')}`, 'minor');
    }

    setErrors((prev) => ({ ...prev, ...nextErrors }));
    return Object.keys(nextErrors).length === 0;
  };

  const handleSave = async (): Promise<void> => {
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    try {
      if (initialRoutineListId) {
        await routineService.updateRoutineList(
          initialRoutineListId,
          routineListTitle.trim(),
          Number(category),
          token || '',
        );

        DeviceEventEmitter.emit('SHOW_TOAST', 'List updated successfully!');
      } else {
        await routineService.createRoutineList(
          Number(category),
          routineListTitle.trim(),
        );

        DeviceEventEmitter.emit('SHOW_TOAST', 'Routine list created successfully!');
      }
      
      DeviceEventEmitter.emit('refreshPersonalRoutines');
      if (onCreated) {
        onCreated();
      }
      handleClose();
    } catch (err: unknown) {
      let msg = isEditMode ? 'Failed to update list' : 'Failed to create routine list';
      if (axios.isAxiosError(err)) {
        const remoteMsg = err.response?.data?.message;
        msg = Array.isArray(remoteMsg) ? remoteMsg.join('\n') : (remoteMsg ?? msg);
      }
      Alert.alert('Error', msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const dropDownStyle = {
    backgroundColor: colors.card,
    borderColor: catOpen ? colors.primary : colors.border,
    borderRadius: 12,
    minHeight: 50,
  };

  return (
    <Modal visible={true} transparent animationType="none" onRequestClose={handleClose}>
      <Animated.View entering={FadeIn.duration(300)} exiting={FadeOut.duration(300)} style={[styles.screen, { backgroundColor: 'rgba(0, 0, 0, 0.6)' }]}>
        <TouchableOpacity style={{ position: 'absolute', top: 0, bottom: 0, left: 0, right: 0 }} activeOpacity={1} onPress={handleClose} />
          <Animated.View entering={FadeInUp.duration(350)} style={styles.outerWrapper} pointerEvents="box-none">
        <View style={[styles.sheet, { overflow: 'visible' }]}>
          <ScrollView
            contentContainerStyle={styles.content}
            nestedScrollEnabled
            keyboardShouldPersistTaps="handled"
            scrollEnabled={!catOpen}
          >
            <View style={styles.headerRow}>
              <Text style={styles.title}>
                {isEditMode ? 'Edit List' : 'Create Routine List'}
              </Text>
              <View style={styles.headerButtons}>
                <TouchableOpacity onPress={handleClose} hitSlop={12}>
                  <Ionicons name="close" size={30} color={colors.text} />
                </TouchableOpacity>
              </View>
            </View>

            {/* Category Header */}
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 10, marginBottom: 12 }}>
               <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                 <View style={{ width: 32, height: 32, borderRadius: 10, backgroundColor: '#8B5CF620', alignItems: 'center', justifyContent: 'center' }}>
                   <Ionicons name="folder-open" size={16} color="#8B5CF6" />
                 </View>
                 <Text style={{ fontSize: 13, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 1.5, color: isDark ? 'rgba(255,255,255,0.5)' : '#8B5CF6' }}>Category</Text>
               </View>
               <View style={{ flexDirection: 'row', gap: 10 }}>
                  {category !== null && (
                    <TouchableOpacity onPress={handleDeleteCategory} disabled={isDeleting} style={{ width: 34, height: 34, borderRadius: 17, backgroundColor: isDark ? 'rgba(239, 68, 68, 0.2)' : 'rgba(239, 68, 68, 0.1)', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(239,68,68,0.2)' }}>
                       {isDeleting ? <ActivityIndicator size="small" color={colors.error} /> : <Ionicons name="trash-outline" size={16} color={colors.error} />}
                    </TouchableOpacity>
                  )}
                  <TouchableOpacity onPress={() => setShowNewCategoryInput(!showNewCategoryInput)} style={{ width: 34, height: 34, borderRadius: 17, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center', shadowColor: colors.primary, shadowOpacity: 0.3, shadowRadius: 5, shadowOffset: { width:0, height:2 }, elevation: 3 }}>
                     <Ionicons name="add" size={20} color="#fff" />
                  </TouchableOpacity>
               </View>
            </View>

            {/* Category Chips Horizontal */}
            {loadingCategories ? (
               <ActivityIndicator style={{ paddingVertical: 15 }} color={colors.primary} />
            ) : (
               <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10, paddingBottom: 5 }} style={{ marginBottom: 15, zIndex: 10 }}>
                 {categoryItems.map(item => {
                    const isSelected = category === item.value;
                    return (
                       <TouchableOpacity
                          key={item.value}
                          onPress={() => { setCategory(item.value); setErrors(prev => ({...prev, category: undefined})); }}
                          style={[
                            { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20, borderWidth: 1, borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)', backgroundColor: isDark ? 'rgba(255,255,255,0.02)' : colors.surface },
                            isSelected && { backgroundColor: '#8B5CF6', borderColor: '#8B5CF6', shadowColor: '#8B5CF6', shadowOpacity: 0.3, shadowRadius: 6, shadowOffset: { width: 0, height: 3 }, elevation: 4 }
                          ]}
                       >
                          <Text style={{ fontSize: 14, fontWeight: isSelected ? '700' : '500', color: isSelected ? '#fff' : colors.text }}>{item.label}</Text>
                       </TouchableOpacity>
                    );
                 })}
                 {categoryItems.length === 0 && (
                   <Text style={{ color: colors.icon, fontStyle: 'italic', paddingVertical: 10 }}>No categories available.</Text>
                 )}
               </ScrollView>
            )}
            {errors.category && <Text style={styles.errorText}>{errors.category}</Text>}

            {/* New Category Input */}
            {showNewCategoryInput && (
              <View style={styles.marginTopTen}>
                <View
                  style={[
                    styles.inputContainer,
                    {
                      flexDirection: 'row',
                      alignItems: 'center',
                      backgroundColor: colors.surface,
                      borderColor: colors.border,
                      borderWidth: 1.5,
                    },
                  ]}
                >
                  <TextInput
                    value={newCategoryName}
                    onChangeText={(value) => {
                      setNewCategoryName(value);
                      setErrors((prev) => ({ ...prev, newCategoryName: undefined }));
                    }}
                    placeholder="New Category Name"
                    placeholderTextColor={colors.icon}
                    style={[styles.textInput, { flex: 1, color: colors.text }]}
                  />
                  <TouchableOpacity onPress={handleCreateCategory} style={styles.paddingHorTwelve}>
                    <Text style={{ color: colors.primary, fontWeight: '800' }}>Save</Text>
                  </TouchableOpacity>
                </View>
                {errors.newCategoryName && (
                  <Text style={styles.errorText}>{errors.newCategoryName}</Text>
                )}
              </View>
            )}

            {/* Routine List Title */}
            <View style={styles.detailLabelRow}>
              <View style={[styles.iconBox, { backgroundColor: '#8B5CF620' }]}>
                <Ionicons name="text" size={16} color="#8B5CF6" />
              </View>
              <Text style={styles.sectionLabel}>List Title</Text>
            </View>
            <View
              style={[
                styles.inputContainer,
                {
                  borderColor: errors.routineListTitle
                    ? colors.error
                    : titleFocused
                    ? colors.primary
                    : colors.border,
                },
              ]}
            >
              <TextInput
                value={routineListTitle}
                onChangeText={(value) => {
                  setRoutineListTitle(value);
                  setErrors((prev) => ({ ...prev, routineListTitle: undefined }));
                }}
                placeholder="e.g. Morning Routine"
                placeholderTextColor={colors.icon}
                style={[styles.textInput, { color: colors.text }]}
                onFocus={() => setTitleFocused(true)}
                onBlur={() => setTitleFocused(false)}
              />
            </View>
            {errors.routineListTitle && (
              <Text style={styles.errorText}>{errors.routineListTitle}</Text>
            )}

            {/* Submit Button */}
            <TouchableOpacity
              style={[
                styles.createBtn,
                {
                  backgroundColor: isDark ? colors.secondary : colors.primary,
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 6 },
                  shadowOpacity: 0.2,
                  shadowRadius: 12,
                  elevation: 6,
                },
              ]}
              onPress={handleSave}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <ActivityIndicator color={colors.white} />
              ) : (
                <Text style={{ color: colors.white, fontWeight: '800', fontSize: 17, letterSpacing: 0.5 }}>
                  {isEditMode ? 'Update List' : 'Create Routine List'}
                </Text>
              )}
            </TouchableOpacity>
          </ScrollView>
        </View>
      </Animated.View>
    </Animated.View>
    </Modal>
  );
}
