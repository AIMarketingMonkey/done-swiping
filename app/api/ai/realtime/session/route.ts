import { createHash } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { SAGE_SYSTEM_PROMPT } from "@/lib/openai/client";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const configuredRealtimeModel = process.env.OPENAI_REALTIME_MODEL?.trim();
const REALTIME_MODEL =
  configuredRealtimeModel &&
  !configuredRealtimeModel.includes("preview") &&
  !configuredRealtimeModel.startsWith("gpt-4o-realtime")
    ? configuredRealtimeModel
    : "gpt-realtime-2";

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json(
      { error: "OpenAI is not configured" },
      { status: 503 }
    );
  }

  const sdp = await request.text();
  if (!sdp.trim()) {
    return NextResponse.json({ error: "Missing SDP offer" }, { status: 400 });
  }

  const [userResult, profileResult, structuredResult] = await Promise.all([
    supabase.from("users").select("name").eq("id", user.id).single(),
    supabase
      .from("user_profiles")
      .select("profile_completion_score, ai_summary")
      .eq("user_id", user.id)
      .single(),
    supabase
      .from("structured_profiles")
      .select("*")
      .eq("user_id", user.id)
      .single(),
  ]);

  const hasProfile =
    (profileResult.data?.profile_completion_score ?? 0) > 0 ||
    Boolean(structuredResult.data);

  const { data: conversation, error: conversationError } = await supabase
    .from("ai_conversations")
    .insert({
      user_id: user.id,
      conversation_type: hasProfile ? "profile_refinement" : "onboarding",
    })
    .select("id")
    .single();

  if (conversationError || !conversation) {
    return NextResponse.json(
      { error: "Could not create conversation" },
      { status: 500 }
    );
  }

  const knownProfile = {
    name: userResult.data?.name ?? null,
    completeness: profileResult.data?.profile_completion_score ?? 0,
    public_summary: profileResult.data?.ai_summary ?? null,
    structured_profile: structuredResult.data ?? null,
  };

  const instructions = `${SAGE_SYSTEM_PROMPT}

REALTIME VOICE BEHAVIOUR
- This is a live, low-latency speech conversation. Respond as soon as the user has clearly finished.
- Sound natural when spoken. Use short turns, usually one or two sentences, then leave room for the user.
- Do not narrate your process or mention profile fields.
- If the user interrupts, stop cleanly and respond to what they have just said.
- If the user says goodbye or asks to end, give one brief, warm farewell and do not ask another question.

KNOWN PROFILE FROM EARLIER SESSIONS
${JSON.stringify(knownProfile)}

SESSION OPENING
${
  hasProfile
    ? "Welcome the user back naturally, briefly mention one relevant thing already known, and continue getting to know them with one useful question."
    : "Introduce yourself as Sage, explain briefly that you learn about the user through relaxed voice conversations to build a compatibility profile, then ask their preferred name."
}`;

  const safetyIdentifier = createHash("sha256")
    .update(user.id)
    .digest("hex");

  const session = {
    type: "realtime",
    model: REALTIME_MODEL,
    output_modalities: ["audio"],
    instructions,
    audio: {
      input: {
        transcription: {
          model: "gpt-4o-mini-transcribe",
          language: "en",
        },
        turn_detection: {
          type: "semantic_vad",
          eagerness: "high",
          create_response: true,
          interrupt_response: true,
        },
      },
      output: {
        voice: "marin",
      },
    },
  };

  const formData = new FormData();
  formData.set("sdp", sdp);
  formData.set("session", JSON.stringify(session));

  const openAIResponse = await fetch(
    "https://api.openai.com/v1/realtime/calls",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        "OpenAI-Safety-Identifier": safetyIdentifier,
      },
      body: formData,
      cache: "no-store",
    }
  );

  const responseBody = await openAIResponse.text();
  if (!openAIResponse.ok) {
    console.error(
      `Realtime SDP exchange failed for model ${REALTIME_MODEL}:`,
      responseBody
    );
    return NextResponse.json(
      {
        error: "Could not connect the realtime voice session",
        details:
          process.env.NODE_ENV === "development" ? responseBody : undefined,
      },
      { status: openAIResponse.status }
    );
  }

  return NextResponse.json(
    {
      sdp: responseBody,
      conversationId: conversation.id,
    },
    {
      headers: {
        "Cache-Control": "no-store",
      },
    }
  );
}
