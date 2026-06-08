import { NextRequest, NextResponse } from "next/server";
import { createClient } from "redis";

// Ensure this route always runs dynamically on the Node.js runtime
// (the redis client needs Node, not the edge runtime).
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const KEY_PREFIX = "vocaira:chatgroup:";

// Reuse a single Redis connection across invocations where possible.
let clientPromise: ReturnType<typeof connect> | null = null;

async function connect() {
  const url = process.env.REDIS_URL;
  if (!url) {
    throw new Error("REDIS_URL is not configured");
  }
  const client = createClient({ url });
  client.on("error", (err) => console.error("Redis client error", err));
  await client.connect();
  return client;
}

async function getClient() {
  if (!clientPromise) {
    clientPromise = connect();
  }
  try {
    const client = await clientPromise;
    if (!client.isOpen) {
      clientPromise = connect();
      return await clientPromise;
    }
    return client;
  } catch (err) {
    clientPromise = null;
    throw err;
  }
}

function deviceKey(deviceId: string) {
  return KEY_PREFIX + deviceId;
}

// GET /api/memory?deviceId=...  -> { chatGroupId: string | null }
export async function GET(req: NextRequest) {
  const deviceId = req.nextUrl.searchParams.get("deviceId");
  if (!deviceId) {
    return NextResponse.json({ error: "deviceId is required" }, { status: 400 });
  }
  try {
    const client = await getClient();
    const chatGroupId = await client.get(deviceKey(deviceId));
    return NextResponse.json({ chatGroupId: chatGroupId ?? null });
  } catch (err) {
    console.error("memory GET failed", err);
    return NextResponse.json({ error: "lookup failed" }, { status: 500 });
  }
}

// POST /api/memory  { deviceId, chatGroupId }  -> { ok: true }
export async function POST(req: NextRequest) {
  let body: { deviceId?: string; chatGroupId?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid JSON body" }, { status: 400 });
  }
  const { deviceId, chatGroupId } = body;
  if (!deviceId || !chatGroupId) {
    return NextResponse.json(
      { error: "deviceId and chatGroupId are required" },
      { status: 400 }
    );
  }
  try {
    const client = await getClient();
    await client.set(deviceKey(deviceId), chatGroupId);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("memory POST failed", err);
    return NextResponse.json({ error: "save failed" }, { status: 500 });
  }
}

// DELETE /api/memory?deviceId=...  -> { ok: true }  (forget this device)
export async function DELETE(req: NextRequest) {
  const deviceId = req.nextUrl.searchParams.get("deviceId");
  if (!deviceId) {
    return NextResponse.json({ error: "deviceId is required" }, { status: 400 });
  }
  try {
    const client = await getClient();
    await client.del(deviceKey(deviceId));
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("memory DELETE failed", err);
    return NextResponse.json({ error: "delete failed" }, { status: 500 });
  }
}
