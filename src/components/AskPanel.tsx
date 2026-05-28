"use client";

import { useState } from "react";
import { Code2, Copy, Loader2, Send, Sparkles } from "lucide-react";
import { SourceChip } from "@/components/SourceChip";
import { SUGGESTED_QUESTIONS } from "@/lib/ask-questions";
import { dateLabel, money } from "@/lib/risk-ui";
import type { AskAnswer, AskColumn, AskRow } from "@/lib/types";

function formatCell(column: AskColumn, row: AskRow): string {
  const value = row[column.key];
  if (value === null || value === undefined || value === "") return "—";
  if (column.kind === "money") return money(Number(value), String(row.currency ?? "USD"));
  if (column.kind === "date") return dateLabel(String(value));
  return String(value);
}

export function AskPanel() {
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState<AskAnswer | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSql, setShowSql] = useState(true);

  async function ask(input: string) {
    const trimmed = input.trim();
    if (!trimmed || loading) return;
    setQuestion(trimmed);
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: trimmed })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data?.error ?? "That question could not be answered.");
      setAnswer(data as AskAnswer);
    } catch (askError) {
      setError(askError instanceof Error ? askError.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative w-full bg-white border border-[#E4E2D4] rounded-3xl shadow-[0_22px_60px_rgba(31,41,35,0.09)] mb-6 overflow-hidden">
      
      <div className="bg-gradient-to-b from-[#0F2A26] to-[#14322C] text-[#EAF6F1] p-5 lg:p-7 space-y-5">
        <div className="flex justify-between items-start flex-wrap gap-3">
          <div className="space-y-1">
            <span className="text-xs font-extrabold uppercase tracking-widest text-[#7FD8C2]">
              🤖 Ask your life
            </span>
            <h3 className="font-display text-2xl text-[#F4FBF8] leading-tight max-w-xl">
              Ask in plain English. Coral joins your inbox, calendar & files to answer.
            </h3>
          </div>
          <span className="inline-block px-3 py-1 bg-[#7FD8C2]/15 text-[#A7F3D0] rounded-full text-xs font-mono font-bold select-none">
            natural language → SQL
          </span>
        </div>

        <form
          onSubmit={(event: React.FormEvent) => {
            event.preventDefault();
            ask(question);
          }}
          className="flex gap-2 w-full"
        >
          <input
            type="text"
            value={question}
            onChange={(event) => setQuestion(event.target.value)}
            placeholder="e.g. What is costing me money this week?"
            className="flex-grow bg-white/10 border border-[#7FD8C2]/30 text-[#F4FBF8] placeholder-[#8FB8AD] rounded-xl h-12 px-4 focus:outline-none focus:ring-2 focus:ring-[#7FD8C2]/50 focus:border-[#7FD8C2] transition-all"
          />
          <button
            type="submit"
            disabled={loading}
            className="bg-[#7FD8C2] text-[#0F2A26] hover:bg-[#9BE7D4] active:scale-95 transition-all rounded-xl h-12 px-5 font-bold flex items-center gap-2 select-none"
          >
            {loading ? <Loader2 size={17} className="spin" aria-hidden="true" /> : <Send size={17} aria-hidden="true" />}
            <span>Ask</span>
          </button>
        </form>

        <div className="flex items-center gap-2 flex-wrap text-xs">
          <span className="font-extrabold uppercase tracking-widest text-[#7FD8C2] select-none">
            Try
          </span>
          {SUGGESTED_QUESTIONS.map((suggestion) => (
            <button
              key={suggestion.id}
              type="button"
              onClick={() => ask(suggestion.question)}
              disabled={loading}
              className="inline-flex items-center gap-1 bg-transparent border border-[#7FD8C2]/30 hover:border-[#7FD8C2] hover:bg-[#7FD8C2]/10 active:scale-95 text-[#CDEBE2] rounded-full px-3.5 py-1.5 transition-all font-semibold"
            >
              <span aria-hidden="true">{suggestion.emoji}</span>
              <span>{suggestion.question}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="p-5 lg:p-7 space-y-5">
        {error && (
          <div role="alert" className="bg-[#FDE7E2] border border-[#F3B8A6] text-[#9C2A12] rounded-xl p-4 font-bold flex gap-2 items-center">
            <span>⚠️</span>
            <span>{error}</span>
          </div>
        )}

        {!answer && !error && (
          <div className="py-6 flex flex-col justify-center items-center gap-2 text-center text-[#7A8278] select-none">
            <span className="text-3xl" aria-hidden="true">💬</span>
            <p className="max-w-[460px] text-sm">
              Pick a question above, or type your own. Coral runs a real cross-source SQL join and shows its work.
            </p>
          </div>
        )}

        {answer && (
          <AnswerView 
            answer={answer} 
            showSql={showSql} 
            onToggleSql={() => setShowSql((value) => !value)} 
          />
        )}
      </div>
      
    </div>
  );
}

function AnswerView({ answer, showSql, onToggleSql }: { answer: AskAnswer; showSql: boolean; onToggleSql: () => void }) {
  const [titleColumn, ...restColumns] = answer.columns;
  const statColumns = restColumns.filter((column) => column.kind && column.kind !== "text");
  const textColumns = restColumns.filter((column) => !column.kind || column.kind === "text");

  return (
    <div className="space-y-5">
      
      <div className="space-y-2">
        <p className="text-[#7A8278] text-sm italic font-medium">
          “{answer.question}”
        </p>
        <h4 className="font-display text-2xl text-primary font-normal leading-snug">
          {answer.headline}
        </h4>
        
        <div className="flex items-center gap-2 flex-wrap">
          {answer.sources.map((source) => (
            <SourceChip key={source} badge={source} />
          ))}
          <span className={`px-2 py-0.5 rounded-full text-xs font-bold select-none
            ${answer.usedCoral ? "bg-[#CFE6DD] text-[#0F5F58]" : "bg-[#F1F1E8] text-[#6B7368]"}`}>
            {answer.usedCoral ? "🪸 Coral Live" : "Seeded fallback"}
          </span>
          {answer.usedClaude && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-[#CFE6DD] text-[#0F5F58] rounded-full text-xs font-bold select-none">
              <Sparkles size={12} aria-hidden="true" />
              <span>Claude wrote this SQL</span>
            </span>
          )}
        </div>

        {answer.note && (
          <div className="text-sm text-[#92590C] bg-[#FCEFD3] border border-[#F0CE85] rounded-xl px-3 py-2.5 flex items-start gap-2">
            <span>ℹ️</span>
            <span>{answer.note}</span>
          </div>
        )}
      </div>

      {answer.rows.length ? (
        <div className="space-y-3">
          {answer.rows.map((row, index) => (
            <div key={index} className="border border-[#E4E2D4] bg-[#FFFFFF] rounded-2xl p-4 shadow-sm space-y-3">
              {titleColumn && (
                <h5 className="font-sans font-extrabold text-base text-primary">
                  {formatCell(titleColumn, row)}
                </h5>
              )}
              
              {statColumns.length ? (
                <div className="flex gap-2 flex-wrap">
                  {statColumns.map((column) => (
                    <div key={column.key} className="bg-[#F4F4EC] rounded-xl px-3 py-2 min-w-[96px] space-y-0.5">
                      <p className="text-[10px] font-extrabold text-[#7A8278] uppercase tracking-wider">
                        {column.label}
                      </p>
                      <p className="font-sans font-bold text-sm text-primary">
                        {formatCell(column, row)}
                      </p>
                    </div>
                  ))}
                </div>
              ) : null}

              {textColumns.map((column) => {
                const value = formatCell(column, row);
                if (value === "—") return null;
                return (
                  <div key={column.key} className="space-y-0.5">
                    <p className="text-[10px] font-extrabold text-[#9AA295] uppercase tracking-wider">
                      {column.label}
                    </p>
                    <p className="text-sm text-[#3C463F] leading-relaxed">
                      {value}
                    </p>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      ) : (
        <div className="border border-dashed border-[#CDD3C4] rounded-2xl p-4 text-[#9AA295] text-sm text-center">
          No matching rows — nothing to worry about here.
        </div>
      )}

      <div className="border border-[#E4E2D4] rounded-2xl overflow-hidden shadow-sm">
        <button 
          type="button" 
          onClick={onToggleSql} 
          aria-expanded={showSql} 
          className="w-full flex justify-between items-center bg-[#F4F4EC] px-4 py-3 hover:bg-[#ECECDF] transition-colors focus:outline-none"
        >
          <div className="flex items-center gap-2 text-secondary font-bold">
            <Code2 size={16} aria-hidden="true" />
            <span className="text-sm text-primary">
              🪸 The Coral SQL that ran {answer.usedCoral ? "(real cross-source join)" : "(query)"}
            </span>
          </div>
          <span className="font-mono text-xs text-[#7A8278] uppercase font-bold tracking-wider">
            {showSql ? "hide" : "show"}
          </span>
        </button>
        {showSql && (
          <pre className="bg-[#13190F] text-[#EAF6E4] p-4 text-[11px] leading-relaxed overflow-x-auto whitespace-pre font-mono">
            {answer.sql}
          </pre>
        )}
      </div>

      <div className="bg-gradient-to-br from-[#ECFDF5] to-[#F6FFFB] border border-[#BBF7D0] rounded-2xl p-4 space-y-2 shadow-sm">
        <div className="flex justify-between items-center flex-wrap gap-2">
          <p className="font-sans font-extrabold text-sm text-primary">
            ✍️ Drafted action — {answer.draft.subject}
          </p>
          <button
            type="button"
            onClick={() => navigator.clipboard.writeText(answer.draft.body)}
            className="inline-flex items-center gap-1.5 px-3 py-1 border border-[#9BD8B3] hover:bg-[#DCFCE7] active:scale-95 text-[#166534] rounded-lg text-xs font-bold transition-all"
          >
            <Copy size={13} aria-hidden="true" />
            <span>Copy</span>
          </button>
        </div>
        <div className="text-sm text-[#166534] leading-relaxed whitespace-pre-wrap font-sans bg-white/50 p-3 rounded-xl border border-[#BBF7D0]">
          {answer.draft.body}
        </div>
      </div>
      
    </div>
  );
}
