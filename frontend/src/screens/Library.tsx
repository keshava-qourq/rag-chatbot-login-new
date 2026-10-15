// @ts-nocheck -- generated from the approved design under its JS runtime contract; not hand-written TypeScript.
/* eslint-disable @typescript-eslint/no-unused-vars */
import React from "react";

import * as UI from "@/lib/ui";
import { Icons } from "@/lib/icons";
import { brand } from "@/lib/brand";
import { useNavigate } from "@/lib/navigate";

const { Button, Card, CardHeader, CardTitle, CardContent, Input, Label, Badge, Table, THead, TBody, TR, TH, TD, Separator } = UI;
const { Plus, Search, Check, X, ChevronRight, FileText, Package, Clock, Trash, Filter, Upload, ArrowRight, AlertCircle, CheckCircle } = Icons;

const SUPPORTED_EXTS = ["pdf", "docx", "txt", "md"];
const MAX_FILE_BYTES = 25 * 1024 * 1024;
const DOC_CAP = 25;
const STORAGE_CAP = 200 * 1024 * 1024;
const MESSAGE_CAP = 300;
const MESSAGES_USED = 142;
const MESSAGE_RESET = "1 November";
const UPLOAD_WINDOW_MS = 60000;
const UPLOAD_LIMIT_PER_WINDOW = 5;
const TODAY_KEY = "2026-10-15";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const INITIAL_DOCS = [
  {
    id: "doc_1184",
    filename: "Vestra EV Charger — Installation Guide.pdf",
    size_bytes: 3250586,
    page_count: 48,
    status: "processing",
    failure_reason: null,
    created_at: "2026-10-15T08:41:00",
  },
  {
    id: "doc_1183",
    filename: "Supplier contract — Brightwell Foods.pdf",
    size_bytes: 1258291,
    page_count: 27,
    status: "queued",
    failure_reason: null,
    created_at: "2026-10-15T08:44:00",
  },
  {
    id: "doc_1181",
    filename: "Hydra-9 Pressure Washer — Service Manual.pdf",
    size_bytes: 8812544,
    page_count: 212,
    status: "ready",
    failure_reason: null,
    created_at: "2026-10-14T09:12:00",
  },
  {
    id: "doc_1179",
    filename: "Warranty card (photographed).pdf",
    size_bytes: 5872026,
    page_count: 2,
    status: "failed",
    failure_reason: "No readable text could be extracted — this looks like a scan or photograph of a page.",
    created_at: "2026-10-14T08:02:00",
  },
  {
    id: "doc_1176",
    filename: "Tenancy agreement — Flat 3, Alder Court.docx",
    size_bytes: 188416,
    page_count: 14,
    status: "ready",
    failure_reason: null,
    created_at: "2026-10-13T16:35:00",
  },
  {
    id: "doc_1172",
    filename: "Q3 board minutes — 24 Sep 2026.md",
    size_bytes: 22528,
    page_count: 6,
    status: "ready",
    failure_reason: null,
    created_at: "2026-10-12T11:20:00",
  },
  {
    id: "doc_1168",
    filename: "Payroll export September 2026.pdf",
    size_bytes: 2097152,
    page_count: null,
    status: "failed",
    failure_reason: "File could not be opened — it is password-protected.",
    created_at: "2026-10-10T14:48:00",
  },
  {
    id: "doc_1164",
    filename: "Field notes — Orkney survey.txt",
    size_bytes: 49152,
    page_count: 9,
    status: "ready",
    failure_reason: null,
    created_at: "2026-10-09T07:55:00",
  },
  {
    id: "doc_1159",
    filename: "Insurance policy — Schedule B.pdf",
    size_bytes: 724992,
    page_count: 33,
    status: "ready",
    failure_reason: null,
    created_at: "2026-10-08T13:07:00",
  },
];

