import { NextRequest, NextResponse } from "next/server";
import { SAGE_SYSTEM_PROMPT } from "@/lib/openai/client";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const REALTIME_MODEL =
    process.env.OPENAI_REALTIME_MODEL ?? "gpt-4o-realtime-preview";

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

  const openAIResponse = await fetch(
        `https://api.openai.com/v1/realtime?model=${REALTIME_MODEL}`,
    {
            method: "POST",
            headers: {
                      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
                      "Content-Type": "application/sdp",
            },
            body: sdp,
            cache: "no-store",
    }
      );

  const responseBody = await openAIResponse.text();
    if (!openAIResponse.ok) {
          console.error("Realtime session creation failed:", responseBody);
          return NextResponse.json(
            { error: "Could not start realtime voice session" },
            { status: openAIResponse.status }
                );
    }

  return new NextResponse(responseBody, {
        status: 200,
        headers: {
                "Content-Type": "application/sdp",
                "Cache-Control": "no-store",
                "X-Conversation-Id": conversation.id,
        },
  });
}
