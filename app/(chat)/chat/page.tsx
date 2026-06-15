"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Home, Loader2, Mic, MicOff, Sparkles, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

type VoiceState =
  | "idle"
  | "connecting"
  | "listening"
  | "thinking"
  | "speaking"
  | "ending"
  | "error";

interface TranscriptItem {
  id: string;
  role: "user" | "sage";
  text: string;
  draft?: boolean;
}

interface SessionSummary {
  highlights: string[];
  completeness: number;
}

interface RealtimeEvent {
  type: string;
  item_id?: string;
  response_id?: string;
  delta?: string;
  transcript?: string;
  error?: { message?: string };
  response?: {
    id?: string;
    output?: Array<{
      id?: string;
      content?: Array<{ transcript?: string; text?: string }>;
    }>;
  };
}

const GOODBYE_PHRASES = [
  "bye",
  "goodbye",
  "see you later",
  "see ya",
  "that's all",
  "i'm done",
  "i need to go",
  "end chat",
  "let's stop here",
  "speak soon",
];

function isGoodbye(text: string) {
  const normalised = text.toLowerCase();
  return GOODBYE_PHRASES.some((phrase) => normalised.includes(phrase));
}

function SageOrb({
  state,
  audioLevel,
  onStart,
}: {
  state: VoiceState;
  audioLevel: number;
  onStart: () => void;
}) {
  const isIdle = state === "idle" || state === "error";
  const isListening = state === "listening";
  const isSpeaking = state === "speaking" || state === "ending";
  const isWaiting = state === "connecting" || state === "thinking";
  const scale = isListening ? 1 + Math.min(audioLevel, 1) * 0.12 : 1;

  return (
    <button
      type="button"
      onClick={isIdle ? onStart : undefined}
      disabled={!isIdle}
      className="group relative flex h-64 w-64 items-center justify-center rounded-full focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/25"
      aria-label={isIdle ? "Start voice conversation with Sage" : "Sage voice status"}
    >
      {(isListening || isSpeaking) && (
        <>
          <span className="absolute inset-4 rounded-full bg-primary/10 [animation:orbRipple_2s_ease-out_infinite]" />
          <span className="absolute inset-9 rounded-full bg-primary/10 [animation:orbRipple_2s_ease-out_.55s_infinite]" />
        </>
      )}

      <span
        className="relative z-10 flex h-48 w-48 items-center justify-center rounded-full text-white transition-[transform,box-shadow,background] duration-300"
        style={{
          transform: `scale(${scale})`,
          background: isListening
            ? "linear-gradient(145deg, oklch(0.66 0.18 48), oklch(0.57 0.19 24))"
            : isWaiting
              ? "linear-gradient(145deg, oklch(0.48 0.09 254), oklch(0.39 0.11 258))"
              : "linear-gradient(145deg, oklch(0.64 0.17 25), oklch(0.52 0.17 18))",
          boxShadow:
            isListening || isSpeaking
              ? "0 0 70px oklch(0.62 0.17 22 / 0.38), 0 20px 55px oklch(0.32 0.08 20 / 0.22)"
              : "0 18px 50px oklch(0.32 0.08 20 / 0.22)",
        }}
      >
        {isWaiting ? (
          <Loader2 className="h-11 w-11 animate-spin" aria-hidden="true" />
        ) : isListening ? (
          <LiveBars level={audioLevel} />
        ) : isSpeaking ? (
          <SpeakingBars />
        ) : (
          <span className="text-7xl font-light">S</span>
        )}
      </span>
    </button>
  );
}

function LiveBars({ level }: { level: number }) {
  const multipliers = [0.75, 1.25, 1.8, 1.3, 0.85];
  return (
    <span className="flex h-16 items-center gap-2" aria-hidden="true">
      {multipliers.map((multiplier, index) => (
        <span
          key={index}
          className="w-1.5 rounded-full bg-white/90 transition-[height] duration-75"
          style={{ height: Math.max(9, level * 48 * multiplier) }}
        />
      ))}
    </span>
  );
}

