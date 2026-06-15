import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { conversationId, role, message } = await request.json();
  if (
    !conversationId ||
    !["user", "assistant"].includes(role) ||
    typeof message !== "string" ||
    !message.trim()
  ) {
    return NextResponse.json({ error: "Invalid message" }, { status: 400 });
  }

  const { data: conversation } = await supabase
    .from("ai_conversations")
    .select("id")
    .eq("id", conversationId)
    .eq("user_id", user.id)
    .single();

  if (!conversation) {
    return NextResponse.json(
      { error: "Conversation not found" },
      { status: 404 }
    );
  }

  const { error } = await supabase.from("ai_messages").insert({
    conversation_id: conversationId,
    role,
    message: message.trim(),
  });

  if (error) {
    return NextResponse.json({ error: "Could not save message" }, { status: 500 });
  }

  await supabase
    .from("ai_conversations")
    .update({ updated_at: new Date().toISOString() })
    .eq("id", conversationId);

  return NextResponse.json({ success: true });
}
