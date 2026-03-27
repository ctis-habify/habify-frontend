import { CollaborativeScoreSummary, LeaderboardEntry } from '../types/collaborative-score';
import { api } from './api';

export const collaborativeScoreService = {
  // Get collaborative score summary for current user
  getCollaborativeScore: async (): Promise<CollaborativeScoreSummary> => {
    const res = await api.get('/collaborative/score/me');
    return res.data;
  },

  // Get global leaderboard ranked by collaborative score
  getLeaderboard: async (limit: number = 50): Promise<LeaderboardEntry[]> => {
    const res = await api.get('/collaborative/score/leaderboard', {
      params: { limit },
    });
    return res.data;
  },
};
