# Production deployment

## 1. Deploy the Next.js app

Import the GitHub repository into Vercel and select the Next.js framework
preset. The included `vercel.json` gives profile extraction enough function
runtime while keeping realtime session creation short.

Add these environment variables to the Vercel project:

```text
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
OPENAI_API_KEY
NEXT_PUBLIC_APP_URL=https://your-domain.example
OPENAI_REALTIME_MODEL=gpt-realtime-2
```

Add Stripe variables only when subscription billing is enabled.

## 2. Configure Supabase Auth

In Supabase Dashboard -> Authentication -> URL Configuration:

1. Set **Site URL** to the final HTTPS app URL.
2. Add `https://your-domain.example/auth-callback` to Redirect URLs.
3. Keep `http://localhost:3000/auth-callback` for local development.

The production URL must use HTTPS. Mobile Safari and Chrome require a secure
context for microphone access.

## 3. Configure OpenAI

Keep `OPENAI_API_KEY` server-side. The authenticated Next.js route uses it to
mint a short-lived Realtime client secret containing Sage's session
configuration. The browser uses only that ephemeral secret to establish WebRTC
directly with OpenAI's GA `/v1/realtime` endpoint.

The default settings are tuned for conversation latency:

- Native speech-to-speech model: `gpt-realtime-2`
- WebRTC transport
- Semantic VAD with high eagerness
- Automatic response creation and interruption
- Asynchronous transcript storage

Test this against real phones, accents, microphones, and background noise before
launch. Human-like latency is a measured product requirement, not something to
assume from desktop testing.

## 4. Install on a phone

Open the deployed URL on the phone and sign in.

- iOS: Safari -> Share -> Add to Home Screen
- Android: Chrome -> menu -> Install app

The first tap on Sage is required by browser privacy rules to grant microphone
access and unlock audio playback. After that tap, conversation is duplex and
hands-free.

## 5. Supabase MCP

MCP is for the development team and AI coding tools. It is not part of the
customer runtime and should never be exposed to app users.

The repository configuration is project-scoped and read-only:

```text
https://mcp.supabase.com/mcp?project_ref=txnvpmoichprixbnnifb&read_only=true
```

For schema changes, use a separate development Supabase project or database
branch and temporarily enable only the MCP features required for that change.
