/**
 * API client for Telegram bot to interact with HumanCheck server via HTTP.
 */

export interface TelegramTask {
  id: string;
  projectName: string;
  difficulty: string;
  deadline: string | null;
  testerCount: number;
  assignedCount: number;
  roundId: string;
  roundNumber: number;
}

export interface TelegramMyTask {
  id: string;
  taskId: string;
  projectName: string;
  status: string;
  roundNumber: number | null;
}

export interface LinkResult {
  success: boolean;
  message: string;
}

/**
 * Abstract API client — concrete implementation is injected so the
 * bot file stays testable without a real API connection.
 */
export interface ApiClient {
  linkAccount(email: string, chatId: string): Promise<LinkResult>;
  getAvailableTasks(chatId: string): Promise<TelegramTask[]>;
  getMyTasks(chatId: string): Promise<TelegramMyTask[]>;
  acceptTask(chatId: string, taskId: string, roundId: string): Promise<{ success: boolean; message: string }>;
}

/**
 * HTTP-backed API client that talks to the HumanCheck API server.
 */
export function createHttpApiClient(): ApiClient {
  const baseUrl = process.env.HUMANCHECK_API_URL;
  const apiKey = process.env.HUMANCHECK_API_KEY;

  if (!baseUrl || !apiKey) {
    throw new Error("HUMANCHECK_API_URL and HUMANCHECK_API_KEY environment variables are required");
  }

  async function request(path: string, options: RequestInit = {}): Promise<any> {
    const res = await fetch(`${baseUrl}${path}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
        ...options.headers,
      },
    });

    if (!res.ok) {
      const body = await res.text().catch(() => "");
      throw new Error(`API error ${res.status}: ${body}`);
    }

    return res.json();
  }

  return {
    async linkAccount(email: string, chatId: string): Promise<LinkResult> {
      return request("/api/telegram/link", {
        method: "POST",
        body: JSON.stringify({ email, chatId }),
      });
    },

    async getAvailableTasks(chatId: string): Promise<TelegramTask[]> {
      return request(`/api/telegram/tasks?chatId=${encodeURIComponent(chatId)}`);
    },

    async getMyTasks(chatId: string): Promise<TelegramMyTask[]> {
      return request(`/api/telegram/my-tasks?chatId=${encodeURIComponent(chatId)}`);
    },

    async acceptTask(chatId: string, taskId: string, roundId: string) {
      return request("/api/telegram/accept", {
        method: "POST",
        body: JSON.stringify({ chatId, taskId, roundId }),
      });
    },
  };
}
