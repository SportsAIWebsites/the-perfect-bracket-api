export interface PredictionRequest {
  matchupId: string;
  topTeam: {
    name: string;
    seed: number;
    record: string;
  };
  bottomTeam: {
    name: string;
    seed: number;
    record: string;
  };
  round: string;
  region: string;
  odds?: {
    spread?: number;
    moneyline?: { top: number; bottom: number };
  };
}

export interface PredictionResponse {
  winnerId: "top" | "bottom";
  confidence: number;
  reasoning: string;
}

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}
