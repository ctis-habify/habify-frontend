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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import axios from 'axios';
import DropDownPicker from 'react-native-dropdown-picker';

import { HomeButton } from '@/components/navigation/home-button';
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
    <LinearGradient colors={screenColors} style={styles.screen}>
      <View style={styles.outerWrapper}>
        <View style={[styles.sheet, { overflow: 'visible' }]}>
          <ScrollView
            contentContainerStyle={[styles.content, { paddingBottom: 60 }]}
            nestedScrollEnabled
            keyboardShouldPersistTaps="handled"
            scrollEnabled={!catOpen}
          >
            <View style={styles.headerRow}>
              <Text style={[styles.title, { color: colors.text }]}>
                {isEditMode ? 'Edit List' : 'Create Routine List'}
              </Text>
              <View style={styles.headerButtons}>
                <HomeButton color={colors.text} />
                <TouchableOpacity onPress={handleClose} hitSlop={12}>
                  <Ionicons name="close" size={30} color={colors.text} />
                </TouchableOpacity>
              </View>
            </View>

            {/* Category Section */}
            <Text style={[styles.sectionLabel, { color: colors.icon }]}>Category</Text>
            <View style={[styles.row, { zIndex: 9999, alignItems: 'center' }]}>
              <View style={styles.flexOneMarRight}>
                <DropDownPicker
                  open={catOpen}
                  value={category}
                  items={categoryItems}
                  setOpen={setCatOpen}
                  setValue={(callback) => {
                    setCategory((prev) => {
                      const nextValue = typeof callback === 'function' ? callback(prev) : callback;
                      setErrors((current) => ({ ...current, category: undefined }));
                      return nextValue;
                    });
                  }}
                  loading={loadingCategories}
                  placeholder="Select Category"
                  style={[
                    dropDownStyle,
                    errors.category ? { backgroundColor: colors.surface, borderColor: colors.error } : null,
                  ]}
                  textStyle={{ color: colors.text, fontSize: 16 }}
                  placeholderStyle={{ color: colors.icon }}
                  listMode="SCROLLVIEW"
                  dropDownContainerStyle={{
                    backgroundColor: colors.card,
                    borderColor: colors.primary,
                    borderRadius: 12,
                    elevation: 5,
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.2,
                    shadowRadius: 5,
                  }}
                  modalContentContainerStyle={{
                    backgroundColor: colors.background,
                  }}
                  searchPlaceholder="Search..."
                  searchable={true}
                  closeAfterSelecting={true}
                  theme={isDark ? 'DARK' : 'LIGHT'}
                  zIndex={5000}
                  zIndexInverse={1000}
                />
                {errors.category && (
                  <Text style={styles.errorText}>{errors.category}</Text>
                )}
              </View>

              <View style={styles.categoryActionButtons}>
                {category !== null && (
                  <TouchableOpacity
                    style={[
                      styles.addIconBtn,
                      {
                        width: 44,
                        height: 44,
                        borderRadius: 22,
                        backgroundColor: isDark ? 'rgba(239, 68, 68, 0.2)' : 'rgba(239, 68, 68, 0.1)',
                        borderWidth: 1,
                        borderColor: 'rgba(239, 68, 68, 0.2)',
                      },
                    ]}
                    onPress={handleDeleteCategory}
                    disabled={isDeleting}
                    hitSlop={15}
                  >
                    {isDeleting ? (
                      <ActivityIndicator size="small" color={colors.error} />
                    ) : (
                      <Ionicons name="trash-outline" size={24} color={colors.error} />
                    )}
                  </TouchableOpacity>
                )}

                <TouchableOpacity
                  style={[
                    styles.addIconBtn,
                    {
                      width: 44,
                      height: 44,
                      borderRadius: 22,
                      backgroundColor: isDark ? colors.secondary : colors.primary,
                      shadowColor: '#000',
                      shadowOffset: { width: 0, height: 4 },
                      shadowOpacity: 0.2,
                      shadowRadius: 8,
                      elevation: 4,
                    },
                  ]}
                  onPress={() => setShowNewCategoryInput((prev) => !prev)}
                  hitSlop={10}
                >
                  <Ionicons name="add" size={24} color={colors.white} />
                </TouchableOpacity>
              </View>
            </View>

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
            <Text style={[styles.sectionLabel, { marginTop: 24, color: colors.icon }]}>List Title</Text>
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
                  marginTop: 48,
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
      </View>
    </LinearGradient>
  );
}
