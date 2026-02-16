import { Type } from "@sinclair/typebox";
import type { AnyAgentTool, OpenClawPluginApi } from "openclaw/plugin-sdk";

import { createConstellaClient } from "./src/client.js";

type PluginConfig = {
  baseUrl?: string;
  apiKey?: string;
};

function toTextResult(payload: unknown) {
  return {
    content: [
      {
        type: "text",
        text: JSON.stringify(payload, null, 2),
      },
    ],
  };
}

function readStringArray(value: unknown): string[] | undefined {
  if (!Array.isArray(value)) {
    return undefined;
  }
  const out = value.filter((item): item is string => typeof item === "string");
  return out.length > 0 ? out : undefined;
}

export default function register(api: OpenClawPluginApi) {
  const raw = (api.pluginConfig ?? {}) as PluginConfig;
  const baseUrl =
    typeof raw.baseUrl === "string" && raw.baseUrl.trim()
      ? raw.baseUrl.trim()
      : "https://fastfind.app";
  const apiKey = typeof raw.apiKey === "string" ? raw.apiKey.trim() : "";

  if (!apiKey) {
    api.logger.warn(
      "[constella-openclaw] Missing apiKey in plugin config. Tools will not be registered.",
    );
    return;
  }

  const client = createConstellaClient({
    baseUrl,
    apiKey,
    logger: api.logger,
  });

  const searchTool: AnyAgentTool = {
    name: "constella_search_notes",
    description: "Search Constella notes with optional filters and date range.",
    parameters: Type.Object(
      {
        query: Type.Optional(Type.String()),
        queries: Type.Optional(Type.Array(Type.String())),
        categories: Type.Optional(Type.Array(Type.String())),
        tags: Type.Optional(Type.Array(Type.String())),
        from_date_time: Type.Optional(Type.String()),
        to_end_date_time: Type.Optional(Type.String()),
        top_k: Type.Optional(Type.Number()),
        similarity_setting: Type.Optional(Type.Number()),
        fixedIntegrationNames: Type.Optional(Type.Array(Type.String())),
      },
      { additionalProperties: false },
    ),
    async execute(_id: string, params: Record<string, unknown>) {
      const result = await client.searchNotes({
        query: typeof params.query === "string" ? params.query : undefined,
        queries: readStringArray(params.queries),
        categories: readStringArray(params.categories),
        tags: readStringArray(params.tags),
        from_date_time:
          typeof params.from_date_time === "string"
            ? params.from_date_time
            : undefined,
        to_end_date_time:
          typeof params.to_end_date_time === "string"
            ? params.to_end_date_time
            : undefined,
        top_k: typeof params.top_k === "number" ? params.top_k : undefined,
        similarity_setting:
          typeof params.similarity_setting === "number"
            ? params.similarity_setting
            : undefined,
        fixedIntegrationNames: readStringArray(params.fixedIntegrationNames),
      });
      return toTextResult(result);
    },
  };

  const insertTool: AnyAgentTool = {
    name: "constella_insert_note",
    description: "Insert a note into Constella.",
    parameters: Type.Object(
      {
        title: Type.String(),
        content: Type.Optional(Type.String()),
      },
      { additionalProperties: false },
    ),
    async execute(_id: string, params: Record<string, unknown>) {
      const title = typeof params.title === "string" ? params.title.trim() : "";
      if (!title) {
        throw new Error("title is required");
      }

      const result = await client.insertNote({
        title,
        content: typeof params.content === "string" ? params.content : "",
      });
      return toTextResult(result);
    },
  };

  api.registerTool(searchTool, { optional: true });
  api.registerTool(insertTool, { optional: true });
}
