import { RoutineRowProps } from '@/components/routines/RoutineRow';
import { Routine } from '@/types/routine';

export const mapBackendRoutineToRow = (
  routine: Routine,
): RoutineRowProps => ({
  id: routine.id,
  name: routine.routineName,
  completed: routine.isDone,
  durationLabel: routine.remainingLabel,
  showCamera: !routine.isDone,
});
