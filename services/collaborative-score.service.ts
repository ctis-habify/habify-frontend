import { CollaborativeScoreSummary } from '../types/collaborative-score';
import { api } from './api';

export const collaborativeScoreService = {
  // Get collaborative score summary for current user
  getCollaborativeScore: async (): Promise<CollaborativeScoreSummary> => {
    const res = await api.get('/collaborative/score/me');
    return res.data;
  },
};
