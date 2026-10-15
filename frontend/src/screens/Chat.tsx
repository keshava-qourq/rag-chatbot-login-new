// @ts-nocheck -- generated from the approved design under its JS runtime contract; not hand-written TypeScript.
/* eslint-disable @typescript-eslint/no-unused-vars */
import React from "react";

import * as UI from "@/lib/ui";
import { Icons } from "@/lib/icons";
import { brand } from "@/lib/brand";
import { useNavigate } from "@/lib/navigate";

const { Button, Input, Textarea, Label, Separator } = UI;
const { Plus, Search, Check, X, ChevronRight, Menu, Home, FileText, Clock, Trash, Edit, Upload, ArrowRight, AlertCircle, CheckCircle } = Icons;

const hexToRgb = (hex) => {
  const h = String(hex || "#000000").replace("#", "");
  const full = h.length === 3 ? h.split("").map((c) => c + c).join("") : h;
  const n = parseInt(full, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
};
const rgba = (hex, a) => {
  const [r, g, b] = hexToRgb(hex);
  return `rgba(${r}, ${g}, ${b}, ${a})`;
};
const shade = (hex, f) => {
  const [r, g, b] = hexToRgb(hex);
  return `rgb(${Math.round(r * f)}, ${Math.round(g * f)}, ${Math.round(b * f)})`;
};
const tint = (hex, f) => {
  const [r, g, b] = hexToRgb(hex);
  return `rgb(${Math.round(r + (255 - r) * f)}, ${Math.round(g + (255 - g) * f)}, ${Math.round(b + (255 - b) * f)})`;
};

const DOC_BOILER = "Vaillant ecoTEC Plus — Installation & Servicing.pdf";
const DOC_TENANCY = "Flat 3B Tenancy Agreement (signed).pdf";
const DOC_POLICY = "Aviva Home Insurance Policy 2026.pdf";
const DOC_KITCHEN = "Harrow Joinery — kitchen quote rev C.docx";
const DOC_NOTES = "survey-notes-2026-09.md";

const LIBRARY = {
  ready: 5,
  processing: 1,
  failed: 1,
  processing_name: "Volvo XC40 Owner's Manual.pdf",
  failed_name: "Boiler service record (scan).pdf",
};

const INITIAL_USAGE = {
  document_count: 7,
  document_limit: 20,
  storage_bytes: 48234496,
  storage_limit: 104857600,
  messages_this_month: 182,
  message_limit: 200,
  month_reset_at: "1 November",
};

const ANSWER_BOILER = {
  kind: "grounded",
  text:
    "Once a year, by a competent person — and the manual ties the warranty directly to that service happening.\n\nSection 9.1 is explicit that the annual service is a condition of the manufacturer's warranty, not a recommendation. Section 9.4 adds the part people usually miss: each service has to be written into the Benchmark checklist at the back of the manual. An unsigned checklist is treated the same as no service at all when a claim is assessed.\n\nFor a combi in a hard-water area the manual asks the engineer to check the expansion vessel charge pressure and clear the condensate trap at the same visit.",
  citations: [
    {
      document_name: DOC_BOILER,
      page_ref: "p. 42, §9.1",
      quoted_passage:
        "The appliance must be serviced annually by a competent person. Failure to carry out the annual service will invalidate the manufacturer's warranty.",
      full_passage:
        "The appliance must be serviced annually by a competent person. Failure to carry out the annual service will invalidate the manufacturer's warranty. The service interval begins on the date of commissioning and not on the date of purchase. Where the appliance is installed in a commercial setting, a six-monthly interval applies.",
    },
    {
      document_name: DOC_BOILER,
      page_ref: "p. 44, §9.4",
      quoted_passage:
        "A record of each service must be entered in the Benchmark checklist at the rear of this manual and signed by the engineer carrying out the work.",
      full_passage:
        "A record of each service must be entered in the Benchmark checklist at the rear of this manual and signed by the engineer carrying out the work. In hard water areas the expansion vessel charge pressure shall be verified and the condensate trap cleared at the same visit. Retain the completed checklist for the life of the appliance.",
    },
  ],
};

const ANSWER_TENANCY = {
  kind: "grounded",
  text:
    "Two months' written notice, and it has to end on the last day of a rental period.\n\nClause 14.2 sets the notice at two months in writing after the first six months have passed. Clause 6.1 covers the deposit separately: £1,650 was taken and must be protected with the Deposit Protection Service within 30 days of receipt, with the prescribed information given to you in the same window.",
  citations: [
    {
      document_name: DOC_TENANCY,
      page_ref: "p. 7, cl. 14.2",
      quoted_passage:
        "After the first six months of the Term, the Tenant may end this Agreement by giving the Landlord not less than two months' notice in writing, such notice to expire on the last day of a rental period.",
      full_passage:
        "After the first six months of the Term, the Tenant may end this Agreement by giving the Landlord not less than two months' notice in writing, such notice to expire on the last day of a rental period. Notice given by email to the address at clause 2.3 shall be treated as notice in writing. Rent remains payable up to and including the expiry date of the notice.",
    },
    {
      document_name: DOC_TENANCY,
      page_ref: "p. 4, cl. 6.1",
      quoted_passage:
        "The Deposit of £1,650.00 shall be protected in the Deposit Protection Service custodial scheme within 30 days of receipt.",
      full_passage:
        "The Deposit of £1,650.00 shall be protected in the Deposit Protection Service custodial scheme within 30 days of receipt, and the prescribed information shall be served on the Tenant within the same period. The Deposit may not be applied toward rent during the Term.",
    },
  ],
};

const ANSWER_POLICY = {
  kind: "grounded",
  text:
    "Escape of water is covered, with a £350 excess on that section specifically — higher than the £250 standard excess.\n\nThe policy pays for the damage the water causes and for tracing and accessing the leak, up to £5,000. What it will not pay for is the failed part itself, or damage that has built up gradually over time rather than happening suddenly.",
  citations: [
    {
      document_name: DOC_POLICY,
      page_ref: "p. 18, Section 2(c)",
      quoted_passage:
        "We will pay for damage caused by water escaping from any fixed water or heating installation. The excess applying to this section is £350.",
      full_passage:
        "We will pay for damage caused by water escaping from any fixed water or heating installation, including the reasonable cost of tracing and accessing the source of the leak up to £5,000. The excess applying to this section is £350. We will not pay for the cost of repairing or replacing the item from which the water escaped.",
    },
    {
      document_name: DOC_POLICY,
      page_ref: "p. 21, Exclusions",
      quoted_passage:
        "We do not cover loss or damage occurring gradually, including damage from a leak you were aware of or should reasonably have been aware of.",
      full_passage:
        "We do not cover loss or damage occurring gradually, including damage from a leak you were aware of or should reasonably have been aware of. Nor do we cover damage occurring while the home is unoccupied for more than 45 consecutive days unless the water system has been drained.",
    },
  ],
};

const ANSWER_KITCHEN = {
  kind: "grounded",
  text:
    "The quote is £14,280 including VAT, and three things sit outside it: electrical first and second fix, worktop templating and installation, and making good the plaster after the old units come out.\n\nRevision C also moved the deposit from 25% to 40% on acceptance, which is worth noticing before you sign anything.",
  citations: [
    {
      document_name: DOC_KITCHEN,
      page_ref: "Section 4 — Exclusions",
      quoted_passage:
        "Excluded from this quotation: electrical first and second fix; worktop templating and installation; making good of plasterwork following removal of existing units.",
      full_passage:
        "Excluded from this quotation: electrical first and second fix; worktop templating and installation; making good of plasterwork following removal of existing units. Appliances are supplied by the client. Waste removal is included for one skip only.",
    },
    {
      document_name: "Harrow Joinery — kitchen quote rev A.pdf",
      page_ref: "p. 2, Payment terms",
      quoted_passage:
        "A deposit of 25% of the total is payable on acceptance, with the balance due on completion of installation.",
      full_passage:
        "A deposit of 25% of the total is payable on acceptance, with the balance due on completion of installation. Variations agreed in writing will be invoiced separately.",
      deleted: true,
    },
  ],
};

const REFUSAL_TEXT =
  "I can't answer that from your documents.\n\nI searched all five of your ready documents and nothing came back close enough to stand behind. The nearest passages were about escape of water inside the home and the boiler's annual service — neither of them speaks to this. I'd rather tell you that than answer from general knowledge and have you act on it.";

const INITIAL_CONVERSATIONS = [
  {
    id: "c1",
    title: "Boiler service interval and warranty",
    updated_label: "Today, 09:41",
    messages: [
      {
        id: "m1",
        role: "user",
        content: "How often does the boiler need servicing to keep the warranty valid?",
        created_at: "09:38",
        state: "complete",
        citations: [],
      },
      {
        id: "m2",
        role: "assistant",
        content: ANSWER_BOILER.text,
        created_at: "09:38",
        state: "complete",
        kind: "grounded",
        citations: ANSWER_BOILER.citations,
      },
      {
        id: "m3",
        role: "user",
        content: "And what does the warranty actually cover?",
        created_at: "09:41",
        state: "complete",
        citations: [],
      },
      {
        id: "m4",
        role: "assistant",
        content:
          "Partly answerable. Your manual tells you what you must do to keep the warranty alive — the annual service, recorded on the Benchmark checklist — and it gives the warranty period as 10 years from commissioning for this model.\n\nWhat it does not contain is the schedule of what the warranty pays for: parts, labour, call-out, or any of the exclusions. That sits in the separate guarantee booklet, and that booklet isn't in your library, so I can't answer that part from your documents.",
        created_at: "09:41",
        state: "complete",
        kind: "partial",
        citations: [
          {
            document_name: DOC_BOILER,
            page_ref: "p. 41, §9.0",
            quoted_passage:
              "This appliance carries a 10 year guarantee from the date of commissioning, subject to annual servicing and registration within 30 days of installation.",
            full_passage:
              "This appliance carries a 10 year guarantee from the date of commissioning, subject to annual servicing and registration within 30 days of installation. Full terms are set out in the guarantee booklet supplied separately with the appliance.",
          },
        ],
      },
    ],
  },
  {
    id: "c2",
    title: "Deposit protection and notice period",
    updated_label: "Yesterday, 17:02",
    messages: [
      {
        id: "m5",
        role: "user",
        content: "How much notice do I have to give before I move out of the flat?",
        created_at: "17:01",
        state: "complete",
        citations: [],
      },
      {
        id: "m6",
        role: "assistant",
        content: ANSWER_TENANCY.text,
        created_at: "17:02",
        state: "complete",
        kind: "grounded",
        citations: ANSWER_TENANCY.citations,
      },
    ],
  },
  {
    id: "c3",
    title: "Storm damage to the garden wall",
    updated_label: "Mon, 12 Oct",
    messages: [
      {
        id: "m7",
        role: "user",
        content: "What's the excess if the garden wall blows down in a storm?",
        created_at: "11:24",
        state: "complete",
        citations: [],
      },
      {
        id: "m8",
        role: "assistant",
        content:
          "I can't answer that from your documents.\n\nYour policy document covers the buildings and escape of water in detail, but the pages you uploaded stop before the section on walls, gates and fences. Nothing retrieved mentions a storm excess for boundary structures, so there is nothing here I can cite.",
        created_at: "11:24",
        state: "complete",
        kind: "refusal",
        citations: [],
      },
    ],
  },
  {
    id: "c4",
    title: "XC40 tyre pressures",
    updated_label: "Fri, 9 Oct",
    messages: [
      {
        id: "m9",
        role: "user",
        content: "What tyre pressures should the XC40 be on with four people and luggage?",
        created_at: "08:12",
        state: "complete",
        citations: [],
      },
      {
        id: "m10",
        role: "assistant",
        content:
          "The only document that would hold this — your Volvo XC40 Owner's Manual — is still being processed, so I have nothing to read from yet.\n\nIt's a 486-page file, so give it a few minutes. I'd rather wait than answer from memory and give you a pressure that isn't yours.",
        created_at: "08:12",
        state: "complete",
        kind: "processing",
        citations: [],
      },
    ],
  },
  {
    id: "c5",
    title: "Kitchen quote: what's excluded",
    updated_label: "Tue, 6 Oct",
    messages: [
      {
        id: "m11",
        role: "user",
        content: "What's excluded from the Harrow Joinery kitchen quote?",
        created_at: "19:48",
        state: "complete",
        citations: [],
      },
      {
        id: "m12",
        role: "assistant",
        content: ANSWER_KITCHEN.text,
        created_at: "19:49",
        state: "complete",
        kind: "grounded",
        citations: ANSWER_KITCHEN.citations,
      },
    ],
  },
  {
    id: "c6",
    title: "Radiator balancing steps",
    updated_label: "Wed, 30 Sep",
    messages: [
      {
        id: "m13",
        role: "user",
        content: "Walk me through balancing the radiators the way the manual describes it.",
        created_at: "20:15",
        state: "complete",
        citations: [],
      },
      {
        id: "m14",
        role: "assistant",
        content:
          "Close every lockshield valve fully, then open the one on the radiator furthest from the pump by a quarter turn. Bring the system up to temperature and measure the flow and return",
        created_at: "20:15",
        state: "error",
        kind: "grounded",
        citations: [],
      },
    ],
  },
];

const SUGGESTIONS = [
  "What notice do I have to give before moving out?",
  "What's the excess on an escape of water claim?",
  "Is the worktop included in the Harrow Joinery quote?",
];

function resolveAnswer(question) {
  const q = question.toLowerCase();
  if (/boiler|servic|vaillant|warrant|benchmark|flue|condensate/.test(q)) return ANSWER_BOILER;
  if (/deposit|tenanc|notice|landlord|rent|move out|flat 3b/.test(q)) return ANSWER_TENANCY;
  if (/insur|policy|water|leak|excess|claim|escape/.test(q)) return ANSWER_POLICY;
  if (/kitchen|quote|joinery|worktop|exclud|harrow/.test(q)) return ANSWER_KITCHEN;
  return { kind: "refusal", text: REFUSAL_TEXT, citations: [] };
}

export default function Screen() {
  const navigate = useNavigate();
  const ink = shade(brand.neutralColor, 0.42);
  const muted = brand.neutralColor;
  const line = rgba(brand.neutralColor, 0.22);
  const hairline = rgba(brand.neutralColor, 0.14);
  const paper = tint(brand.backgroundColor, 0.72);
  const wash = rgba(brand.neutralColor, 0.05);
  const r = brand.radius;

  const [conversations, setConversations] = React.useState(INITIAL_CONVERSATIONS);
  const [activeId, setActiveId] = React.useState("c1");
  const [query, setQuery] = React.useState("");
  const [draft, setDraft] = React.useState("");
  const [pending, setPending] = React.useState(null);
  const [notice, setNotice] = React.useState(null);
  const [renameId, setRenameId] = React.useState(null);
  const [renameSource, setRenameSource] = React.useState("sidebar");
  const [renameValue, setRenameValue] = React.useState("");
  const [confirmId, setConfirmId] = React.useState(null);
  const [openCitation, setOpenCitation] = React.useState({});
  const [sidebarOpen, setSidebarOpen] = React.useState(false);
  const [usage, setUsage] = React.useState(INITIAL_USAGE);

  const idRef = React.useRef(100);
  const sendTimes = React.useRef([]);
  const endRef = React.useRef(null);
  const composerRef = React.useRef(null);

  const active = conversations.find((c) => c.id === activeId) || conversations[0];

  const patchMessage = (convId, msgId, patch) =>
    setConversations((prev) =>
      prev.map((c) =>
        c.id !== convId
          ? c
          : { ...c, messages: c.messages.map((m) => (m.id !== msgId ? m : { ...m, ...patch })) }
      )
    );

  React.useEffect(() => {
    if (!pending) return undefined;
    const tokens = pending.text.split(/(\s+)/);
    let i = 0;
    let tick = null;
    const start = setTimeout(() => {
      tick = setInterval(() => {
        i += 5;
        if (i >= tokens.length) {
          clearInterval(tick);
          patchMessage(pending.convId, pending.msgId, {
            content: pending.text,
            state: "complete",
            kind: pending.kind,
            citations: pending.citations,
          });
          setPending(null);
        } else {
          patchMessage(pending.convId, pending.msgId, {
            content: tokens.slice(0, i).join(""),
            state: "streaming",
          });
        }
      }, 55);
    }, 950);
    return () => {
      clearTimeout(start);
      if (tick) clearInterval(tick);
    };
  }, [pending]);

  React.useEffect(() => {
    const el = endRef.current;
    if (!el || !el.scrollIntoView) return;
    const reduce =
      typeof window !== "undefined" &&
      window.matchMedia &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    el.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "end" });
  }, [activeId, active ? active.messages.length : 0, pending ? pending.msgId : null]);

  const filtered = conversations.filter((c) => {
    const q = query.trim().toLowerCase();
    if (!q) return true;
    return (
      c.title.toLowerCase().includes(q) ||
      c.messages.some((m) => m.content.toLowerCase().includes(q))
    );
  });

  const nextId = (prefix) => {
    idRef.current += 1;
    return prefix + idRef.current;
  };

  const startNewChat = () => {
    const id = nextId("c");
    setConversations((prev) => [
      { id, title: "New chat", updated_label: "Draft", messages: [], draft: true },
      ...prev,
    ]);
    setActiveId(id);
    setNotice(null);
    setConfirmId(null);
    setRenameId(null);
    setSidebarOpen(false);
    if (composerRef.current) composerRef.current.focus();
  };

  const openConversation = (id) => {
    setActiveId(id);
    setConfirmId(null);
    setRenameId(null);
    setNotice(null);
    setSidebarOpen(false);
  };

  const commitRename = () => {
    const value = renameValue.trim();
    if (!value) return;
    setConversations((prev) =>
      prev.map((c) => (c.id === renameId ? { ...c, title: value, draft: false } : c))
    );
    setRenameId(null);
  };

  const deleteConversation = (id) => {
    setConversations((prev) => {
      const next = prev.filter((c) => c.id !== id);
      if (next.length === 0) {
        const fresh = { id: nextId("c"), title: "New chat", updated_label: "Draft", messages: [], draft: true };
        setActiveId(fresh.id);
        return [fresh];
      }
      if (id === activeId) {
        const fresh = { id: nextId("c"), title: "New chat", updated_label: "Draft", messages: [], draft: true };
        setActiveId(fresh.id);
        return [fresh, ...next];
      }
      return next;
    });
    setConfirmId(null);
    if (pending && pending.convId === id) setPending(null);
  };

  const handleSend = (e) => {
    if (e) e.preventDefault();
    const q = draft.trim();
    if (!q) return;
    if (pending) {
      setNotice({
        kind: "busy",
        title: "One answer at a time",
        body: "Your last question is still being answered. It will finish in a moment.",
      });
      return;
    }
    if (usage.messages_this_month >= usage.message_limit) {
      setNotice({
        kind: "quota",
        title: "You've used all " + usage.message_limit + " messages this month",
        body: "Your quota resets on " + usage.month_reset_at + ". Nothing was sent to Gemini, and your question is still in the box.",
      });
      return;
    }
    const now = Date.now();
    const recent = sendTimes.current.filter((t) => now - t < 20000);
    if (recent.length >= 3) {
      setNotice({
        kind: "rate",
        title: "You're sending messages too quickly",
        body: "Give it about twenty seconds and send again — your question has been kept.",
      });
      return;
    }
    sendTimes.current = recent.concat(now);

    const answer = resolveAnswer(q);
    const userId = nextId("m");
    const botId = nextId("m");
    const isFirst = active.messages.length === 0;
    const derived = q.length > 46 ? q.slice(0, 46).trim() + "…" : q;

    setConversations((prev) => {
      const target = prev.find((c) => c.id === activeId);
      if (!target) return prev;
      const updated = {
        ...target,
        title: isFirst ? derived : target.title,
        draft: false,
        updated_label: "Just now",
        messages: target.messages.concat([
          { id: userId, role: "user", content: q, created_at: "Just now", state: "complete", citations: [] },
          { id: botId, role: "assistant", content: "", created_at: "Just now", state: "thinking", kind: answer.kind, citations: [] },
        ]),
      };
      return [updated].concat(prev.filter((c) => c.id !== activeId));
    });

    setUsage((u) => ({ ...u, messages_this_month: u.messages_this_month + 1 }));
    setDraft("");
    setNotice(null);
    setPending({ convId: activeId, msgId: botId, text: answer.text, citations: answer.citations, kind: answer.kind });
  };

  const retryMessage = (msg) => {
    const idx = active.messages.findIndex((m) => m.id === msg.id);
    const question = idx > 0 ? active.messages[idx - 1].content : "";
    const answer = resolveAnswer(question);
    patchMessage(active.id, msg.id, { content: "", state: "thinking", citations: [] });
    setPending({ convId: active.id, msgId: msg.id, text: answer.text, citations: answer.citations, kind: answer.kind });
  };

  const onComposerKey = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const msgPct = Math.min(100, Math.round((usage.messages_this_month / usage.message_limit) * 100));
  const storagePct = Math.min(100, Math.round((usage.storage_bytes / usage.storage_limit) * 100));

  const labelCls = "text-[11px] font-semibold uppercase tracking-[0.16em]";

  const styleTag = `
    .rr-focus:focus-visible { outline: 2px solid ${brand.primaryColor}; outline-offset: 2px; }
    @keyframes rr-rise { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: none; } }
    .rr-rise { animation: rr-rise 340ms cubic-bezier(.2,.7,.3,1) both; }
    @keyframes rr-pulse { 0%, 80%, 100% { opacity: .25; } 40% { opacity: 1; } }
    .rr-dot { animation: rr-pulse 1.3s ease-in-out infinite; }
    @keyframes rr-blink { 0%, 49% { opacity: 1; } 50%, 100% { opacity: 0; } }
    .rr-caret { animation: rr-blink 1s step-end infinite; }
    .rr-row .rr-actions { opacity: 0; transition: opacity 160ms ease; }
    .rr-row:hover .rr-actions, .rr-row:focus-within .rr-actions { opacity: 1; }
    @media (max-width: 1023px) { .rr-row .rr-actions { opacity: 1; } }
    @media (prefers-reduced-motion: reduce) {
      .rr-rise, .rr-dot, .rr-caret { animation: none !important; }
      .rr-row .rr-actions { transition: none; }
    }
  `;

  const Citation = ({ cite, msgId, index }) => {
    const key = msgId + "-" + index;
    const open = !!openCitation[key];
    return (
      <li className="rr-rise">
        <blockquote
          className="pl-5 sm:pl-6"
          style={{ borderLeft: `2px solid ${brand.accentColor}` }}
        >
          <p className="text-[15.5px] leading-[1.75]" style={{ color: ink, fontStyle: "italic" }}>
            “{open && cite.full_passage ? cite.full_passage : cite.quoted_passage}”
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-2">
            <span className="inline-flex items-center gap-2" style={{ color: muted }}>
              <FileText className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
              <span className="text-[12.5px]" style={{ fontVariantNumeric: "tabular-nums" }}>
                {cite.document_name} · {cite.page_ref}
              </span>
            </span>
            {cite.deleted ? (
              <span
                className="inline-flex items-center gap-1.5 px-2 py-0.5 text-[11px] font-medium"
                style={{ color: muted, backgroundColor: wash, borderRadius: r }}
              >
                <AlertCircle className="h-3 w-3" aria-hidden="true" />
                No longer in your library
              </span>
            ) : null}
            {cite.full_passage ? (
              <button
                type="button"
                className="rr-focus text-[12.5px] font-semibold underline underline-offset-4"
                style={{ color: brand.accentColor, borderRadius: r }}
                onClick={() => setOpenCitation((prev) => ({ ...prev, [key]: !open }))}
                aria-expanded={open}
              >
                {open ? "Show less" : "Show full passage"}
              </button>
            ) : null}
          </div>
        </blockquote>
      </li>
    );
  };

  const renderAssistant = (m) => {
    if (m.state === "thinking") {
      return (
        <div className="mt-5 flex items-center gap-3" style={{ color: muted }}>
          <span className="flex gap-1" aria-hidden="true">
            <span className="rr-dot h-1.5 w-1.5 rounded-full" style={{ backgroundColor: brand.accentColor }} />
            <span className="rr-dot h-1.5 w-1.5 rounded-full" style={{ backgroundColor: brand.accentColor, animationDelay: "160ms" }} />
            <span className="rr-dot h-1.5 w-1.5 rounded-full" style={{ backgroundColor: brand.accentColor, animationDelay: "320ms" }} />
          </span>
          <span className="text-[14px]">Reading your library for relevant passages…</span>
        </div>
      );
    }

    if (m.state === "error") {
      return (
        <div className="mt-5 rr-rise" style={{ borderRadius: r, border: `1px solid ${rgba(brand.accentColor, 0.4)}`, backgroundColor: rgba(brand.accentColor, 0.06) }}>
          <div className="p-5 sm:p-6">
            <h3 className="flex items-center gap-2 text-[15px] font-semibold" style={{ color: shade(brand.accentColor, 0.8) }}>
              <AlertCircle className="h-4 w-4" aria-hidden="true" />
              The answer stopped partway through
            </h3>
            <p className="mt-2 text-[14.5px] leading-relaxed" style={{ color: ink }}>
              The connection to Gemini dropped mid-stream, so this answer is incomplete and was not saved as finished. Nothing below has been cited yet.
            </p>
            <p className="mt-4 pl-4 text-[15px] leading-[1.75]" style={{ color: muted, borderLeft: `2px solid ${line}` }}>
              {m.content}…
            </p>
            <div className="mt-5">
              <button
                type="button"
                onClick={() => retryMessage(m)}
                className="rr-focus inline-flex items-center gap-2 px-4 py-2 text-[14px] font-semibold"
                style={{ backgroundColor: brand.primaryColor, color: tint(brand.backgroundColor, 0.85), borderRadius: r }}
              >
                Ask again
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>
          </div>
        </div>
      );
    }

    const streaming = m.state === "streaming";
    const isRefusal = m.kind === "refusal";
    const isProcessing = m.kind === "processing";

    return (
      <div className="mt-5 pl-5 sm:pl-7" style={{ borderLeft: `2px solid ${rgba(brand.primaryColor, 0.18)}` }}>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
          <span className={labelCls} style={{ color: muted }}>
            {isRefusal ? "No grounded answer" : isProcessing ? "Not yet readable" : "Answer"}
          </span>
          {streaming ? (
            <span className="text-[11px] font-medium" style={{ color: brand.accentColor }}>
              streaming…
            </span>
          ) : m.citations.length > 0 ? (
            <span
              className="inline-flex items-center gap-1.5 px-2 py-0.5 text-[11px] font-medium"
              style={{ color: shade(brand.primaryColor, 0.9), backgroundColor: rgba(brand.primaryColor, 0.1), borderRadius: r }}
            >
              <CheckCircle className="h-3 w-3" aria-hidden="true" />
              {m.citations.length} citation{m.citations.length === 1 ? "" : "s"}
            </span>
          ) : null}
          {m.kind === "partial" && !streaming ? (
            <span
              className="inline-flex items-center gap-1.5 px-2 py-0.5 text-[11px] font-medium"
              style={{ color: shade(brand.accentColor, 0.85), backgroundColor: rgba(brand.accentColor, 0.1), borderRadius: r }}
            >
              Partly answered
            </span>
          ) : null}
        </div>

        <div className="mt-3 space-y-4">
          {m.content.split("\n\n").map((para, i, arr) => (
            <p
              key={i}
              className="text-[17px] leading-[1.78] max-w-[68ch]"
              style={{ color: isRefusal && i === 0 ? shade(brand.accentColor, 0.78) : ink, fontWeight: isRefusal && i === 0 ? 600 : 400 }}
            >
              {para}
              {streaming && i === arr.length - 1 ? (
                <span className="rr-caret ml-0.5 inline-block h-[1.05em] w-[2px] align-text-bottom" style={{ backgroundColor: brand.accentColor }} aria-hidden="true" />
              ) : null}
            </p>
          ))}
        </div>

        {m.citations.length > 0 && !streaming ? (
          <div className="mt-7">
            <h3 className={labelCls} style={{ color: muted }}>
              Where this came from
            </h3>
            <ul className="mt-4 space-y-6">
              {m.citations.map((c, i) => (
                <Citation key={i} cite={c} msgId={m.id} index={i} />
              ))}
            </ul>
          </div>
        ) : null}

        {isRefusal && !streaming ? (
          <div className="mt-6">
            <button
              type="button"
              onClick={() => navigate("library")}
              className="rr-focus inline-flex items-center gap-2 px-4 py-2 text-[14px] font-semibold"
              style={{ border: `1px solid ${line}`, color: shade(brand.primaryColor, 0.95), backgroundColor: paper, borderRadius: r }}
            >
              <Upload className="h-4 w-4" aria-hidden="true" />
              Add a document to your library
            </button>
          </div>
        ) : null}

        {isProcessing && !streaming ? (
          <div className="mt-6">
            <button
              type="button"
              onClick={() => navigate("library")}
              className="rr-focus inline-flex items-center gap-2 px-4 py-2 text-[14px] font-semibold"
              style={{ border: `1px solid ${line}`, color: shade(brand.primaryColor, 0.95), backgroundColor: paper, borderRadius: r }}
            >
              <Clock className="h-4 w-4" aria-hidden="true" />
              Check processing status
            </button>
          </div>
        ) : null}
      </div>
    );
  };

  return (
    <div style={{ backgroundColor: brand.backgroundColor, fontFamily: brand.fontBody, color: ink }}>
      <style>{styleTag}</style>

      <div className="mx-auto w-full max-w-[1400px] px-5 py-8 sm:px-8 lg:px-10 lg:py-12">
        <div className="lg:grid lg:grid-cols-[19rem_minmax(0,1fr)] lg:gap-12 xl:gap-16">
          {/* ---------- Sidebar ---------- */}
          <aside
            aria-label="Conversations and library"
            className={(sidebarOpen ? "block" : "hidden") + " lg:block mb-8 lg:mb-0"}
          >
            <div className="lg:sticky lg:top-8">
              <Button
                type="button"
                onClick={startNewChat}
                className="rr-focus w-full justify-center"
                style={{
                  backgroundColor: brand.primaryColor,
                  color: tint(brand.backgroundColor, 0.88),
                  borderRadius: r,
                  width: "100%",
                  padding: "0.7rem 1rem",
                  fontWeight: 600,
                  fontSize: "14px",
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "0.5rem",
                }}
              >
                <Plus className="h-4 w-4" aria-hidden="true" />
                New chat
              </Button>

              <div className="mt-7">
                <Label htmlFor="chat-search" className={labelCls} style={{ color: muted, display: "block", marginBottom: "0.5rem" }}>
                  Find a chat
                </Label>
                <div className="relative">
                  <Search
                    className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2"
                    style={{ color: muted }}
                    aria-hidden="true"
                  />
                  <Input
                    id="chat-search"
                    type="search"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="deposit, boiler…"
                    className="rr-focus w-full"
                    style={{
                      width: "100%",
                      backgroundColor: paper,
                      border: `1px solid ${line}`,
                      borderRadius: r,
                      padding: "0.55rem 0.75rem 0.55rem 2.25rem",
                      fontSize: "14px",
                      color: ink,
                    }}
                  />
                </div>
              </div>

              <h2 className={labelCls + " mt-8"} style={{ color: muted }}>
                Saved chats
                <span style={{ fontVariantNumeric: "tabular-nums", fontWeight: 400 }}> · {conversations.length}</span>
              </h2>

              {filtered.length === 0 ? (
                <div
                  className="mt-4 px-4 py-6"
                  style={{ border: `1px dashed ${line}`, borderRadius: r, backgroundColor: wash }}
                >
                  <p className="text-[13.5px] leading-relaxed" style={{ color: muted }}>
                    {query.trim()
                      ? "No chat titles or messages match “" + query.trim() + "”."
                      : "Nothing saved yet. Your chats appear here as soon as you ask a first question."}
                  </p>
                </div>
              ) : (
                <ul className="mt-3 -mx-2">
                  {filtered.map((c) => {
                    const isActive = c.id === activeId;
                    const isRenaming = renameId === c.id && renameSource === "sidebar";
                    return (
                      <li key={c.id} className="rr-row rr-rise">
                        {isRenaming ? (
                          <div className="px-2 py-2">
                            <Label htmlFor={"rename-" + c.id} className="sr-only">
                              Conversation name
                            </Label>
                            <Input
                              id={"rename-" + c.id}
                              value={renameValue}
                              onChange={(e) => setRenameValue(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === "Enter") { e.preventDefault(); commitRename(); }
                                if (e.key === "Escape") setRenameId(null);
                              }}
                              className="rr-focus w-full"
                              style={{
                                width: "100%",
                                backgroundColor: paper,
                                border: `1px solid ${brand.primaryColor}`,
                                borderRadius: r,
                                padding: "0.45rem 0.6rem",
                                fontSize: "13.5px",
                                color: ink,
                              }}
                            />
                            <div className="mt-2 flex gap-2">
                              <button
                                type="button"
                                onClick={commitRename}
                                className="rr-focus inline-flex items-center gap-1.5 px-2.5 py-1 text-[12.5px] font-semibold"
                                style={{ backgroundColor: brand.primaryColor, color: tint(brand.backgroundColor, 0.88), borderRadius: r }}
                              >
                                <Check className="h-3.5 w-3.5" aria-hidden="true" />
                                Save name
                              </button>
                              <button
                                type="button"
                                onClick={() => setRenameId(null)}
                                className="rr-focus px-2.5 py-1 text-[12.5px] font-semibold"
                                style={{ color: muted, borderRadius: r }}
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        ) : confirmId === c.id ? (
                          <div className="px-3 py-3" style={{ backgroundColor: rgba(brand.accentColor, 0.08), borderRadius: r }}>
                            <p className="text-[13px] leading-snug" style={{ color: ink }}>
                              Delete “{c.title}” and its messages? This can't be undone.
                            </p>
                            <div className="mt-2.5 flex gap-2">
                              <button
                                type="button"
                                onClick={() => deleteConversation(c.id)}
                                className="rr-focus px-2.5 py-1 text-[12.5px] font-semibold"
                                style={{ backgroundColor: brand.accentColor, color: tint(brand.backgroundColor, 0.92), borderRadius: r }}
                              >
                                Delete chat
                              </button>
                              <button
                                type="button"
                                onClick={() => setConfirmId(null)}
                                className="rr-focus px-2.5 py-1 text-[12.5px] font-semibold"
                                style={{ color: muted, borderRadius: r }}
                              >
                                Keep it
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div
                            className="flex items-start gap-1 px-2 py-2"
                            style={{
                              borderRadius: r,
                              backgroundColor: isActive ? rgba(brand.primaryColor, 0.09) : "transparent",
                              boxShadow: isActive ? `inset 2px 0 0 0 ${brand.primaryColor}` : "none",
                            }}
                          >
                            <button
                              type="button"
                              onClick={() => openConversation(c.id)}
                              aria-current={isActive ? "true" : undefined}
                              className="rr-focus min-w-0 flex-1 px-1 py-0.5 text-left"
                              style={{ borderRadius: r }}
                            >
                              <span
                                className="block truncate text-[13.5px]"
                                style={{ color: isActive ? shade(brand.primaryColor, 0.9) : ink, fontWeight: isActive ? 600 : 500 }}
                              >
                                {c.title}
                              </span>
                              <span
                                className="mt-0.5 block text-[11.5px]"
                                style={{ color: muted, fontVariantNumeric: "tabular-nums" }}
                              >
                                {c.draft ? "Not saved yet" : c.updated_label + " · " + c.messages.length + " messages"}
                              </span>
                            </button>
                            <span className="rr-actions flex shrink-0 gap-0.5">
                              <button
                                type="button"
                                aria-label={"Rename " + c.title}
                                onClick={() => { setRenameId(c.id); setRenameSource("sidebar"); setRenameValue(c.title); }}
                                className="rr-focus p-1.5"
                                style={{ color: muted, borderRadius: r }}
                              >
                                <Edit className="h-3.5 w-3.5" aria-hidden="true" />
                              </button>
                              <button
                                type="button"
                                aria-label={"Delete " + c.title}
                                onClick={() => setConfirmId(c.id)}
                                className="rr-focus p-1.5"
                                style={{ color: muted, borderRadius: r }}
                              >
                                <Trash className="h-3.5 w-3.5" aria-hidden="true" />
                              </button>
                            </span>
                          </div>
                        )}
                      </li>
                    );
                  })}
                </ul>
              )}

              <Separator className="my-7" style={{ backgroundColor: hairline, height: "1px", border: "none", display: "block", margin: "1.75rem 0" }} />

              <h2 className={labelCls} style={{ color: muted }}>
                Your library
              </h2>
              <button
                type="button"
                onClick={() => navigate("library")}
                className="rr-focus mt-3 flex w-full items-center justify-between gap-3 px-3 py-3 text-left"
                style={{ border: `1px solid ${line}`, borderRadius: r, backgroundColor: paper }}
              >
                <span>
                  <span className="block text-[13.5px] font-semibold" style={{ color: ink, fontVariantNumeric: "tabular-nums" }}>
                    {LIBRARY.ready} documents ready
                  </span>
                  <span className="mt-0.5 block text-[11.5px]" style={{ color: muted }}>
                    {LIBRARY.processing} processing · {LIBRARY.failed} failed
                  </span>
                </span>
                <ChevronRight className="h-4 w-4 shrink-0" style={{ color: muted }} aria-hidden="true" />
              </button>

              <p className="mt-3 flex items-start gap-2 text-[12px] leading-relaxed" style={{ color: muted }}>
                <Clock className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                <span>
                  {LIBRARY.processing_name} is still being embedded — answers won't draw on it until it's ready.
                </span>
              </p>

              <div className="mt-7 space-y-5">
                <div>
                  <div className="flex items-baseline justify-between">
                    <span className="text-[12.5px]" style={{ color: muted }}>Messages this month</span>
                    <span className="text-[12.5px] font-semibold" style={{ color: ink, fontVariantNumeric: "tabular-nums" }}>
                      {usage.messages_this_month} / {usage.message_limit}
                    </span>
                  </div>
                  <div className="mt-2 h-1.5 w-full overflow-hidden" style={{ backgroundColor: rgba(brand.neutralColor, 0.15), borderRadius: "999px" }}>
                    <div
                      className="h-full transition-all duration-500"
                      style={{ width: msgPct + "%", backgroundColor: msgPct >= 90 ? brand.accentColor : brand.primaryColor, borderRadius: "999px" }}
                    />
                  </div>
                  <p className="mt-1.5 text-[11.5px]" style={{ color: muted }}>
                    Resets {usage.month_reset_at}
                  </p>
                </div>
                <div>
                  <div className="flex items-baseline justify-between">
                    <span className="text-[12.5px]" style={{ color: muted }}>Storage used</span>
                    <span className="text-[12.5px] font-semibold" style={{ color: ink, fontVariantNumeric: "tabular-nums" }}>
                      {(usage.storage_bytes / 1048576).toFixed(1)} / {Math.round(usage.storage_limit / 1048576)} MB
                    </span>
                  </div>
                  <div className="mt-2 h-1.5 w-full overflow-hidden" style={{ backgroundColor: rgba(brand.neutralColor, 0.15), borderRadius: "999px" }}>
                    <div className="h-full transition-all duration-500" style={{ width: storagePct + "%", backgroundColor: brand.primaryColor, borderRadius: "999px" }} />
                  </div>
                  <p className="mt-1.5 text-[11.5px]" style={{ color: muted, fontVariantNumeric: "tabular-nums" }}>
                    {usage.document_count} of {usage.document_limit} documents
                  </p>
                </div>
              </div>
            </div>
          </aside>

          {/* ---------- Main column ---------- */}
          <main className="min-w-0">
            <div className="lg:hidden mb-6">
              <button
                type="button"
                onClick={() => setSidebarOpen((v) => !v)}
                aria-expanded={sidebarOpen}
                className="rr-focus inline-flex items-center gap-2 px-3 py-2 text-[13.5px] font-semibold"
                style={{ border: `1px solid ${line}`, borderRadius: r, color: ink, backgroundColor: paper }}
              >
                <Menu className="h-4 w-4" aria-hidden="true" />
                {sidebarOpen ? "Hide chats & library" : "Chats & library"}
              </button>
            </div>

            <header className="flex flex-wrap items-start justify-between gap-x-8 gap-y-4">
              <div className="min-w-0 flex-1">
                <p className={labelCls} style={{ color: brand.accentColor }}>
                  Reading room
                </p>
                {renameId === active.id && renameSource === "header" ? (
                  <h1 className="mt-2 flex flex-wrap items-center gap-2">
                    <Label htmlFor="rename-header" className="sr-only">Conversation name</Label>
                    <Input
                      id="rename-header"
                      value={renameValue}
                      onChange={(e) => setRenameValue(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") { e.preventDefault(); commitRename(); }
                        if (e.key === "Escape") setRenameId(null);
                      }}
                      className="rr-focus"
                      style={{
                        fontFamily: brand.fontHeading,
                        fontSize: "26px",
                        fontWeight: 600,
                        letterSpacing: "-0.015em",
                        color: ink,
                        backgroundColor: paper,
                        border: `1px solid ${brand.primaryColor}`,
                        borderRadius: r,
                        padding: "0.3rem 0.6rem",
                        minWidth: "min(26rem, 100%)",
                      }}
                    />
                    <button
                      type="button"
                      onClick={commitRename}
                      className="rr-focus inline-flex items-center gap-1.5 px-3 py-2 text-[13px] font-semibold"
                      style={{ backgroundColor: brand.primaryColor, color: tint(brand.backgroundColor, 0.88), borderRadius: r }}
                    >
                      <Check className="h-3.5 w-3.5" aria-hidden="true" />
                      Save
                    </button>
                    <button
                      type="button"
                      onClick={() => setRenameId(null)}
                      className="rr-focus px-2 py-2 text-[13px] font-semibold"
                      style={{ color: muted, borderRadius: r }}
                    >
                      Cancel
                    </button>
                  </h1>
                ) : (
                  <h1
                    className="mt-2 text-[28px] sm:text-[32px] font-semibold leading-tight tracking-[-0.015em]"
                    style={{ fontFamily: brand.fontHeading, color: shade(brand.primaryColor, 0.9) }}
                  >
                    {active.title}
                  </h1>
                )}
                <p className="mt-2 text-[13.5px]" style={{ color: muted, fontVariantNumeric: "tabular-nums" }}>
                  {active.messages.length === 0
                    ? "Nothing asked yet · answers come only from your own documents"
                    : active.messages.length + " messages · last active " + active.updated_label}
                </p>
              </div>

              <div className="flex shrink-0 items-center gap-2">
                <button
                  type="button"
                  onClick={() => { setRenameId(active.id); setRenameSource("header"); setRenameValue(active.title); }}
                  className="rr-focus inline-flex items-center gap-2 px-3 py-2 text-[13.5px] font-semibold"
                  style={{ border: `1px solid ${line}`, borderRadius: r, color: ink, backgroundColor: paper }}
                >
                  <Edit className="h-3.5 w-3.5" aria-hidden="true" />
                  Rename
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmId(active.id)}
                  className="rr-focus inline-flex items-center gap-2 px-3 py-2 text-[13.5px] font-semibold"
                  style={{ border: `1px solid ${line}`, borderRadius: r, color: ink, backgroundColor: paper }}
                >
                  <Trash className="h-3.5 w-3.5" aria-hidden="true" />
                  Delete
                </button>
              </div>
            </header>

            <Separator style={{ backgroundColor: hairline, height: "1px", border: "none", display: "block", margin: "2rem 0 0" }} />

            {/* thread */}
            <div className="py-10">
              {active.messages.length === 0 ? (
                <div className="rr-rise max-w-[62ch] py-6">
                  <h2 className="text-[22px] font-semibold leading-snug" style={{ fontFamily: brand.fontHeading, color: shade(brand.primaryColor, 0.9) }}>
                    A clean page, and five documents already read.
                  </h2>
                  <p className="mt-3 text-[16px] leading-[1.75]" style={{ color: ink }}>
                    Ask anything that lives in your library. Every answer is built from passages found in your own files and shows you the quoted text it came from — and if nothing in your documents covers the question, it will say so instead of guessing.
                  </p>
                  <h3 className={labelCls + " mt-9"} style={{ color: muted }}>
                    Try one of these
                  </h3>
                  <ul className="mt-4 space-y-3">
                    {SUGGESTIONS.map((s) => (
                      <li key={s}>
                        <button
                          type="button"
                          onClick={() => {
                            setDraft(s);
                            if (composerRef.current) composerRef.current.focus();
                          }}
                          className="rr-focus group flex w-full items-center justify-between gap-4 px-4 py-3.5 text-left"
                          style={{ border: `1px solid ${line}`, borderRadius: r, backgroundColor: paper }}
                        >
                          <span className="text-[15px]" style={{ color: ink }}>{s}</span>
                          <ArrowRight className="h-4 w-4 shrink-0" style={{ color: brand.accentColor }} aria-hidden="true" />
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : (
                <ol className="space-y-12">
                  {active.messages.map((m) =>
                    m.role === "user" ? (
                      <li key={m.id} className="rr-rise">
                        <p className={labelCls} style={{ color: muted, fontVariantNumeric: "tabular-nums" }}>
                          You asked · {m.created_at}
                        </p>
                        <p className="mt-2 max-w-[62ch] text-[18px] font-semibold leading-snug" style={{ color: ink }}>
                          {m.content}
                        </p>
                      </li>
                    ) : (
                      <li key={m.id}>{renderAssistant(m)}</li>
                    )
                  )}
                </ol>
              )}
              <div ref={endRef} />
            </div>

            <div className="sr-only" role="status" aria-live="polite">
              {pending ? "Answer in progress" : ""}
            </div>

            {/* composer */}
            <div className="sticky bottom-0 pb-6 pt-2" style={{ backgroundColor: brand.backgroundColor }}>
              {notice ? (
                <div
                  className="rr-rise mb-4 flex items-start gap-3 px-4 py-3.5"
                  style={{
                    border: `1px solid ${rgba(brand.accentColor, 0.42)}`,
                    backgroundColor: rgba(brand.accentColor, 0.08),
                    borderRadius: r,
                  }}
                >
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" style={{ color: brand.accentColor }} aria-hidden="true" />
                  <div className="min-w-0 flex-1">
                    <p className="text-[13.5px] font-semibold" style={{ color: shade(brand.accentColor, 0.8) }}>
                      {notice.title}
                    </p>
                    <p className="mt-1 text-[13.5px] leading-relaxed" style={{ color: ink }}>
                      {notice.body}
                    </p>
                    {notice.kind === "quota" ? (
                      <button
                        type="button"
                        onClick={() => navigate("account")}
                        className="rr-focus mt-2 text-[13px] font-semibold underline underline-offset-4"
                        style={{ color: brand.accentColor, borderRadius: r }}
                      >
                        See your usage
                      </button>
                    ) : null}
                  </div>
                  <button
                    type="button"
                    aria-label="Dismiss message"
                    onClick={() => setNotice(null)}
                    className="rr-focus p-1"
                    style={{ color: muted, borderRadius: r }}
                  >
                    <X className="h-4 w-4" aria-hidden="true" />
                  </button>
                </div>
              ) : null}

              <form
                onSubmit={handleSend}
                className="p-4 sm:p-5"
                style={{
                  backgroundColor: paper,
                  border: `1px solid ${line}`,
                  borderRadius: r,
                  boxShadow: `0 1px 0 0 ${rgba(brand.neutralColor, 0.06)}, 0 12px 28px -24px ${rgba(brand.neutralColor, 0.8)}`,
                }}
              >
                <Label htmlFor="ask" className={labelCls} style={{ color: muted, display: "block", marginBottom: "0.6rem" }}>
                  Ask your library
                </Label>
                <Textarea
                  id="ask"
                  ref={composerRef}
                  rows={2}
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  onKeyDown={onComposerKey}
                  placeholder="e.g. What happens to my deposit at the end of the tenancy?"
                  className="rr-focus w-full"
                  style={{
                    width: "100%",
                    resize: "none",
                    backgroundColor: "transparent",
                    border: "none",
                    outlineOffset: "4px",
                    fontSize: "16.5px",
                    lineHeight: 1.65,
                    color: ink,
                    fontFamily: brand.fontBody,
                  }}
                />
                <div className="mt-4 flex flex-wrap items-center justify-between gap-x-6 gap-y-3">
                  <p className="text-[12px] leading-relaxed" style={{ color: muted, maxWidth: "42ch" }}>
                    Answers are drawn only from your {LIBRARY.ready} ready documents. Enter sends, Shift + Enter starts a new line.
                  </p>
                  <Button
                    type="submit"
                    disabled={!draft.trim() || !!pending}
                    className="rr-focus"
                    style={{
                      backgroundColor: !draft.trim() || pending ? rgba(brand.primaryColor, 0.35) : brand.primaryColor,
                      color: tint(brand.backgroundColor, 0.9),
                      borderRadius: r,
                      padding: "0.65rem 1.3rem",
                      fontWeight: 600,
                      fontSize: "14.5px",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "0.5rem",
                      cursor: !draft.trim() || pending ? "not-allowed" : "pointer",
                    }}
                  >
                    {pending ? "Answering…" : "Ask"}
                    <ArrowRight className="h-4 w-4" aria-hidden="true" />
                  </Button>
                </div>
              </form>
              <p className="mt-3 text-center text-[11.5px]" style={{ color: muted, fontVariantNumeric: "tabular-nums" }}>
                {usage.message_limit - usage.messages_this_month} messages left this month · resets {usage.month_reset_at}
              </p>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
