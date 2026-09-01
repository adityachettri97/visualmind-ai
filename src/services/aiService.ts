import { API_BASE_URL } from "../config";

export interface AIAnalysis {
  insights: string[];
  recommendations: string[];

  graph: {
    topProduct: string;
    topProductValue: string;
    topRegion: string;
    highlightedProducts: string[];
    highlightedRegion: string;
  };

  // Optional because older cached results (from before this field existed) won't have it.
  dataQuality?: {
    rating: "good" | "fair" | "poor";
    issues: string[];
    suggestions: string[];
  };
}

async function postJSON<T>(url: string, body: unknown): Promise<T> {
  let response: Response;

  try {
    response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });
  } catch {
    throw new Error(`Can't reach the backend at ${url}. Is the server running? (cd server && npm start)`);
  }

  if (!response.ok) {
    const errorBody: { error?: string } | null = await response.json().catch(() => null);

    throw new Error(errorBody?.error ?? `Request failed (HTTP ${response.status}).`);
  }

  return response.json();
}

export async function analyzeWithAI(dataset: Record<string, string>[]): Promise<AIAnalysis> {
  return postJSON<AIAnalysis>(`${API_BASE_URL}/api/analyze`, { dataset });
}

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export async function chatWithAI(dataset: Record<string, string>[], question: string, history: ChatMessage[]): Promise<string> {
  const result = await postJSON<{ answer: string }>(`${API_BASE_URL}/api/chat`, { dataset, question, history });

  return result.answer;
}

export interface GeneratedDataset {
  fileName: string;
  rows: Record<string, string>[];
}

export async function generateDatasetWithAI(prompt: string, rowCount: number): Promise<GeneratedDataset> {
  return postJSON<GeneratedDataset>(`${API_BASE_URL}/api/generate-dataset`, { prompt, rowCount });
}
