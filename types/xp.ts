export interface XpLog {
  id: number;
  user_id: string; // uuid
  amount: number;
  timestamp: string; // timestamp
  event_type: string;
}

export interface XpLogCreateDto {
  amount: number;
  event_type: string;
}

