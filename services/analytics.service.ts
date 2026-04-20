import AsyncStorage from '@react-native-async-storage/async-storage';

export type AnalyticsEvent = {
  id: string;
  type: string;
  message: string;
  timestamp: string;
  severity: 'minor' | 'info' | 'warning';
};

const ANALYTICS_STORAGE_KEY = 'habify_analytics_logs';

class AnalyticsService {
  async logEvent(type: string, message: string, severity: 'minor' | 'info' | 'warning' = 'info'): Promise<void> {
    try {
      const event: AnalyticsEvent = {
        id: Math.random().toString(36).substring(2, 9),
        type,
        message,
        timestamp: new Date().toISOString(),
        severity,
      };

      const existingLogs = await this.getEvents();
      const updatedLogs = [event, ...existingLogs].slice(0, 50); // Keep last 50 events
      await AsyncStorage.setItem(ANALYTICS_STORAGE_KEY, JSON.stringify(updatedLogs));
      
      console.log(`[Analytics] ${type}: ${message}`);
    } catch (error) {
      console.error('Failed to log analytics event', error);
    }
  }

  async getEvents(): Promise<AnalyticsEvent[]> {
    try {
      const logs = await AsyncStorage.getItem(ANALYTICS_STORAGE_KEY);
      return logs ? JSON.parse(logs) : [];
    } catch (error) {
      console.error('Failed to fetch analytics logs', error);
      return [];
    }
  }

  async clearLogs(): Promise<void> {
    try {
      await AsyncStorage.removeItem(ANALYTICS_STORAGE_KEY);
    } catch (error) {
      console.error('Failed to clear analytics logs', error);
    }
  }
}

export const analyticsService = new AnalyticsService();
