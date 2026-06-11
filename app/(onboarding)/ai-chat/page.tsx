"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Send, Loader2, ArrowRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/utils";

// ── Types ─────────────────────────────────────────────────────────────────────

type Role = "user" | "assistant";

interface Message {
  id: string;
  role: Role;
  content: string;
  createdAt: Date;
}

// ── Constants ─────────────────────────────────────────────────────────────────

const SAGE_INTRO: Message = {
  id: "sage-intro",
  role: "assistant",
  content:
    "Hi! I'm Sage — your AI dating coach here at Done Swiping. 💛\n\nI'm going to ask you a few genuine questions so we can build a profile that truly represents who you are and what you're looking for. There are no right or wrong answers — just be yourself.\n\nLet's start with something simple: what's a small, everyday thing that makes you genuinely happy?",
  createdAt: new Date(),
};

const TARGET_EXCHANGES = 8;
const APPROX_TOTAL = 15;

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatTime(date: Date): string {
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

// ── Typing indicator ──────────────────────────────────────────────────────────

function TypingIndicator() {
  return (
    <div className="flex items-end gap-2 max-w-[80%]">
      {/* Sage avatar */}
      <div
        className="w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center text-white text-xs font-bold mb-1"
        style={{ background: "oklch(0.6 0.16 22)" }}
        aria-hidden="true"
      >
        S
      </div>

      <div
        className="chat-bubble-ai px-4 py-3 flex items-center gap-1.5"
        aria-label="Sage is typing"
      >
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="w-2 h-2 rounded-full"
            style={{
              background: "oklch(0.65 0.02 50)",
              animation: `bounce 1.2s ease-in-out ${i * 0.2}s infinite`,
            }}
          />
        ))}
      </div>
    </div>
  );
}

// ── Message bubble ────────────────────────────────────────────────────────────

function MessageBubble({ message }: { message: Message }) {
  const isUser = message.role === "user";

  return (
    <div
      className={cn(
        "flex items-end gap-2",
        isUser ? "flex-row-reverse" : "flex-row",
        "max-w-[85%]",
        isUser ? "self-end" : "self-start"
      )}
    >
      {/* Sage avatar — only for AI messages */}
      {!isUser && (
        <div
          className="w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center text-white text-xs font-bold mb-1"
          style={{ background: "oklch(0.6 0.16 22)" }}
          aria-hidden="true"
        >
          S
        </div>
      )}

      <div className="flex flex-col gap-0.5">
        <div
          className={cn(
            "px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap",
            isUser ? "chat-bubble-user" : "chat-bubble-ai"
          )}
        >
          {message.content}
        </div>
        <p
          className={cn("text-[10px] px-1", isUser ? "text-right" : "text-left")}
          style={{ color: "oklch(0.65 0.02 50)" }}
        >
          {formatTime(message.createdAt)}
        </p>
      </div>
    </div>
  );
}

// ── Progress pill ─────────────────────────────────────────────────────────────

