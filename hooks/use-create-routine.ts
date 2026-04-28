import { categoryService } from '@/services/category.service';
import { routineService } from '@/services/routine.service';
import type { CreateRoutineFormState, CreateRoutineStep } from '@/types/create-routine';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Alert, DeviceEventEmitter } from 'react-native';
import { useAuth } from './use-auth';

export function useCreateRoutine(initialCategoryId?: string) {
  const router = useRouter();
  const { token } = useAuth();

  const [step, setStep] = useState<CreateRoutineStep>(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [categories, setCategories] = useState<import('@/types/category').Category[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(true);

  const [formState, setFormState] = useState<CreateRoutineFormState>({
    categoryId: initialCategoryId ? Number(initialCategoryId) : null,
    routineName: '',
    description: '',
    isPublic: true,
    startDate: new Date(),
    startTime: new Date(new Date().setHours(9, 0, 0, 0)),
    endTime: new Date(new Date().setHours(10, 0, 0, 0)),
    frequency: 'Daily',
    lives: 3,
    rewardCondition: '',
    ageRequirement: '',
    genderRequirement: 'na',
    xpRequirement: '',
    completionXp: '10',
  });

  const loadCategories = useCallback(async () => {
    try {
      setLoadingCategories(true);
      const data = await categoryService.getCategories('collaborative', token || undefined);
      setCategories(data);
    } catch (e) {
      console.error(e);
      Alert.alert("Error", "Failed to load categories");
    } finally {
      setLoadingCategories(false);
    }
  }, [token]);

  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  const updateForm = useCallback((updates: Partial<CreateRoutineFormState>) => {
    setFormState(prev => ({ ...prev, ...updates }));
  }, []);
  const validateStep = useCallback((currentStep: number): boolean => {
    if (currentStep === 0) {
      if (!formState.categoryId) { Alert.alert("Missing Field", "Please select a category."); return false; }
      if (!formState.routineName.trim()) { Alert.alert("Missing Field", "Please enter a routine name."); return false; }
      if (!formState.description.trim()) { Alert.alert("Missing Field", "Please enter a description."); return false; }
    }
    if (currentStep === 2) {
      if (!formState.rewardCondition.trim()) { Alert.alert("Missing Field", "Please enter a reward condition."); return false; }
    }
    return true;
  }, [formState]);

  const nextStep = useCallback(() => {
    if (validateStep(step)) {
      setStep(s => Math.min(s + 1, 2) as CreateRoutineStep);
    }
  }, [step, validateStep]);

  const prevStep = useCallback(() => {
    setStep(s => Math.max(s - 1, 0) as CreateRoutineStep);
  }, []);

  const submit = useCallback(async () => {
    if (!validateStep(step)) return;
    setIsSubmitting(true);

    try {
      const allLists = await routineService.getGroupedRoutines();

      const selectedCategory = categories.find(c => c.categoryId === formState.categoryId);
      if (!selectedCategory) throw new Error("Category not found");

      const existingList = allLists.find((l: { categoryId: number; routineListTitle: string; id: number }) =>
        (l.categoryId === formState.categoryId) || (l.routineListTitle === selectedCategory.name)
      );

      const targetListId = existingList ? existingList.id : undefined;

      const formatTime = (d: Date) =>
        `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}:00`;

      const formatDate = (d: Date) => d.toISOString().split('T')[0];

      const payload = {
        routineListId: targetListId,
        categoryId: formState.categoryId!,
        routineName: formState.routineName.trim(),
        description: formState.description.trim(),
        frequencyType: formState.frequency.charAt(0) + formState.frequency.slice(1).toLowerCase(),
        startTime: formState.frequency === 'Weekly' ? '00:00:00' : formatTime(formState.startTime),
        endTime: formState.frequency === 'Weekly' ? '23:59:59' : formatTime(formState.endTime),
        startDate: formatDate(formState.startDate),
        lives: formState.lives,
        isPublic: formState.isPublic,
        rewardCondition: formState.rewardCondition.trim(),
        ageRequirement: formState.ageRequirement ? parseInt(formState.ageRequirement) : undefined,
        genderRequirement: formState.genderRequirement === 'na' ? undefined : formState.genderRequirement,
        xpRequirement: formState.xpRequirement ? parseInt(formState.xpRequirement) : undefined,
        completionXp: formState.completionXp ? parseInt(formState.completionXp) : undefined,
      };

      await routineService.createCollaborativeRoutine(payload);

      DeviceEventEmitter.emit('SHOW_TOAST', "Collaborative routine created!");
      router.replace('/(collaborative)/(drawer)/routines');
    } catch (err: unknown) {
      console.error(err);
      let msg = "Failed to create routine";
      if (err instanceof Error) msg = err.message;
      Alert.alert("Error", msg);
    } finally {
      setIsSubmitting(false);
    }
  }, [step, validateStep, formState, categories, router]);

  return {
    step,
    nextStep,
    prevStep,
    submit,
    isSubmitting,
    formState,
    updateForm,
    categories,
    loadingCategories,
    loadCategories,
  };
}
