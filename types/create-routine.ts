export interface CreateRoutineFormState {
  // Step 0: Basic
  categoryId: number | null;
  routineName: string;
  description: string;
  isPublic: boolean;
  
  // Step 1: Schedule
  startDate: Date;
  startTime: Date;
  endTime: Date;
  frequency: 'Daily' | 'Weekly';
  
  // Step 2: Gamification
  lives: number;
  rewardCondition: string;
  
  // Requirements
  ageRequirement?: string;
  genderRequirement: 'male' | 'female' | 'other' | 'na';
  xpRequirement?: string;
  completionXp: string;
}

export type CreateRoutineStep = 0 | 1 | 2;