function ProgressPill({ exchangeCount }: { exchangeCount: number }) {
  const pct = Math.min((exchangeCount / APPROX_TOTAL) * 100, 100);
  const label =
    exchangeCount >= TARGET_EXCHANGES
      ? "Profile ready to generate!"
      : `${exchangeCount} of ~${APPROX_TOTAL} questions answered`;

  return (
    <div
      className="flex items-center gap-2 rounded-full px-3 py-1.5 mx-5 my-2"
      style={{
        background:
          exchangeCount >= TARGET_EXCHANGES
            ? "oklch(0.95 0.04 130)"
            : "oklch(0.97 0.006 60)",
        border:
          exchangeCount >= TARGET_EXCHANGES
            ? "1px solid oklch(0.75 0.1 130)"
            : "1px solid oklch(0.9 0.01 50)",
      }}
    >
      {/* Progress bar */}
      <div
        className="flex-1 h-1.5 rounded-full overflow-hidden"
        style={{ background: "oklch(0.88 0.01 50)" }}
      >
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{
            width: `${pct}%`,
            background:
              exchangeCount >= TARGET_EXCHANGES
                ? "oklch(0.6 0.14 130)"
                : "oklch(0.6 0.16 22)",
          }}
        />
      </div>
      <p
        className="text-[11px] font-medium whitespace-nowrap"
        style={{
          color:
            exchangeCount >= TARGET_EXCHANGES
              ? "oklch(0.35 0.1 130)"
              : "oklch(0.45 0.02 50)",
        }}
      >
        {label}
      </p>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function AiChatPage() {
  const router = useRouter();

  const [messages, setMessages] = useState<Message[]>([SAGE_INTRO]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isExtracting, setIsExtracting] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const formRef = useRef<HTMLFormElement>(null);

  // Count user exchanges (number of user messages sent)
  const exchangeCount = messages.filter((m) => m.role === "user").length;
  const canComplete = exchangeCount >= TARGET_EXCHANGES;

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  // Auto-grow textarea
  function handleInputChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    setInputValue(e.target.value);
    e.target.style.height = "auto";
    e.target.style.height = `${Math.min(e.target.scrollHeight, 120)}px`;
  }

  const sendMessage = useCallback(
    async (content: string) => {
      const trimmed = content.trim();
      if (!trimmed || isLoading) return;

      const userMessage: Message = {
        id: `user-${Date.now()}`,
        role: "user",
        content: trimmed,
        createdAt: new Date(),
      };

      setMessages((prev) => [...prev, userMessage]);
      setInputValue("");
      if (inputRef.current) {
        inputRef.current.style.height = "auto";
      }
      setIsLoading(true);

      try {
        const history = [...messages, userMessage].map((m) => ({
          role: m.role,
          content: m.content,
        }));

        const res = await fetch("/api/ai/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ messages: history }),
        });

        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body?.error ?? `Request failed (${res.status})`);
        }

        const data = await res.json();
        const replyContent: string = data.message ?? data.content ?? "";

        if (!replyContent) throw new Error("Empty response from Sage");

        const aiMessage: Message = {
          id: `ai-${Date.now()}`,
          role: "assistant",
          content: replyContent,
          createdAt: new Date(),
        };

        setMessages((prev) => [...prev, aiMessage]);
      } catch (err) {
        toast.error(
          err instanceof Error ? err.message : "Sage couldn't respond. Try again."
        );
      } finally {
        setIsLoading(false);
        // Re-focus input on mobile after send
        setTimeout(() => inputRef.current?.focus(), 100);
      }
    },
    [messages, isLoading]
  );

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(inputValue);
    }
  }

  async function handleCompleteProfile() {
    setIsExtracting(true);
    try {
      const history = messages.map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const res = await fetch("/api/ai/extract-profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: history }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.error ?? `Extraction failed (${res.status})`);
      }

      router.push("/profile-review");
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Couldn't build your profile. Please try again."
      );
      setIsExtracting(false);
    }
  }

  return (
    <div
      className="flex flex-col"
      style={{ height: "calc(100dvh - 140px)", minHeight: 400 }}
    >
      {/* Sage header */}
      <div
        className="flex items-center gap-3 px-5 py-3 flex-shrink-0"
        style={{
          borderBottom: "1px solid oklch(0.92 0.012 50)",
          background: "oklch(1 0 0)",
        }}
      >
        <div
          className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold"
          style={{ background: "oklch(0.6 0.16 22)" }}
          aria-hidden="true"
        >
          S
        </div>
        <div>
          <p
            className="text-sm font-semibold leading-none"
            style={{ color: "oklch(0.18 0.04 270)" }}
          >
            Sage
          </p>
          <p
            className="text-xs mt-0.5 flex items-center gap-1"
            style={{ color: "oklch(0.55 0.02 50)" }}
          >
            <span
              className="w-1.5 h-1.5 rounded-full bg-green-400 inline-block"
              aria-hidden="true"
            />
            AI Dating Coach
          </p>
        </div>

        {/* Sparkle badge */}
        <div
          className="ml-auto flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-semibold"
          style={{
            background: "oklch(0.97 0.02 30)",
            color: "oklch(0.6 0.16 22)",
          }}
        >
          <Sparkles className="w-3 h-3" aria-hidden="true" />
          Powered by AI
        </div>
      </div>

      {/* Progress */}
      <ProgressPill exchangeCount={exchangeCount} />

      {/* Messages */}
      <div
        className="flex-1 overflow-y-auto px-5 py-3 flex flex-col gap-4"
        role="log"
        aria-label="Chat with Sage"
        aria-live="polite"
        style={{ background: "oklch(0.99 0.004 60)" }}
      >
        {messages.map((msg) => (
          <MessageBubble key={msg.id} message={msg} />
        ))}

        {isLoading && <TypingIndicator />}

        <div ref={messagesEndRef} aria-hidden="true" />
      </div>

      {/* Complete profile CTA — appears when enough exchanges */}
      {canComplete && !isLoading && (
        <div
          className="px-5 py-3 flex-shrink-0"
          style={{
            background: "oklch(0.97 0.02 30)",
            borderTop: "1px solid oklch(0.92 0.012 50)",
          }}
        >
          <Button
            onClick={handleCompleteProfile}
            disabled={isExtracting}
            className="w-full h-11 rounded-2xl font-semibold gap-2"
            style={{
              background: "oklch(0.6 0.16 22)",
              boxShadow: "0 4px 16px oklch(0.6 0.16 22 / 0.35)",
            }}
          >
            {isExtracting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
                Building your profile…
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" aria-hidden="true" />
                Complete my profile
                <ArrowRight className="w-4 h-4" aria-hidden="true" />
              </>
            )}
          </Button>
          <p
            className="text-[11px] text-center mt-2"
            style={{ color: "oklch(0.55 0.02 50)" }}
          >
            Or keep chatting to add more depth to your profile
          </p>
        </div>
      )}

      {/* Input bar */}
      <form
        ref={formRef}
        onSubmit={(e) => {
          e.preventDefault();
          sendMessage(inputValue);
        }}
        className="flex items-end gap-2 px-4 py-3 flex-shrink-0"
        style={{
          background: "oklch(1 0 0)",
          borderTop: "1px solid oklch(0.92 0.012 50)",
        }}
      >
        <textarea
          ref={inputRef}
          value={inputValue}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          placeholder="Type a message… (Enter to send)"
          rows={1}
          disabled={isLoading || isExtracting}
          aria-label="Message to Sage"
          className="flex-1 resize-none rounded-2xl px-4 py-2.5 text-sm outline-none transition-all"
          style={{
            background: "oklch(0.97 0.006 60)",
            border: "1.5px solid oklch(0.9 0.01 50)",
            color: "oklch(0.18 0.04 270)",
            maxHeight: 120,
            lineHeight: "1.5",
          }}
          onFocus={(e) => {
            (e.target as HTMLTextAreaElement).style.borderColor = "oklch(0.6 0.16 22)";
          }}
          onBlur={(e) => {
            (e.target as HTMLTextAreaElement).style.borderColor = "oklch(0.9 0.01 50)";
          }}
        />

        <button
          type="submit"
          disabled={!inputValue.trim() || isLoading || isExtracting}
          aria-label="Send message"
          className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 transition-all disabled:opacity-40 disabled:cursor-not-allowed hover:scale-105 active:scale-95"
          style={{
            background: "oklch(0.6 0.16 22)",
            boxShadow: "0 2px 8px oklch(0.6 0.16 22 / 0.3)",
          }}
        >
          {isLoading ? (
            <Loader2 className="w-4 h-4 text-white animate-spin" aria-hidden="true" />
          ) : (
            <Send className="w-4 h-4 text-white" aria-hidden="true" />
          )}
        </button>
      </form>

      {/* Bounce keyframe (inline style) */}
      <style>{`
        @keyframes bounce {
          0%, 60%, 100% { transform: translateY(0); }
          30% { transform: translateY(-5px); }
        }
      `}</style>
    </div>
  );
}
