export interface XpLog {
  id: number;
  userId: string;
  amount: number;
  timestamp: string;
  eventType: string;
}

export interface XpLogCreateDto {
  amount: number;
  eventType: string;
}

