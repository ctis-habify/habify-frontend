import { XpLog, XpLogCreateDto } from '../types/xp';
import { api } from './api';

export const xpService = {
  // Get XP logs for current user
  getXpLogs: async (): Promise<XpLog[]> => {
    const res = await api.get('/xp-logs');
    return res.data;
  },

  // Create XP log
  createXpLog: async (data: XpLogCreateDto): Promise<XpLog> => {
    const res = await api.post('/xp-logs', data);
    return res.data;
  },
};

