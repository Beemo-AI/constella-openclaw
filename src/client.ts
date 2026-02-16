export type ConstellaLogger = {
  info?: (message: string) => void;
  warn?: (message: string) => void;
  error?: (message: string) => void;
};

export type ConstellaClientOptions = {
  baseUrl: string;
  apiKey: string;
  logger?: ConstellaLogger;
};

type RetrieveInfoRequest = {
  query?: string;
  queries?: string[];
  categories?: string[];
  tags?: string[];
  from_date_time?: string;
  to_end_date_time?: string;
  top_k?: number;
  similarity_setting?: number;
  fixedIntegrationNames?: string[];
};

type InsertNoteRequest = {
  title: string;
  content?: string;
};

function normalizeBaseUrl(input: string): string {
  return input.replace(/\/+$/, "");
}

export function createConstellaClient(options: ConstellaClientOptions) {
  const baseUrl = normalizeBaseUrl(options.baseUrl);
  const apiKey = options.apiKey;
  const logger = options.logger;

  async function postJson<TResponse>(
    path: string,
    body: Record<string, unknown>,
  ): Promise<TResponse> {
    const url = `${baseUrl}${path}`;
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        x_access_key: apiKey,
      },
      body: JSON.stringify(body),
    });

    const text = await response.text();
    let parsed: unknown;
    try {
      parsed = text ? JSON.parse(text) : {};
    } catch {
      parsed = { raw: text };
    }

    if (!response.ok) {
      const detail =
        (parsed as { detail?: string })?.detail ||
        (parsed as { error?: string })?.error ||
        `Constella request failed (${response.status})`;
      logger?.error?.(detail);
      throw new Error(detail);
    }

    return parsed as TResponse;
  }

  return {
    async searchNotes(payload: RetrieveInfoRequest): Promise<unknown> {
      return await postJson("/constella-external-api/retrieve-info", payload);
    },
    async insertNote(payload: InsertNoteRequest): Promise<unknown> {
      return await postJson("/constella-external-api/insert-note", payload);
    },
  };
}
