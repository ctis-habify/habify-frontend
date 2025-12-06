const API_URL = 'http://localhost:3000'; // Adjust for Android Emulator (10.0.2.2) if needed

export type Routine = {
  id: string;
  name: string;
  category: string; // routine_group_id mapped name
  startTime: string;
  endTime: string;
  frequency: 'Daily' | 'Weekly';
  startDate: string;
  description?: string;
};

export type UpdateRoutinePayload = Partial<Omit<Routine, 'id'>>;

export const routineService = {
  async getRoutines(token: string): Promise<Routine[]> {
    const response = await fetch(`${API_URL}/routines/me`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!response.ok) throw new Error('Failed to fetch routines');
    return response.json();
  },

  async updateRoutine(id: string, payload: UpdateRoutinePayload, token: string) {
    const response = await fetch(`${API_URL}/routines/${id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) throw new Error('Failed to update routine');
    return response.json();
  },

  async deleteRoutine(id: string, token: string) {
    const response = await fetch(`${API_URL}/routines/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!response.ok) throw new Error('Failed to delete routine');
    return true; // Success
  },
};