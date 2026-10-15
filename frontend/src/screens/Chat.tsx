// @ts-nocheck -- generated screen shell kept in the same JS runtime contract as
// the other screens; the sidebar/new-chat wiring below is the hand-written part.
/* eslint-disable @typescript-eslint/no-unused-vars */
import React from "react";
import { useQueryClient } from "@tanstack/react-query";

import * as UI from "@/lib/ui";
import { Icons } from "@/lib/icons";
import { brand } from "@/lib/brand";
import { useNavigate } from "@/lib/navigate";
import { useClearSession } from "@/lib/session";
import {
  ApiError,
  createConversation,
  listConversations,
} from "@/lib/conversationsApi";

const { Button, Textarea, Separator } = UI;
const { Plus, FileText, Clock, AlertCircle, ArrowRight } = Icons;

export const CONVERSATIONS_QUERY_KEY = ["conversations"];

// Message streaming stays on sample data for this task -- only the sidebar
// list and the New chat action talk to the real API. This is the canned
// exchange a composer "send" simulates so AC-057's refresh can be observed.
const SAMPLE_ANSWER = {
  id: "sample-a",
  role: "assistant",
  content:
    "Parts and labour are covered for 24 months from the date of installation — but only " +
    "while the appliance is serviced annually by a qualified engineer.",
  source: "ecoTEC-plus-installation-manual.pdf",
  pageRef: "page 41",
};

