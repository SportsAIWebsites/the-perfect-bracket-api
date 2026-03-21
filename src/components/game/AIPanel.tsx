"use client";

import { useState, useEffect, useRef } from "react";
import { ESPNSummaryResponse } from "@/types/espn";

interface AIPanelProps {
  eventId?: string;
  summary: ESPNSummaryResponse | null;
  isDemo: boolean;
}

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

const DEMO_INSIGHT =
  "This is shaping up to be a classic tournament battle. The higher seed's defensive intensity has been the story — they're holding the opponent to just 38% shooting while generating 8 turnovers. Watch for the tempo to be the deciding factor down the stretch, as the underdog needs to push pace to have any chance at the upset.";

export function AIPanel({ summary, isDemo }: AIPanelProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [initialLoaded, setInitialLoaded] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-generate initial insight
  useEffect(() => {
    if (isDemo) {
      // Always restart streaming on mount in demo mode
      setIsStreaming(true);
      setMessages([{ role: "assistant", content: "" }]);

      let cancelled = false;
      const words = DEMO_INSIGHT.split(" ");
      let i = 0;

      const tick = () => {
        if (cancelled || i >= words.length) {
          if (!cancelled) setIsStreaming(false);
          return;
        }
        setMessages([
          { role: "assistant", content: words.slice(0, i + 1).join(" ") },
        ]);
        i++;
        setTimeout(tick, 40);
      };

      setTimeout(tick, 50);
      return () => { cancelled = true; };
    }

    if (!summary || initialLoaded) return;
    setInitialLoaded(true);
    generateInsight();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isDemo, summary]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function generateInsight(userMessage?: string) {
    if (isDemo) return;

    setIsStreaming(true);
    const gameContext = buildGameContext(summary);

    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          gameContext,
          messages: userMessage
            ? [...messages, { role: "user", content: userMessage }]
            : [],
        }),
      });

      if (!response.body) throw new Error("No response body");

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let accumulated = "";

      setMessages((prev) => [...prev, { role: "assistant", content: "" }]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        accumulated += decoder.decode(value);
        setMessages((prev) => [
          ...prev.slice(0, -1),
          { role: "assistant", content: accumulated },
        ]);
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Unable to generate analysis. Check your API key configuration.",
        },
      ]);
    } finally {
      setIsStreaming(false);
    }
  }

  function buildGameContext(data: ESPNSummaryResponse | null): string {
    if (!data) return "No game data available.";
    try {
      const header = data.header?.competitions?.[0];
      const status = header?.status?.type?.shortDetail || "Unknown";
      const teams = data.boxscore?.teams || [];
      let context = `Game Status: ${status}\n`;
      for (const team of teams) {
        context += `${team.team.displayName}: `;
        context += team.statistics
          ?.map((s) => `${s.name}: ${s.displayValue}`)
          .join(", ");
        context += "\n";
      }
      return context;
    } catch {
      return "Game data parsing error.";
    }
  }

  function handleSend() {
    if (!input.trim() || isStreaming) return;
    const userMsg = input.trim();
    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: userMsg }]);
    generateInsight(userMsg);
  }

  return (
    <div className="flex flex-col rounded-xl border border-border-subtle bg-card overflow-hidden h-[600px]">
      {/* Header */}
      <div className="border-b border-border-subtle bg-accent/10 px-4 py-2">
        <div className="flex items-center gap-2">
          <svg
            className="h-4 w-4 text-accent"
            viewBox="0 0 16 16"
            fill="currentColor"
          >
            <path d="M8 0l2.5 5 5.5.8-4 3.9.9 5.3L8 12.5 3.1 15l.9-5.3-4-3.9L5.5 5z" />
          </svg>
          <h3 className="text-sm font-bold text-accent">AI Insights</h3>
        </div>
        <p className="text-[10px] text-text-dim">Powered by Claude</p>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {messages.map((msg, i) => (
          <div
            key={i}
            className={
              msg.role === "assistant"
                ? "rounded-lg bg-card-alt border-l-2 border-accent p-3"
                : "rounded-lg bg-border-subtle/30 p-3 ml-8"
            }
          >
            <p className="text-xs leading-relaxed text-text-primary whitespace-pre-wrap">
              {msg.content}
              {isStreaming && i === messages.length - 1 && msg.role === "assistant" && (
                <span className="inline-block w-1.5 h-3 bg-accent ml-0.5 animate-pulse-live" />
              )}
            </p>
          </div>
        ))}
        {messages.length === 0 && !isStreaming && (
          <div className="flex items-center justify-center h-full">
            <p className="text-xs text-text-dim text-center">
              AI analysis will appear here.
              <br />
              Ask anything about this game.
            </p>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="border-t border-border-subtle p-3">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            placeholder="Ask about this game..."
            disabled={isStreaming}
            className="flex-1 rounded-lg border border-border-subtle bg-bg-base px-3 py-2 text-xs text-text-primary placeholder:text-text-dim focus:border-accent focus:outline-none disabled:opacity-50"
          />
          <button
            onClick={handleSend}
            disabled={isStreaming || !input.trim()}
            className="rounded-lg bg-accent px-3 py-2 text-xs font-bold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}