function SpeakingBars() {
  return (
    <span className="flex h-16 items-center gap-2" aria-hidden="true">
      {[18, 38, 58, 42, 24].map((height, index) => (
        <span
          key={index}
          className="w-1.5 rounded-full bg-white/90"
          style={{
            height,
            animation: `waveBar 900ms ease-in-out ${index * 90}ms infinite`,
          }}
        />
      ))}
    </span>
  );
}

function SessionEndOverlay({
  summary,
  onClose,
  onHome,
}: {
  summary: SessionSummary | null;
  onClose: () => void;
  onHome: () => void;
}) {
  return (
    <div className="absolute inset-0 z-50 flex items-end bg-secondary/55 backdrop-blur-md">
      <section className="w-full rounded-t-[2rem] bg-white px-6 pb-[calc(2rem+env(safe-area-inset-bottom))] pt-7 shadow-2xl">
        <div className="mx-auto mb-6 h-1 w-10 rounded-full bg-border" />
        <div className="mb-5 flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10">
            <Sparkles className="h-5 w-5 text-primary" aria-hidden="true" />
          </span>
          <div>
            <h2 className="font-bold text-foreground">Conversation saved</h2>
            <p className="text-sm text-muted-foreground">
              Sage is updating your compatibility profile.
            </p>
          </div>
        </div>

        {summary ? (
          <>
            <div className="mb-5">
              <div className="mb-2 flex justify-between text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                <span>Profile completeness</span>
                <span className="text-primary">{summary.completeness}%</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-primary transition-all duration-700"
                  style={{ width: `${summary.completeness}%` }}
                />
              </div>
            </div>
            {summary.highlights.length > 0 && (
              <div className="mb-6 rounded-2xl border border-border bg-background p-4">
                <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  What Sage learned
                </p>
                <ul className="space-y-2 text-sm text-foreground">
                  {summary.highlights.map((highlight) => (
                    <li key={highlight} className="flex gap-2">
                      <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                      {highlight}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </>
        ) : (
          <div className="mb-6 flex items-center gap-2 rounded-2xl bg-muted px-4 py-4 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Saving what you discussed...
          </div>
        )}

        <div className="flex gap-3">
          <Button variant="outline" className="h-12 flex-1 rounded-2xl" onClick={onClose}>
            Talk again
          </Button>
          <Button className="h-12 flex-1 rounded-2xl" onClick={onHome}>
            Go home
          </Button>
        </div>
      </section>
    </div>
  );
}

export default function RealtimeChatPage() {
  const router = useRouter();
  const [state, setState] = useState<VoiceState>("idle");
  const [audioLevel, setAudioLevel] = useState(0);
  const [transcript, setTranscript] = useState<TranscriptItem[]>([]);
  const [sessionSummary, setSessionSummary] = useState<SessionSummary | null>(null);
  const [showSessionEnd, setShowSessionEnd] = useState(false);

  const peerRef = useRef<RTCPeerConnection | null>(null);
  const channelRef = useRef<RTCDataChannel | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const animationRef = useRef<number>(0);
  const conversationIdRef = useRef<string | null>(null);
  const assistantDraftsRef = useRef(new Map<string, string>());
  const loggedItemsRef = useRef(new Set<string>());
  const pendingWritesRef = useRef(new Set<Promise<void>>());
  const endingRequestedRef = useRef(false);
  const finishingRef = useRef(false);
  const endingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const transcriptEndRef = useRef<HTMLDivElement | null>(null);

  const updateTranscript = useCallback(
    (id: string, role: "user" | "sage", text: string, draft = false) => {
      setTranscript((current) => {
        const existingIndex = current.findIndex((item) => item.id === id);
        const nextItem = { id, role, text, draft };
        if (existingIndex === -1) {
          return [...current, nextItem];
        }
        const next = [...current];
        next[existingIndex] = nextItem;
        return next;
      });
    },
    []
  );

  const persistMessage = useCallback(
    (itemId: string, role: "user" | "assistant", message: string) => {
      if (
        !conversationIdRef.current ||
        loggedItemsRef.current.has(itemId) ||
        !message.trim()
      ) {
        return;
      }

      loggedItemsRef.current.add(itemId);
      const write = fetch("/api/ai/realtime/log", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          conversationId: conversationIdRef.current,
          role,
          message,
        }),
        keepalive: true,
      })
        .then((response) => {
          if (!response.ok) {
            loggedItemsRef.current.delete(itemId);
          }
        })
        .catch(() => {
          loggedItemsRef.current.delete(itemId);
        })
        .finally(() => {
          pendingWritesRef.current.delete(write);
        });
      pendingWritesRef.current.add(write);
    },
    []
  );

  const stopConnection = useCallback(() => {
    if (endingTimerRef.current) {
      clearTimeout(endingTimerRef.current);
      endingTimerRef.current = null;
    }
    cancelAnimationFrame(animationRef.current);
    channelRef.current?.close();
    peerRef.current?.close();
    streamRef.current?.getTracks().forEach((track) => track.stop());
    audioContextRef.current?.close().catch(() => {});
    if (audioRef.current) {
      audioRef.current.srcObject = null;
      audioRef.current.remove();
    }
    channelRef.current = null;
    peerRef.current = null;
    streamRef.current = null;
    audioContextRef.current = null;
    audioRef.current = null;
    setAudioLevel(0);
  }, []);

  const finishSession = useCallback(async () => {
    if (finishingRef.current) return;
    finishingRef.current = true;
    stopConnection();
    setState("ending");
    setShowSessionEnd(true);
    setSessionSummary(null);

    if (!conversationIdRef.current) {
      setSessionSummary({ highlights: [], completeness: 0 });
      return;
    }

    try {
      await Promise.allSettled(Array.from(pendingWritesRef.current));
      const response = await fetch("/api/ai/extract-profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          conversationId: conversationIdRef.current,
        }),
      });
      const data = await response.json();
      setSessionSummary({
        highlights: data.profile?.session_highlights ?? [],
        completeness: data.profile?.profile_completeness ?? 0,
      });
    } catch {
      setSessionSummary({ highlights: [], completeness: 0 });
    }
  }, [stopConnection]);

  const handleRealtimeEvent = useCallback(
    (event: RealtimeEvent) => {
      switch (event.type) {
        case "input_audio_buffer.speech_started":
          setState("listening");
          break;
        case "input_audio_buffer.speech_stopped":
          setState("thinking");
          break;
        case "conversation.item.input_audio_transcription.completed": {
          const itemId = event.item_id ?? crypto.randomUUID();
          const text = event.transcript?.trim() ?? "";
          if (!text) break;
          updateTranscript(itemId, "user", text);
          persistMessage(itemId, "user", text);
          if (isGoodbye(text)) {
            endingRequestedRef.current = true;
            setState("ending");
          }
          break;
        }
        case "response.created":
        case "response.output_audio.delta":
          setState(endingRequestedRef.current ? "ending" : "speaking");
          break;
        case "response.output_audio_transcript.delta": {
          const itemId = event.item_id ?? event.response_id ?? "sage-live";
          const current = assistantDraftsRef.current.get(itemId) ?? "";
          const next = current + (event.delta ?? "");
          assistantDraftsRef.current.set(itemId, next);
          updateTranscript(itemId, "sage", next, true);
          break;
        }
        case "response.output_audio_transcript.done": {
          const itemId = event.item_id ?? event.response_id ?? crypto.randomUUID();
          const text =
            event.transcript?.trim() ??
            assistantDraftsRef.current.get(itemId)?.trim() ??
            "";
          if (!text) break;
          assistantDraftsRef.current.delete(itemId);
          updateTranscript(itemId, "sage", text);
          persistMessage(itemId, "assistant", text);
          break;
        }
        case "response.done": {
          if (endingRequestedRef.current) {
            setState("ending");
            endingTimerRef.current = setTimeout(() => {
              void finishSession();
            }, 5000);
          } else {
            setState("listening");
          }
          break;
        }
        case "output_audio_buffer.stopped":
          if (endingRequestedRef.current) {
            void finishSession();
          } else {
            setState("listening");
          }
          break;
        case "error":
          console.error("Realtime API error:", event.error?.message);
          toast.error(event.error?.message ?? "The voice session hit a problem.");
          setState("error");
          break;
      }
    },
    [finishSession, persistMessage, updateTranscript]
  );

  const startAudioMeter = useCallback((stream: MediaStream) => {
    const context = new AudioContext();
    const analyser = context.createAnalyser();
    analyser.fftSize = 256;
    context.createMediaStreamSource(stream).connect(analyser);
    audioContextRef.current = context;

    const values = new Uint8Array(analyser.frequencyBinCount);
    const tick = () => {
      analyser.getByteFrequencyData(values);
      const average =
        values.reduce((total, value) => total + value, 0) / values.length;
      setAudioLevel(average / 90);
      animationRef.current = requestAnimationFrame(tick);
    };
    tick();
  }, []);

  const startSession = useCallback(async () => {
    if (state === "connecting") return;
    setState("connecting");
    stopConnection();
    endingRequestedRef.current = false;
    finishingRef.current = false;
    loggedItemsRef.current.clear();
    assistantDraftsRef.current.clear();

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });
      streamRef.current = stream;
      startAudioMeter(stream);

      const peer = new RTCPeerConnection();
      peerRef.current = peer;
      stream.getTracks().forEach((track) => peer.addTrack(track, stream));

      const audio = document.createElement("audio");
      audio.autoplay = true;
      audio.setAttribute("playsinline", "true");
      audioRef.current = audio;
      peer.ontrack = (event) => {
        audio.srcObject = event.streams[0];
        void audio.play().catch(() => {});
      };

      const channel = peer.createDataChannel("oai-events");
      channelRef.current = channel;
      channel.onmessage = (message) => {
        handleRealtimeEvent(JSON.parse(message.data) as RealtimeEvent);
      };
      channel.onopen = () => {
        setState("thinking");
        channel.send(
          JSON.stringify({
            type: "response.create",
            response: {
              instructions:
                "Begin the session now with the appropriate brief welcome, then ask one natural question.",
            },
          })
        );
      };
      channel.onerror = () => setState("error");

      const offer = await peer.createOffer();
      await peer.setLocalDescription(offer);

      const response = await fetch("/api/ai/realtime/session", {
        method: "POST",
        headers: { "Content-Type": "application/sdp" },
        body: offer.sdp,
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(
          errorData?.error ?? "Could not connect the realtime voice session."
        );
      }

      const {
        sdp,
        conversationId,
      }: {
        sdp?: string;
        conversationId?: string;
      } = await response.json();

      if (!sdp || !conversationId) {
        throw new Error("The realtime voice session was not configured.");
      }

      conversationIdRef.current = conversationId;

      await peer.setRemoteDescription({
        type: "answer",
        sdp,
      });
    } catch (error) {
      stopConnection();
      setState("error");
      toast.error(
        error instanceof Error
          ? error.message
          : "Microphone access or the voice connection failed."
      );
    }
  }, [handleRealtimeEvent, startAudioMeter, state, stopConnection]);

  const endChat = useCallback(() => {
    if (!channelRef.current || channelRef.current.readyState !== "open") {
      void finishSession();
      return;
    }

    endingRequestedRef.current = true;
    setState("ending");
    streamRef.current?.getAudioTracks().forEach((track) => {
      track.enabled = false;
    });
    channelRef.current.send(JSON.stringify({ type: "response.cancel" }));
    channelRef.current.send(JSON.stringify({ type: "input_audio_buffer.clear" }));
    channelRef.current.send(
      JSON.stringify({
        type: "response.create",
        response: {
          instructions:
            "End the session now with one brief, warm farewell. Do not ask another question.",
        },
      })
    );
  }, [finishSession]);

  useEffect(() => {
    transcriptEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [transcript]);

  useEffect(() => stopConnection, [stopConnection]);

  const status =
    state === "idle"
      ? "Tap once to begin"
      : state === "connecting"
        ? "Connecting securely..."
        : state === "listening"
          ? "Listening"
          : state === "thinking"
            ? "Sage is thinking"
            : state === "speaking"
              ? "Sage is speaking"
              : state === "ending"
                ? "Wrapping up"
                : "Tap to reconnect";

  return (
    <main className="relative flex h-dvh flex-col overflow-hidden bg-background">
      <header className="flex shrink-0 items-center justify-between border-b border-border/70 px-5 pb-4 pt-[calc(1rem+env(safe-area-inset-top))]">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-primary">
            Done Swiping
          </p>
          <h1 className="text-lg font-bold text-foreground">Sage</h1>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => router.push("/home")}
            className="flex h-10 w-10 items-center justify-center rounded-2xl bg-muted text-muted-foreground"
            aria-label="Go home"
          >
            <Home className="h-4 w-4" />
          </button>
          {state !== "idle" && state !== "error" && (
            <button
              type="button"
              onClick={endChat}
              className="flex h-10 items-center gap-1.5 rounded-2xl border border-border bg-white px-3 text-sm font-medium text-muted-foreground"
            >
              <X className="h-4 w-4" />
              End
            </button>
          )}
        </div>
      </header>

      <section className="flex shrink-0 flex-col items-center px-5 pb-5 pt-7">
        <SageOrb state={state} audioLevel={audioLevel} onStart={startSession} />
        <p className="mt-4 text-sm font-semibold text-foreground">{status}</p>
        <p className="mt-1 text-xs text-muted-foreground">
          {state === "idle" || state === "error"
            ? "After this, the conversation is completely hands-free."
            : state === "speaking"
              ? "Just speak to interrupt naturally."
              : "Your microphone stays live for natural turn-taking."}
        </p>
      </section>

      <div className="mx-5 h-px shrink-0 bg-border/70" />

      <section
        className="flex flex-1 flex-col gap-3 overflow-y-auto px-5 py-5"
        role="log"
        aria-live="polite"
        aria-label="Conversation transcript"
      >
        {transcript.length === 0 && (
          <div className="flex flex-1 flex-col items-center justify-center text-center">
            <span className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10">
              {state === "error" ? (
                <MicOff className="h-5 w-5 text-primary" />
              ) : (
                <Mic className="h-5 w-5 text-primary" />
              )}
            </span>
            <p className="max-w-[250px] text-sm leading-6 text-muted-foreground">
              Sage speaks first, listens continuously, and can be interrupted
              just like a human conversation.
            </p>
          </div>
        )}

        {transcript.map((item) => (
          <div
            key={item.id}
            className={`flex ${item.role === "sage" ? "justify-start" : "justify-end"}`}
          >
            <p
              className={`max-w-[86%] rounded-2xl px-4 py-3 text-sm leading-6 ${
                item.role === "sage"
                  ? "chat-bubble-ai"
                  : "chat-bubble-user"
              } ${item.draft ? "opacity-75" : ""}`}
            >
              {item.text}
            </p>
          </div>
        ))}
        <div ref={transcriptEndRef} />
      </section>

      {showSessionEnd && (
        <SessionEndOverlay
          summary={sessionSummary}
          onClose={() => {
            conversationIdRef.current = null;
            endingRequestedRef.current = false;
            finishingRef.current = false;
            setTranscript([]);
            setShowSessionEnd(false);
            setSessionSummary(null);
            setState("idle");
          }}
          onHome={() => router.push("/home")}
        />
      )}
    </main>
  );
}