function timeAgo(iso) {
  if (!iso) return "";
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.round(diffMs / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return new Date(iso).toLocaleDateString();
}

export default function Screen() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const clearSession = useClearSession();

  const [conversations, setConversations] = React.useState([]);
  const [listPhase, setListPhase] = React.useState("loading"); // loading | ready | error
  const [activeId, setActiveId] = React.useState(null);
  const [messages, setMessages] = React.useState([]);
  const [draft, setDraft] = React.useState("");
  const [sending, setSending] = React.useState(false);
  const [creating, setCreating] = React.useState(false);
  const [refreshToken, setRefreshToken] = React.useState(0);

  const handleAuthFailure = React.useCallback(
    (err) => {
      if (err instanceof ApiError && err.status === 401) {
        clearSession();
        navigate("signin");
        return true;
      }
      return false;
    },
    [clearSession, navigate],
  );

  // Sidebar source of truth: GET /conversations, refetched whenever
  // refreshToken changes (mount, after New chat, after a first exchange).
  React.useEffect(() => {
    let cancelled = false;
    setListPhase((p) => (p === "ready" ? "ready" : "loading"));
    listConversations()
      .then((data) => {
        if (cancelled) return;
        setConversations(data);
        setListPhase("ready");
        setActiveId((current) => {
          if (current && data.some((c) => c.id === current)) return current;
          return data[0]?.id ?? null;
        });
      })
      .catch((err) => {
        if (cancelled) return;
        if (handleAuthFailure(err)) return;
        setListPhase("error");
      });
    return () => {
      cancelled = true;
    };
  }, [refreshToken, handleAuthFailure]);

  const refreshSidebar = React.useCallback(() => {
    setRefreshToken((t) => t + 1);
    queryClient.invalidateQueries({ queryKey: CONVERSATIONS_QUERY_KEY });
  }, [queryClient]);

  // AC-056: New chat calls POST /conversations, makes the returned
  // conversation active, and clears messages/context from whatever was
  // previously open.
  async function handleNewChat() {
    if (creating) return;
    setCreating(true);
    try {
      const conversation = await createConversation();
      setConversations((prev) => [conversation, ...prev.filter((c) => c.id !== conversation.id)]);
      setActiveId(conversation.id);
      setMessages([]);
      setDraft("");
      setListPhase("ready");
    } catch (err) {
      handleAuthFailure(err);
    } finally {
      setCreating(false);
    }
  }

  function selectConversation(id) {
    setActiveId(id);
    setMessages([]);
    setDraft("");
  }

  // Sample-data send: simulates the streamed exchange, then refreshes the
  // sidebar from GET /conversations so a newly titled conversation moves to
  // the top (AC-057).
  function handleSend(e) {
    e.preventDefault();
    if (!draft.trim() || !activeId || sending) return;
    const question = draft.trim();
    setDraft("");
    setMessages((m) => [...m, { id: `local-${m.length}`, role: "user", content: question }]);
    setSending(true);
    setTimeout(() => {
      setMessages((m) => [...m, SAMPLE_ANSWER]);
      setSending(false);
      refreshSidebar();
    }, 600);
  }

  const ink = brand.primaryColor;
  const quiet = brand.neutralColor;
  const line = brand.neutralColor + "29";

  return (
    <div className="flex h-full min-h-[70vh]" style={{ fontFamily: brand.fontBody }}>
      <aside
        className="flex w-72 shrink-0 flex-col border-r p-4"
        style={{ borderColor: line, backgroundColor: "#fff" }}
        aria-label="Conversations"
      >
        <Button
          type="button"
          onClick={handleNewChat}
          disabled={creating}
          className="flex w-full items-center justify-center gap-2"
          style={{ opacity: creating ? 0.6 : 1 }}
        >
          <Plus className="h-4 w-4" aria-hidden="true" />
          {creating ? "Starting…" : "New chat"}
        </Button>

        <Separator className="my-4" />

        <div className="flex-1 overflow-y-auto">
          {listPhase === "loading" && (
            <p role="status" aria-live="polite" className="px-1 text-sm" style={{ color: quiet }}>
              Loading conversations…
            </p>
          )}

          {listPhase === "error" && (
            <div role="alert" className="px-1 text-sm" style={{ color: brand.accentColor }}>
              <p className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4" aria-hidden="true" />
                Could not load your conversations.
              </p>
              <button
                type="button"
                onClick={refreshSidebar}
                className="mt-2 underline underline-offset-4"
              >
                Try again
              </button>
            </div>
          )}

          {listPhase === "ready" && conversations.length === 0 && (
            <p className="px-1 text-sm" style={{ color: quiet }}>
              No conversations yet. Start one with New chat.
            </p>
          )}

          {listPhase === "ready" && conversations.length > 0 && (
            <ul className="flex flex-col gap-1">
              {conversations.map((conversation) => {
                const active = conversation.id === activeId;
                return (
                  <li key={conversation.id}>
                    <button
                      type="button"
                      onClick={() => selectConversation(conversation.id)}
                      aria-current={active ? "true" : undefined}
                      className="flex w-full flex-col items-start gap-0.5 rounded-[var(--brand-radius)] px-3 py-2 text-left text-sm"
                      style={{
                        backgroundColor: active ? ink + "14" : "transparent",
                        color: active ? ink : quiet,
                      }}
                    >
                      <span className="truncate font-medium">
                        {conversation.title ?? "New conversation"}
                      </span>
                      <span className="flex items-center gap-1 text-xs" style={{ color: quiet }}>
                        <Clock className="h-3 w-3" aria-hidden="true" />
                        {timeAgo(conversation.updated_at)}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </aside>

      <main className="flex flex-1 flex-col p-6">
        {!activeId ? (
          <div className="flex flex-1 items-center justify-center text-sm" style={{ color: quiet }}>
            Choose New chat to start a conversation.
          </div>
        ) : (
          <>
            <div className="flex-1 space-y-4 overflow-y-auto">
              {messages.length === 0 && (
                <p className="text-sm" style={{ color: quiet }}>
                  Ask a question about your documents.
                </p>
              )}
              {messages.map((message) => (
                <div
                  key={message.id}
                  className="max-w-2xl rounded-[var(--brand-radius)] border px-4 py-3 text-sm"
                  style={{
                    borderColor: line,
                    marginLeft: message.role === "user" ? "auto" : 0,
                    backgroundColor: message.role === "user" ? ink + "0d" : "#fff",
                    color: ink,
                  }}
                >
                  <p>{message.content}</p>
                  {message.source && (
                    <p className="mt-2 flex items-center gap-1.5 text-xs" style={{ color: quiet }}>
                      <FileText className="h-3.5 w-3.5" aria-hidden="true" />
                      {message.source} · {message.pageRef}
                    </p>
                  )}
                </div>
              ))}
              {sending && (
                <p role="status" aria-live="polite" className="text-sm" style={{ color: quiet }}>
                  Thinking…
                </p>
              )}
            </div>

            <form onSubmit={handleSend} className="mt-4 flex items-end gap-2">
              <Textarea
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                placeholder="Ask a question about your documents…"
                className="flex-1"
                disabled={sending}
              />
              <Button type="submit" disabled={sending || !draft.trim()}>
                Send
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Button>
            </form>
          </>
        )}
      </main>
    </div>
  );
}