function hexToRgba(hex, alpha) {
  const clean = String(hex).replace("#", "");
  const full = clean.length === 3 ? clean.split("").map((c) => c + c).join("") : clean;
  const n = parseInt(full, 16);
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${alpha})`;
}

function formatBytes(bytes) {
  if (bytes < 1024) return bytes + " B";
  const kb = bytes / 1024;
  if (kb < 1024) return Math.round(kb) + " KB";
  const mb = kb / 1024;
  return (mb < 10 ? mb.toFixed(1) : Math.round(mb)) + " MB";
}

function formatWhen(iso) {
  const d = new Date(iso);
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  if (key === TODAY_KEY) return `Today, ${hh}:${mm}`;
  return `${d.getDate()} ${MONTHS[d.getMonth()]}, ${hh}:${mm}`;
}

const FILTERS = [
  { id: "all", label: "All", statuses: ["queued", "processing", "ready", "failed"] },
  { id: "ready", label: "Ready", statuses: ["ready"] },
  { id: "progress", label: "In progress", statuses: ["queued", "processing"] },
  { id: "failed", label: "Failed", statuses: ["failed"] },
];

export default function Screen() {
  const navigate = useNavigate();
  const primary = brand.primaryColor;
  const accent = brand.accentColor;
  const neutral = brand.neutralColor;
  const paper = brand.backgroundColor;
  const radius = brand.radius;

  const [docs, setDocs] = React.useState(INITIAL_DOCS);
  const [query, setQuery] = React.useState("");
  const [filter, setFilter] = React.useState("all");
  const [notice, setNotice] = React.useState(null);
  const [confirmId, setConfirmId] = React.useState(null);
  const [dragging, setDragging] = React.useState(false);
  const [live, setLive] = React.useState("");

  const inputRef = React.useRef(null);
  const timersRef = React.useRef([]);
  const uploadsRef = React.useRef([]);
  const docsRef = React.useRef(docs);
  const seqRef = React.useRef(1200);

  docsRef.current = docs;

  const schedule = React.useCallback((fn, ms) => {
    const id = setTimeout(fn, ms);
    timersRef.current.push(id);
  }, []);

  const advance = React.useCallback((id, status) => {
    const found = docsRef.current.find((d) => d.id === id);
    if (!found) return;
    setDocs((prev) => prev.map((d) => (d.id === id ? { ...d, status } : d)));
    if (status === "ready") setLive(`${found.filename} is ready to be asked about.`);
  }, []);

  React.useEffect(() => {
    schedule(() => advance("doc_1184", "ready"), 6500);
    schedule(() => advance("doc_1183", "processing"), 3200);
    schedule(() => advance("doc_1183", "ready"), 13000);
    return () => {
      timersRef.current.forEach(clearTimeout);
      timersRef.current = [];
    };
  }, [advance, schedule]);

  const storageUsed = docs.reduce((sum, d) => sum + d.size_bytes, 0);

  const counts = {};
  FILTERS.forEach((f) => {
    counts[f.id] = docs.filter((d) => f.statuses.indexOf(d.status) !== -1).length;
  });

  const activeFilter = FILTERS.find((f) => f.id === filter) || FILTERS[0];
  const trimmed = query.trim().toLowerCase();
  const visible = docs.filter(
    (d) =>
      activeFilter.statuses.indexOf(d.status) !== -1 &&
      (trimmed === "" || d.filename.toLowerCase().indexOf(trimmed) !== -1)
  );

  function handleFiles(fileList) {
    const files = Array.from(fileList || []);
    if (files.length === 0) return;

    const now = Date.now();
    uploadsRef.current = uploadsRef.current.filter((t) => now - t < UPLOAD_WINDOW_MS);
    if (uploadsRef.current.length >= UPLOAD_LIMIT_PER_WINDOW) {
      setNotice({
        kind: "limit",
        title: "You're uploading a little too quickly",
        body: `We accept ${UPLOAD_LIMIT_PER_WINDOW} uploads a minute per account. Nothing was lost — try these again in under a minute.`,
        items: files.map((f) => f.name),
      });
      return;
    }
    uploadsRef.current.push(now);

    const accepted = [];
    const rejected = [];
    let projectedCount = docs.length;
    let projectedBytes = storageUsed;

    files.forEach((file) => {
      const ext = (file.name.split(".").pop() || "").toLowerCase();
      if (SUPPORTED_EXTS.indexOf(ext) === -1) {
        rejected.push({ name: file.name, why: "Unsupported format. We read PDF, DOCX, TXT and Markdown." });
        return;
      }
      if (file.size > MAX_FILE_BYTES) {
        rejected.push({ name: file.name, why: `${formatBytes(file.size)} — over the ${formatBytes(MAX_FILE_BYTES)} limit for a single file.` });
        return;
      }
      if (projectedCount + 1 > DOC_CAP) {
        rejected.push({ name: file.name, why: `Your library holds ${DOC_CAP} documents on the free tier and you have ${projectedCount}. Delete one to make room.` });
        return;
      }
      if (projectedBytes + file.size > STORAGE_CAP) {
        rejected.push({ name: file.name, why: `Would take you past ${formatBytes(STORAGE_CAP)} of storage (you're using ${formatBytes(projectedBytes)}).` });
        return;
      }
      projectedCount += 1;
      projectedBytes += file.size;
      seqRef.current += 1;
      accepted.push({
        id: "doc_" + seqRef.current,
        filename: file.name,
        size_bytes: file.size,
        page_count: null,
        status: "queued",
        failure_reason: null,
        created_at: new Date().toISOString(),
      });
    });

    if (accepted.length > 0) {
      setDocs((prev) => accepted.concat(prev));
      setFilter("all");
      setQuery("");
      setLive(
        accepted.length === 1
          ? `${accepted[0].filename} queued for reading.`
          : `${accepted.length} documents queued for reading.`
      );
      accepted.forEach((doc, i) => {
        schedule(() => advance(doc.id, "processing"), 1400 + i * 500);
        schedule(() => advance(doc.id, "ready"), 5200 + i * 1400);
      });
    }

    if (rejected.length > 0) {
      setNotice({
        kind: "error",
        title:
          accepted.length > 0
            ? `${accepted.length} accepted, ${rejected.length} turned away`
            : rejected.length === 1
            ? "That file wasn't accepted"
            : "Those files weren't accepted",
        body: "Everything else went through. Here's what we couldn't take:",
        rejections: rejected,
      });
    } else if (accepted.length > 0) {
      setNotice({
        kind: "success",
        title: accepted.length === 1 ? "Reading your document now" : `Reading ${accepted.length} documents now`,
        body: "Extraction, chunking and embedding run in the background. You can carry on asking questions of anything already marked ready.",
        items: accepted.map((d) => d.filename),
      });
    }
  }

  function deleteDoc(doc) {
    setDocs((prev) => prev.filter((d) => d.id !== doc.id));
    setConfirmId(null);
    const was = doc.status === "queued" || doc.status === "processing";
    setNotice({
      kind: "success",
      title: "Document deleted",
      body: `${doc.filename} — ${formatBytes(doc.size_bytes)} freed. Its passages and embeddings are gone${was ? ", and the pending ingestion job was cancelled" : ""}. Future answers won't cite it.`,
    });
    setLive(`${doc.filename} deleted.`);
  }

  const statusMeta = {
    queued: { label: "Queued", Icon: Icons.Clock, color: neutral, tint: hexToRgba(neutral, 0.12), pulse: true },
    processing: { label: "Processing", Icon: Icons.Clock, color: primary, tint: hexToRgba(primary, 0.1), pulse: true },
    ready: { label: "Ready", Icon: Icons.CheckCircle, color: primary, tint: hexToRgba(primary, 0.12), pulse: false },
    failed: { label: "Failed", Icon: Icons.AlertCircle, color: accent, tint: hexToRgba(accent, 0.12), pulse: false },
  };

  const inProgressCount = counts.progress;

  const meters = [
    { label: "Documents", used: docs.length, cap: DOC_CAP, display: `${docs.length} of ${DOC_CAP}`, ratio: docs.length / DOC_CAP },
    {
      label: "Storage",
      display: `${formatBytes(storageUsed)} of ${formatBytes(STORAGE_CAP)}`,
      ratio: storageUsed / STORAGE_CAP,
    },
    {
      label: "Questions this month",
      display: `${MESSAGES_USED} of ${MESSAGE_CAP}`,
      ratio: MESSAGES_USED / MESSAGE_CAP,
      foot: `Resets ${MESSAGE_RESET}`,
    },
  ];

  const ghostBtn = {
    backgroundColor: "transparent",
    color: neutral,
    border: `1px solid ${hexToRgba(neutral, 0.3)}`,
    borderRadius: radius,
    fontFamily: brand.fontBody,
  };

  return (
    <div
      className="rr-lib min-h-full"
      style={{ backgroundColor: paper, fontFamily: brand.fontBody, fontVariantNumeric: "tabular-nums" }}
    >
      <style>{`
        .rr-lib table { font-variant-numeric: tabular-nums; }
        .rr-lib button:focus-visible, .rr-lib input:focus-visible, .rr-lib a:focus-visible {
          outline: 2px solid ${primary}; outline-offset: 2px; border-radius: ${radius};
        }
        @keyframes rrRowIn { from { opacity: 0; transform: translateY(-6px); } to { opacity: 1; transform: none; } }
        @keyframes rrFade { from { opacity: 0; transform: translateY(-4px); } to { opacity: 1; transform: none; } }
        @keyframes rrPulse { 0%, 100% { opacity: .35; } 50% { opacity: 1; } }
        .rr-row-in { animation: rrRowIn .4s cubic-bezier(.2,.7,.3,1) both; }
        .rr-fade { animation: rrFade .3s ease-out both; }
        .rr-pulse { animation: rrPulse 1.9s ease-in-out infinite; }
        .rr-bar { transition: width .7s cubic-bezier(.2,.7,.3,1); }
        .rr-drop { transition: background-color .25s ease, border-color .25s ease; }
        @media (prefers-reduced-motion: reduce) {
          .rr-lib * { animation: none !important; transition: none !important; }
        }
      `}</style>

      <p className="sr-only" role="status" aria-live="polite">{live}</p>

      <div className="mx-auto w-full max-w-5xl px-5 py-10 sm:px-8 sm:py-14">
        <header className="flex flex-wrap items-end justify-between gap-6">
          <div className="max-w-xl">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em]" style={{ color: accent }}>
              Private library
            </p>
            <h1
              className="mt-3 text-[2rem] leading-tight sm:text-[2.5rem]"
              style={{ fontFamily: brand.fontHeading, color: primary, letterSpacing: "-0.02em" }}
            >
              Document library
            </h1>
            <p className="mt-4 text-[15px] leading-7" style={{ color: neutral }}>
              Nobody else on this service can see these files. Answers in chat are drawn only from the documents
              marked <span style={{ color: primary, fontWeight: 600 }}>ready</span> below — never from anything else.
            </p>
          </div>
          <Button
            onClick={() => navigate("chat")}
            className="px-5 py-2.5 text-sm font-medium"
            style={ghostBtn}
          >
            <span className="inline-flex items-center gap-2">
              Ask a question
              <Icons.ArrowRight className="h-4 w-4" aria-hidden="true" />
            </span>
          </Button>
        </header>

        <div className="mt-10 grid gap-6 lg:grid-cols-[1.55fr_1fr]">
          <section aria-labelledby="add-heading">
            <h2 id="add-heading" className="sr-only">Add documents</h2>
            <div
              className="rr-drop flex h-full flex-col items-center justify-center px-6 py-10 text-center sm:px-10 sm:py-12"
              onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
              onDragLeave={() => setDragging(false)}
              onDrop={(e) => { e.preventDefault(); setDragging(false); handleFiles(e.dataTransfer.files); }}
              style={{
                border: `1.5px dashed ${dragging ? primary : hexToRgba(neutral, 0.38)}`,
                borderRadius: radius,
                backgroundColor: dragging ? hexToRgba(primary, 0.07) : hexToRgba(primary, 0.025),
              }}
            >
              <Icons.Upload className="h-7 w-7" aria-hidden="true" style={{ color: primary }} />
              <p className="mt-5 text-xl" style={{ fontFamily: brand.fontHeading, color: primary }}>
                Drop a file on the table
              </p>
              <p className="mt-2 max-w-sm text-sm leading-6" style={{ color: neutral }}>
                PDF, DOCX, TXT or Markdown, up to {formatBytes(MAX_FILE_BYTES)} each. Long manuals keep processing
                in the background — you don't have to wait here.
              </p>
              <input
                ref={inputRef}
                id="library-file-input"
                type="file"
                multiple
                tabIndex={-1}
                aria-hidden="true"
                className="hidden"
                onChange={(e) => { handleFiles(e.target.files); e.target.value = ""; }}
              />
              <Button
                onClick={() => inputRef.current && inputRef.current.click()}
                className="mt-7 px-6 py-3 text-[15px] font-semibold"
                style={{ backgroundColor: primary, color: paper, borderRadius: radius, border: "none" }}
              >
                <span className="inline-flex items-center gap-2">
                  <Icons.Plus className="h-4 w-4" aria-hidden="true" />
                  Choose files to upload
                </span>
              </Button>
            </div>
          </section>

          <Card style={{ backgroundColor: hexToRgba(primary, 0.04), border: `1px solid ${hexToRgba(neutral, 0.18)}`, borderRadius: radius }}>
            <CardHeader className="px-6 pt-6">
              <CardTitle className="text-sm font-semibold uppercase tracking-[0.14em]" style={{ color: neutral }}>
                Free tier usage
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6 px-6 pb-6 pt-2">
              {meters.map((m) => {
                const pct = Math.min(100, Math.round(m.ratio * 100));
                const high = m.ratio >= 0.8;
                return (
                  <div key={m.label}>
                    <div className="flex items-baseline justify-between gap-3">
                      <span className="text-[13px]" style={{ color: neutral }}>{m.label}</span>
                      <span className="text-[13px] font-semibold" style={{ color: high ? accent : primary }}>
                        {m.display}
                      </span>
                    </div>
                    <div
                      className="mt-2 h-1.5 w-full overflow-hidden"
                      style={{ backgroundColor: hexToRgba(neutral, 0.16), borderRadius: 999 }}
                    >
                      <div
                        className="rr-bar h-full"
                        style={{ width: pct + "%", backgroundColor: high ? accent : primary, borderRadius: 999 }}
                      />
                    </div>
                    {m.foot ? (
                      <p className="mt-1.5 text-[11px]" style={{ color: hexToRgba(neutral, 0.9) }}>{m.foot}</p>
                    ) : null}
                  </div>
                );
              })}
              <Separator style={{ backgroundColor: hexToRgba(neutral, 0.18) }} />
              <button
                type="button"
                onClick={() => navigate("account")}
                className="inline-flex items-center gap-1 text-[13px] font-medium"
                style={{ color: primary }}
              >
                Account settings
                <Icons.ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />
              </button>
            </CardContent>
          </Card>
        </div>

        {notice ? (
          <div
            className="rr-fade mt-6 flex gap-4 px-5 py-4 sm:px-6"
            role={notice.kind === "success" ? "status" : "alert"}
            style={{
              borderRadius: radius,
              border: `1px solid ${hexToRgba(notice.kind === "success" ? primary : accent, 0.45)}`,
              backgroundColor: hexToRgba(notice.kind === "success" ? primary : accent, 0.07),
            }}
          >
            {notice.kind === "success" ? (
              <Icons.CheckCircle className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" style={{ color: primary }} />
            ) : (
              <Icons.AlertCircle className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" style={{ color: accent }} />
            )}
            <div className="min-w-0 flex-1">
              <p className="text-[15px] font-semibold" style={{ color: notice.kind === "success" ? primary : accent }}>
                {notice.title}
              </p>
              <p className="mt-1 text-[14px] leading-6" style={{ color: neutral }}>{notice.body}</p>
              {notice.rejections ? (
                <ul className="mt-3 space-y-2">
                  {notice.rejections.map((r) => (
                    <li key={r.name} className="pl-4 text-[13px] leading-6" style={{ borderLeft: `2px solid ${hexToRgba(accent, 0.5)}`, color: neutral }}>
                      <span className="font-medium" style={{ color: primary }}>{r.name}</span>
                      <span className="block">{r.why}</span>
                    </li>
                  ))}
                </ul>
              ) : null}
              {notice.items ? (
                <ul className="mt-3 space-y-1">
                  {notice.items.map((n) => (
                    <li key={n} className="pl-4 text-[13px]" style={{ borderLeft: `2px solid ${hexToRgba(primary, 0.4)}`, color: neutral }}>
                      {n}
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>
            <button
              type="button"
              onClick={() => setNotice(null)}
              aria-label="Dismiss this message"
              className="h-7 w-7 shrink-0 self-start rounded-full"
              style={{ color: neutral }}
            >
              <Icons.X className="mx-auto h-4 w-4" aria-hidden="true" />
            </button>
          </div>
        ) : null}

        <section className="mt-12" aria-labelledby="docs-heading">
          <div className="flex flex-wrap items-end justify-between gap-5">
            <div>
              <h2 id="docs-heading" className="text-xl" style={{ fontFamily: brand.fontHeading, color: primary }}>
                Your documents
              </h2>
              <p className="mt-1.5 flex items-center gap-2 text-[13px]" style={{ color: neutral }}>
                {inProgressCount > 0 ? (
                  <React.Fragment>
                    <span className="rr-pulse inline-block h-2 w-2 rounded-full" style={{ backgroundColor: primary }} aria-hidden="true" />
                    {inProgressCount} being read now — this list updates on its own
                  </React.Fragment>
                ) : (
                  <React.Fragment>
                    <Icons.Check className="h-3.5 w-3.5" aria-hidden="true" style={{ color: primary }} />
                    All documents up to date
                  </React.Fragment>
                )}
              </p>
            </div>
            <div className="w-full sm:w-72">
              <Label htmlFor="doc-search" className="text-[11px] font-semibold uppercase tracking-[0.14em]" style={{ color: neutral }}>
                Search by filename
              </Label>
              <div className="relative mt-1.5">
                <Icons.Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2" aria-hidden="true" style={{ color: neutral }} />
                <Input
                  id="doc-search"
                  type="search"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="tenancy, manual, minutes…"
                  className="w-full py-2 pl-9 pr-3 text-sm"
                  style={{
                    backgroundColor: paper,
                    border: `1px solid ${hexToRgba(neutral, 0.3)}`,
                    borderRadius: radius,
                    color: primary,
                  }}
                />
              </div>
            </div>
          </div>

          <div className="mt-5 flex flex-wrap gap-2" role="group" aria-label="Filter documents by status">
            {FILTERS.map((f) => {
              const active = f.id === filter;
              return (
                <button
                  key={f.id}
                  type="button"
                  aria-pressed={active}
                  onClick={() => setFilter(f.id)}
                  className="px-3.5 py-1.5 text-[13px] font-medium"
                  style={{
                    borderRadius: 999,
                    border: `1px solid ${active ? primary : hexToRgba(neutral, 0.28)}`,
                    backgroundColor: active ? primary : "transparent",
                    color: active ? paper : neutral,
                  }}
                >
                  {f.label} <span style={{ opacity: 0.75 }}>({counts[f.id]})</span>
                </button>
              );
            })}
          </div>

          <div
            className="mt-6 overflow-hidden"
            style={{ border: `1px solid ${hexToRgba(neutral, 0.2)}`, borderRadius: radius, backgroundColor: hexToRgba(paper, 1) }}
          >
            {visible.length > 0 ? (
              <Table className="w-full text-left">
                <THead>
                  <TR style={{ borderBottom: `1px solid ${hexToRgba(neutral, 0.2)}`, backgroundColor: hexToRgba(neutral, 0.05) }}>
                    <TH className="px-5 py-3 text-[11px] font-semibold uppercase tracking-[0.14em]" style={{ color: neutral }}>Document</TH>
                    <TH className="px-5 py-3 text-[11px] font-semibold uppercase tracking-[0.14em]" style={{ color: neutral }}>Status</TH>
                    <TH className="hidden px-5 py-3 text-right text-[11px] font-semibold uppercase tracking-[0.14em] md:table-cell" style={{ color: neutral }}>Size</TH>
                    <TH className="hidden px-5 py-3 text-right text-[11px] font-semibold uppercase tracking-[0.14em] lg:table-cell" style={{ color: neutral }}>Pages</TH>
                    <TH className="hidden px-5 py-3 text-[11px] font-semibold uppercase tracking-[0.14em] md:table-cell" style={{ color: neutral }}>Uploaded</TH>
                    <TH className="px-5 py-3"><span className="sr-only">Actions</span></TH>
                  </TR>
                </THead>
                <TBody>
                  {visible.map((doc) => {
                    const meta = statusMeta[doc.status];
                    const StatusIcon = meta.Icon;
                    const confirming = confirmId === doc.id;
                    return (
                      <TR
                        key={doc.id}
                        className="rr-row-in align-top"
                        style={{ borderBottom: `1px solid ${hexToRgba(neutral, 0.14)}` }}
                      >
                        <TD className="px-5 py-5">
                          <div className="flex gap-3">
                            <Icons.FileText className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" style={{ color: hexToRgba(neutral, 0.85) }} />
                            <div className="min-w-0">
                              <span className="block text-[15px] font-medium leading-6 break-words" style={{ color: primary }}>
                                {doc.filename}
                              </span>
                              <span className="mt-1 block text-[12px] md:hidden" style={{ color: neutral }}>
                                {formatBytes(doc.size_bytes)}
                                {doc.page_count ? ` · ${doc.page_count} pages` : ""} · {formatWhen(doc.created_at)}
                              </span>
                              {doc.failure_reason ? (
                                <p
                                  className="mt-3 max-w-md pl-4 text-[13px] leading-6"
                                  style={{ borderLeft: `2px solid ${hexToRgba(accent, 0.55)}`, color: neutral }}
                                >
                                  {doc.failure_reason}
                                </p>
                              ) : null}
                              {doc.status === "processing" ? (
                                <p className="mt-2 text-[12px]" style={{ color: neutral }}>
                                  Extracting text and embedding passages — usually a few minutes for a long file.
                                </p>
                              ) : null}
                            </div>
                          </div>
                        </TD>
                        <TD className="px-5 py-5">
                          <Badge
                            className={"inline-flex items-center gap-1.5 whitespace-nowrap px-2.5 py-1 text-[12px] font-semibold" + (meta.pulse ? " rr-pulse" : "")}
                            style={{ backgroundColor: meta.tint, color: meta.color, borderRadius: 999, border: `1px solid ${hexToRgba(meta.color, 0.3)}` }}
                          >
                            <StatusIcon className="h-3.5 w-3.5" aria-hidden="true" />
                            {meta.label}
                          </Badge>
                        </TD>
                        <TD className="hidden px-5 py-5 text-right text-[13px] md:table-cell" style={{ color: neutral }}>
                          {formatBytes(doc.size_bytes)}
                        </TD>
                        <TD className="hidden px-5 py-5 text-right text-[13px] lg:table-cell" style={{ color: neutral }}>
                          {doc.page_count ? doc.page_count : "—"}
                        </TD>
                        <TD className="hidden px-5 py-5 text-[13px] md:table-cell" style={{ color: neutral }}>
                          {formatWhen(doc.created_at)}
                        </TD>
                        <TD className="px-5 py-5">
                          {confirming ? (
                            <div className="rr-fade flex min-w-[11rem] flex-col items-end gap-2">
                              <p className="text-right text-[12px] leading-5" style={{ color: neutral }}>
                                Delete permanently? The file, its passages and embeddings go with it.
                              </p>
                              <div className="flex gap-2">
                                <button
                                  type="button"
                                  onClick={() => deleteDoc(doc)}
                                  className="px-3 py-1.5 text-[12px] font-semibold"
                                  style={{ backgroundColor: accent, color: paper, borderRadius: radius }}
                                >
                                  Delete
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setConfirmId(null)}
                                  className="px-3 py-1.5 text-[12px] font-medium"
                                  style={{ color: neutral, border: `1px solid ${hexToRgba(neutral, 0.3)}`, borderRadius: radius }}
                                >
                                  Keep
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div className="flex justify-end gap-3">
                              {doc.status === "failed" ? (
                                <button
                                  type="button"
                                  onClick={() => inputRef.current && inputRef.current.click()}
                                  className="text-[13px] font-medium"
                                  style={{ color: primary }}
                                >
                                  Re-upload
                                </button>
                              ) : null}
                              <button
                                type="button"
                                onClick={() => setConfirmId(doc.id)}
                                className="inline-flex items-center gap-1.5 text-[13px] font-medium"
                                style={{ color: neutral }}
                              >
                                <Icons.Trash className="h-3.5 w-3.5" aria-hidden="true" />
                                Delete
                              </button>
                            </div>
                          )}
                        </TD>
                      </TR>
                    );
                  })}
                </TBody>
              </Table>
            ) : docs.length === 0 ? (
              <div className="rr-fade px-6 py-16 text-center">
                <Icons.Package className="mx-auto h-7 w-7" aria-hidden="true" style={{ color: hexToRgba(neutral, 0.8) }} />
                <h3 className="mt-5 text-xl" style={{ fontFamily: brand.fontHeading, color: primary }}>
                  Nothing on the table yet
                </h3>
                <p className="mx-auto mt-3 max-w-md text-[14px] leading-7" style={{ color: neutral }}>
                  Upload a PDF, DOCX, TXT or Markdown file and we'll read it through, break it into passages and make
                  it answerable. Until then, chat has nothing of yours to quote.
                </p>
                <Button
                  onClick={() => inputRef.current && inputRef.current.click()}
                  className="mt-6 px-5 py-2.5 text-sm font-semibold"
                  style={{ backgroundColor: primary, color: paper, borderRadius: radius, border: "none" }}
                >
                  Upload your first document
                </Button>
              </div>
            ) : (
              <div className="rr-fade px-6 py-14 text-center">
                <Icons.Search className="mx-auto h-6 w-6" aria-hidden="true" style={{ color: hexToRgba(neutral, 0.8) }} />
                <h3 className="mt-4 text-lg" style={{ fontFamily: brand.fontHeading, color: primary }}>
                  Nothing here matches
                </h3>
                <p className="mx-auto mt-2 max-w-sm text-[14px] leading-7" style={{ color: neutral }}>
                  {trimmed
                    ? `No ${filter === "all" ? "" : activeFilter.label.toLowerCase() + " "}document is named “${query.trim()}”.`
                    : `You have no ${activeFilter.label.toLowerCase()} documents right now.`}
                </p>
                <button
                  type="button"
                  onClick={() => { setQuery(""); setFilter("all"); }}
                  className="mt-5 px-4 py-2 text-[13px] font-medium"
                  style={{ color: primary, border: `1px solid ${hexToRgba(primary, 0.4)}`, borderRadius: radius }}
                >
                  Show all {docs.length} documents
                </button>
              </div>
            )}
          </div>

          <p className="mt-5 text-[12px] leading-6" style={{ color: hexToRgba(neutral, 0.95) }}>
            Deleting is permanent and immediate — a deleted document is never retrieved or cited again, though older
            answers keep the passage they already quoted.
          </p>
        </section>
      </div>
    </div>
  );
}
