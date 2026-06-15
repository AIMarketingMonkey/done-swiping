# Done Swiping

Done Swiping is a mobile-first, voice-first dating app. Sage learns about each
user through natural speech-to-speech conversations, builds a compatibility
profile over multiple sessions, and unlocks curated matches when the profile is
complete enough to support reliable matching.

## Architecture

- **Next.js 14** hosts the mobile web app and server routes.
- **OpenAI Realtime API over WebRTC** provides low-latency, interruptible,
  speech-to-speech conversations.
- **Supabase** provides authentication, Postgres, row-level security, realtime
  messaging, and storage.
- **Supabase MCP** is an internal development tool for inspecting and managing
  the Supabase project. It does not host or serve the customer application.
- **Vercel** is the recommended public HTTPS host. HTTPS is required for
  microphone access on mobile browsers.

## Local development

```powershell
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

To expose the UI on the local network:

```powershell
pnpm dev:mobile
```

Then open `http://<computer-lan-ip>:3000` on a phone connected to the same
network. Most mobile browsers will not grant microphone access on an insecure
LAN URL, so use the HTTPS deployment for full voice testing.

Next.js can also start an experimental local HTTPS server:

```powershell
pnpm dev:https
```

The generated certificate must be trusted by the phone before microphone access
will work reliably.

## Required environment variables

Copy `.env.example` to `.env.local` and configure:

```text
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
OPENAI_API_KEY
NEXT_PUBLIC_APP_URL
```

`OPENAI_REALTIME_MODEL` is optional and defaults to `gpt-realtime-2`.

Never expose `OPENAI_API_KEY` or `SUPABASE_SERVICE_ROLE_KEY` to browser code.

## Realtime voice path

The live conversation does not use the old sequential
Whisper -> chat completion -> MP3 TTS path. The browser sends its WebRTC SDP
offer to the authenticated `/api/ai/realtime/session` route. That route performs
the one-time OpenAI signalling exchange and returns the SDP answer. Audio then
flows continuously over the WebRTC connection, rather than through Vercel.

- Sage speaks first.
- Semantic voice activity detection controls turn-taking.
- The user can interrupt Sage naturally.
- Transcript persistence happens asynchronously and never blocks audio.
- Profile extraction runs only after the conversation has ended.

## Mobile installation

The production build includes a web app manifest, icons, safe-area handling,
and an offline screen. On the deployed HTTPS URL:

- **iPhone:** Safari -> Share -> Add to Home Screen.
- **Android:** Chrome -> menu -> Install app or Add to Home screen.

## Supabase MCP

Project-scoped, read-only MCP configuration is included for:

- Claude/Cursor-compatible clients: `.mcp.json`
- Codex: `.codex/config.toml`

Authenticate through your MCP client's browser login flow. Keep manual approval
enabled for MCP tool calls. Supabase recommends using MCP against development
data rather than a production database containing real user information.

## Production deployment

See [DEPLOYMENT.md](./DEPLOYMENT.md).
