'use client';

import { CreateRoutineModal } from "@/components/modals/create-routine-modal";

import { useLocalSearchParams } from 'expo-router';

export default function CreateRoutineScreen(): React.ReactElement {
  const params = useLocalSearchParams();
  
  return (
    <CreateRoutineModal 
      initialRoutineListId={params.id ? Number(params.id) : undefined}
      initialTitle={params.title as string}
      initialCategoryId={params.categoryId ? Number(params.categoryId) : undefined}
    />
  );
}

