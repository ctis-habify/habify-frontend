import { RoutineRowProps } from '@/components/routines/routine-row';
import { Routine } from '@/types/routine';

export const mapBackendRoutineToRow = (
  routine: Routine,
): RoutineRowProps => {
  let label = routine.remainingLabel;
  
  if (routine.startTime && label !== 'Pending') {
    const now = new Date();
    const [h, m] = routine.startTime.split(':').map(Number);
    const startObj = new Date();
    startObj.setHours(h, m, 0, 0);

    if (now < startObj) {
      label = `Starts ${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
    }
  }

  return {
    id: routine.id,
    name: routine.routineName ?? '',
    completed: routine.isDone,
    durationLabel: label,
    showCamera: !routine.isDone,
    categoryName: routine.categoryName,
    frequencyType: routine.frequencyType,
    failed: routine.isFailed,
    streak: routine.streak,
    missedCount: routine.missedCount,
    startTime: routine.startTime,
    endTime: routine.endTime,
  };
};
