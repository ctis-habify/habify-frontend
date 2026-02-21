import { Colors } from '@/constants/theme';
import { useAuth } from '@/hooks/use-auth';
import { useColorScheme } from '@/hooks/use-color-scheme';
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
  DeviceEventEmitter,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import DropDownPicker from 'react-native-dropdown-picker';
import { getBackgroundGradient } from '../../app/theme';
import { getRoutineFormStyles } from '.././routine-form-styles';
import { AnimatedToggle } from '../ui/animated-toggle';

interface CreateRoutineModalProps {
  onClose?: () => void;
  onCreated?: () => void;
  initialRoutineListId?: number;
  initialTitle?: string;
  initialCategoryId?: number;
  isCollaborativeMode?: boolean;
}

export function CreateRoutineModal({ 
  onClose, 
  onCreated,
  initialRoutineListId, 
  initialTitle, 
  initialCategoryId,
  isCollaborativeMode = false
}: CreateRoutineModalProps): React.ReactElement {
  const router = useRouter();
  const { token } = useAuth();
  const theme = useColorScheme() ?? 'light';
  const colors = Colors[theme];
  const styles = useMemo(() => getRoutineFormStyles(theme), [theme]);

  const isEditMode = !!initialRoutineListId;

  // --- Category dropdown states ---
  const [categories, setCategories] = useState<Category[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const [catOpen, setCatOpen] = useState(false);

  // --- Form states ---
  const [category, setCategory] = useState<number | null>(null);
  
  // Collaborative State
  const [isCollaborative, setIsCollaborative] = useState(isCollaborativeMode);

  useEffect(() => {
      setIsCollaborative(isCollaborativeMode);
  }, [isCollaborativeMode]);

  // Routine List Title
  const [routineListTitle, setRoutineListTitle] = useState("");
  const [showNewCategoryInput, setShowNewCategoryInput] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');

  const handleClose = () => (onClose ? onClose() : router.back());
  const onCatOpen = useCallback(() => { }, []);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const type = isCollaborativeMode ? 'collaborative' : 'personal';
        const data = await categoryService.getCategories(type);
        setCategories(data);
      } catch (e) {
        console.error('Categories fetch failed', e);
      } finally {
        setLoadingCategories(false);
      }
    };
    fetchCategories();
  }, [isCollaborativeMode]);

  useEffect(() => {
    if (initialRoutineListId) {
      if (initialTitle) setRoutineListTitle(initialTitle);
      if (initialCategoryId) setCategory(Number(initialCategoryId));
    }
  }, [initialRoutineListId, initialTitle, initialCategoryId]);

  useEffect(() => {
    console.log("Current selected category ID:", category);
  }, [category]);

  const categoryItems = useMemo(() => {
    return (categories ?? [])
      .map((c: Category) => ({
        label: String(c?.name ?? ''),
        value: Number(c?.categoryId),
      }))
      .filter((x) => x.label && Number.isFinite(x.value));
  }, [categories]);

  const handleCreateCategory = async () => {
    if (!newCategoryName.trim()) {
      Alert.alert('Warning', 'Please enter a category name.');
      return;
    }

    try {
      const type = isCollaborativeMode ? 'collaborative' : 'personal';
      const created = await categoryService.createCategory(newCategoryName.trim(), type);
      console.log("Created Category Response:", created);
      const newId = created.categoryId ?? (created as any).id;
      setCategories((prev) => [...prev, created]);
      setCategory(Number(newId));
      setNewCategoryName('');
      setShowNewCategoryInput(false);
    } catch (e: unknown) {
      console.error('Create category failed', e);
      let msg = 'Failed to create category';
      if (typeof e === 'object' && e !== null && 'response' in e) {
        msg = (e as any).response?.data?.message || msg;
      }
      Alert.alert('Error', msg);
    }
  };

  const handleDeleteCategory = async () => {
    console.log("[DEBUG] Silme butonu basıldı. Kategori ID:", category);

    if (category === null || category === undefined) {
      Alert.alert("Error", "Please select a category to delete.");
      return;
    }

    const targetId = Number(category);

    const catToDelete = categories.find(c => {
      const cid = (c as any).categoryId ?? (c as any).id;
      return Number(cid) === targetId;
    });

    if (!catToDelete) {
      console.log("[DEBUG] Kategori listede bulunamadı. Liste:", categories);
      Alert.alert("Error", "Selected category not found.");
      return;
    }

    Alert.alert(
      "Delete Category",
      `Are you sure you want to delete "${catToDelete.name}"? This action cannot be undone.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            console.log("[DEBUG] Silme işlemi başlatılıyor. ID:", targetId);
            setIsDeleting(true);
            try {
              await categoryService.deleteCategory(targetId, token || '');

              setCategories(prev => prev.filter(c => {
                const cid = (c as any).categoryId ?? (c as any).id;
                return Number(cid) !== targetId;
              }));
              setCategory(null);

              Alert.alert("Success", "Category deleted successfully.");
            } catch (error: unknown) {
              console.error("[DEBUG] Silme Hatası Detayı:", error);
              let errorMsg = "Unknown error occurred.";
              if (typeof error === 'object' && error !== null && 'response' in error) {
                errorMsg = (error as any).response?.data?.message || errorMsg;
              } else if (error instanceof Error) {
                errorMsg = error.message;
              }

              Alert.alert(
                "Error",
                `Failed to delete category: ${errorMsg}\n\nNote: You cannot delete a category if it has routine lists.`
              );
            } finally {
              setIsDeleting(false);
            }
          }
        }
      ]
    );
  };

  const validateForm = () => {
    const errors: string[] = [];
    if (!category) errors.push('Please select a category.');
    if (!routineListTitle.trim()) errors.push('Please enter a list title.');

    if (errors.length) {
      Alert.alert('Warning', errors.join('\n'));
      return false;
    }
    return true;
  };

  const handleSave = async () => {
    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
        if (initialRoutineListId) {
          // UPDATE MODE
          await routineService.updateRoutineList(
            initialRoutineListId,
            routineListTitle.trim(),
            Number(category),
            token || ''
          );
          
          DeviceEventEmitter.emit('SHOW_TOAST', 'List updated successfully!');
          if (onCreated) onCreated();
          handleClose();
        } else {
        // CREATE MODE
        const routineList = await routineService.createRoutineList(
          Number(category),
          routineListTitle.trim(),
        );
        console.log('CreateRoutineList response:', routineList);

        DeviceEventEmitter.emit('SHOW_TOAST', 'Routine list created successfully!');
        
        if (onCreated) {
           onCreated();
        }
        
        handleClose();
      }
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        console.log('Create routine/list failed STATUS:', err.response?.status);
        console.log(
          'Create routine/list failed DATA:',
          JSON.stringify(err.response?.data, null, 2),
        );
        const msg = err.response?.data?.message;
        Alert.alert(
          'Error',
          Array.isArray(msg) ? msg.join('\n') : (msg ?? (isEditMode ? 'Failed to update list' : 'Failed to create routine list')),
        );
      } else {
        console.log('Create routine/list failed UNKNOWN:', err);
        Alert.alert('Error', 'Unexpected error occurred');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const dropDownStyle = {
    backgroundColor: colors.background,
    borderColor: colors.border,
    borderRadius: 12,
    minHeight: 50,
  };

  return (
    <LinearGradient colors={getBackgroundGradient(theme)} style={styles.screen}>
      <View style={styles.outerWrapper}>
        <View style={[styles.sheet, { overflow: 'visible' }]}>
          <ScrollView
            contentContainerStyle={[styles.content, { paddingBottom: 60 }]}
            nestedScrollEnabled
            keyboardShouldPersistTaps="handled"
            scrollEnabled={!catOpen}
          >
            <View style={styles.headerRow}>
              <Text style={styles.title}>{isEditMode ? 'Edit List' : 'Create Routine List'}</Text>
              <TouchableOpacity onPress={handleClose}>
                <Ionicons name="close" size={30} color={colors.text} />
              </TouchableOpacity>
            </View>

            {/* Category */}
            <Text style={styles.sectionLabel}>Category</Text>
            <View style={[styles.row, { zIndex: 9999, alignItems: 'center' }]}>
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
                  textStyle={{ color: colors.text, fontSize: 16 }}
                  placeholderStyle={{ color: colors.icon }}
                  listMode="SCROLLVIEW"
                  dropDownContainerStyle={{
                    backgroundColor: colors.background,
                    borderColor: colors.border,
                  }}
                  searchPlaceholder="Search..."
                  searchable={true}
                  closeAfterSelecting={true}
                  theme={theme === 'dark' ? 'DARK' : 'LIGHT'}
                />
              </View>

              {/* Buttons Row */}
              <View style={{ flexDirection: 'row', gap: 10 }}>
                {category !== null && (
                  <TouchableOpacity
                    style={[styles.addIconBtn, { width: 44, height: 44, borderRadius: 22, backgroundColor: theme === 'dark' ? '#7f1d1d' : '#fee2e2' }]}
                    onPress={handleDeleteCategory}
                    disabled={isDeleting}
                    hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
                  >
                    {isDeleting ? (
                      <ActivityIndicator size="small" color="#ef4444" />
                    ) : (
                      <Ionicons name="trash-outline" size={24} color="#ef4444" />
                    )}
                  </TouchableOpacity>
                )}

                <TouchableOpacity
                  style={[styles.addIconBtn, { width: 44, height: 44, borderRadius: 22 }]}
                  onPress={() => setShowNewCategoryInput((prev) => !prev)}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <Ionicons name="add" size={24} color="#ffffff" />
                </TouchableOpacity>
              </View>
            </View>

            {/* New Category Input */}
            {showNewCategoryInput && (
              <View style={{ marginTop: 10 }}>
                <View
                  style={[
                    styles.inputContainer,
                    { flexDirection: 'row', alignItems: 'center' },
                  ]}
                >
                  <TextInput
                    value={newCategoryName}
                    onChangeText={setNewCategoryName}
                    placeholder="New Category Name"
                    placeholderTextColor={colors.icon}
                    style={[styles.textInput, { flex: 1 }]}
                  />
                  <TouchableOpacity onPress={handleCreateCategory} style={{ paddingHorizontal: 8 }}>
                    <Text style={{ color: colors.primary, fontWeight: '600' }}>Save</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {/* Routine List Title */}
            <Text style={[styles.sectionLabel, { marginTop: 20 }]}>List Title</Text>
            <View style={[styles.inputContainer]}>
              <TextInput
                value={routineListTitle}
                onChangeText={setRoutineListTitle}
                placeholder="e.g. Morning Routine"
                placeholderTextColor={colors.icon}
                style={[styles.textInput]}
              />
            </View>

            {/* Collaborative Toggle */}
            <View style={{ marginTop: 20 }}>
                 <AnimatedToggle 
                    label="Make this a Collaborative Routine"
                    isEnabled={isCollaborative}
                    onToggle={() => setIsCollaborative(!isCollaborative)}
                    activeColor="#06b6d4" // Cyan-500
                 />
                 <Text style={{ fontSize: 12, color: Colors.light.icon, marginLeft: 2, marginTop: -5 }}>
                    Allow others to join this routine and track progress together.
                 </Text>
            </View>

            {/* Create Button */}
            <TouchableOpacity
              style={[styles.createBtn, { marginTop: 40 }]}
              onPress={handleSave}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 16 }}>
                  {isEditMode ? 'Update' : 'Create List'}
                </Text>
              )}
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </LinearGradient>
  );
}
