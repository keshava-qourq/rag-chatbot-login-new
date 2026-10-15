/// <reference types="vite/client" />
// Typed client for the conversation sidebar and "New chat" action
// (RAGCD78C25-23-2). Shapes follow the documented GET/POST /conversations
// contract; the backend router (backend/app/routers/conversations.py) has
// no handlers yet, so this is the single place those shapes are declared
// for the frontend, same pattern as authApi.ts.
import { apiFetch, ApiError } from "@/lib/api";

export { ApiError };

export type Conversation = {
  id: string;
  /** Null until the first exchange completes and the backend titles it. */
  title: string | null;
  created_at: string;
  updated_at: string;
};

/** Newest first -- the sidebar renders this order directly. */
export function listConversations(): Promise<Conversation[]> {
  return apiFetch<Conversation[]>("/conversations");
}

export function createConversation(): Promise<Conversation> {
  return apiFetch<Conversation>("/conversations", {
    method: "POST",
    body: JSON.stringify({}),
  });
}
