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
  
  // Steps
  const [step, setStep] = useState<CreateRoutineStep>(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Data
  const [categories, setCategories] = useState<any[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(true);

  // Form State
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

  // Load Categories
  const loadCategories = useCallback(async () => {
    try {
      setLoadingCategories(true);
      const data = await categoryService.getCategories('collaborative');
      setCategories(data);
    } catch (e) {
      console.error(e);
      Alert.alert("Error", "Failed to load categories");
    } finally {
      setLoadingCategories(false);
    }
  }, []);

  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  // Update Form Helper
  const updateForm = useCallback((updates: Partial<CreateRoutineFormState>) => {
    setFormState(prev => ({ ...prev, ...updates }));
  }, []);

  // Validation
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
  
  // Navigation
  const nextStep = useCallback(() => {
      if (validateStep(step)) {
           setStep(s => Math.min(s + 1, 2) as CreateRoutineStep);
      }
  }, [step, validateStep]);

  const prevStep = useCallback(() => {
    setStep(s => Math.max(s - 1, 0) as CreateRoutineStep);
  }, []);

  // Submit
  const submit = useCallback(async () => {
    if (!validateStep(step)) return;
    setIsSubmitting(true);

    try {
        const allLists = await routineService.getGroupedRoutines();
        
        // Try to find a list 
        const selectedCategory = categories.find(c => (c.categoryId ?? c.id) === formState.categoryId);
        if (!selectedCategory) throw new Error("Category not found");

        const existingList = allLists.find((l: any) => 
            (l.categoryId === formState.categoryId) || (l.routineListTitle === selectedCategory.name)
        );

        const targetListId = existingList ? existingList.id : undefined;

        const formatTime = (d: Date) => 
           `${d.getHours().toString().padStart(2,'0')}:${d.getMinutes().toString().padStart(2,'0')}:00`;

        const formatDate = (d: Date) => d.toISOString().split('T')[0];

        const payload = {
            routineListId: targetListId,
            categoryId: formState.categoryId!,
            routineName: formState.routineName.trim(),
            description: formState.description.trim(),
            frequencyType: formState.frequency.charAt(0) + formState.frequency.slice(1).toLowerCase(),
            startTime: formatTime(formState.startTime),
            endTime: formatTime(formState.endTime),
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
    } catch (err: any) {
        console.error(err);
        Alert.alert("Error", err.message || "Failed to create routine");
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
    loadCategories, // Exported to allow manual refresh if needed (e.g. after creating category)
  };
}
