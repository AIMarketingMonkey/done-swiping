"use client";

import { VoiceProvider } from "@humeai/voice-react";
import Messages from "./Messages";
import Controls from "./Controls";
import StartCall from "./StartCall";
import { ComponentRef, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { getDeviceId } from "@/utils/deviceId";

export default function ClientComponent({
  accessToken,
}: {
  accessToken: string;
}) {
  const timeout = useRef<number | null>(null);
  const ref = useRef<ComponentRef<typeof Messages> | null>(null);

  // optional: use configId from environment variable
  const configId = process.env['NEXT_PUBLIC_HUME_CONFIG_ID'];

  // Device-based memory: resume this device's previous conversation.
  const deviceId = useRef<string | null>(null);
  const savedGroupId = useRef<string | null>(null);
  const [resumedChatGroupId, setResumedChatGroupId] = useState<string | undefined>(
    undefined
  );
  const [memoryReady, setMemoryReady] = useState(false);

  // On mount, look up any stored chat group id for this device.
  useEffect(() => {
    const id = getDeviceId();
    deviceId.current = id;

    if (!id) {
      setMemoryReady(true);
      return;
    }

    let cancelled = false;
    fetch(`/api/memory?deviceId=${encodeURIComponent(id)}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (cancelled) return;
        const groupId: string | null = data?.chatGroupId ?? null;
        if (groupId) {
          savedGroupId.current = groupId;
          setResumedChatGroupId(groupId);
        }
      })
      .catch(() => {
        // Non-fatal: just start a fresh conversation if lookup fails.
      })
      .finally(() => {
        if (!cancelled) setMemoryReady(true);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  // Persist the chat group id for this device so we can resume next time.
  const persistChatGroupId = (groupId: string) => {
    const id = deviceId.current;
    if (!id || !groupId || groupId === savedGroupId.current) {
      return;
    }
    savedGroupId.current = groupId;
    fetch("/api/memory", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ deviceId: id, chatGroupId: groupId }),
    }).catch(() => {
      // Non-fatal: memory just won't persist this session.
    });
  };

  // Wait until we know whether there is a conversation to resume before
  // mounting the VoiceProvider (so resumedChatGroupId is correct at connect).
  if (!memoryReady) {
    return (
      <div
        className={
          "relative grow flex flex-col mx-auto w-full overflow-hidden h-[0px]"
        }
      />
    );
  }

  return (
    <div
      className={
        "relative grow flex flex-col mx-auto w-full overflow-hidden h-[0px]"
      }
    >
      <VoiceProvider
        resumedChatGroupId={resumedChatGroupId}
        onMessage={(message) => {
          // Capture the chat group id from chat metadata to enable resume.
          if (
            message?.type === "chat_metadata" &&
            "chatGroupId" in message &&
            typeof message.chatGroupId === "string"
          ) {
            persistChatGroupId(message.chatGroupId);
          }

          if (timeout.current) {
            window.clearTimeout(timeout.current);
          }
          timeout.current = window.setTimeout(() => {
            if (ref.current) {
              const scrollHeight = ref.current.scrollHeight;
              ref.current.scrollTo({
                top: scrollHeight,
                behavior: "smooth",
              });
            }
          }, 200);
        }}
        onError={(error) => {
          toast.error(error.message);
        }}
      >
        <Messages ref={ref} />
        <Controls />
        <StartCall configId={configId} accessToken={accessToken} />
      </VoiceProvider>
    </div>
  );
}
