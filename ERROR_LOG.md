# Done Swiping Realtime Voice Error Log

## Incident summary

**Date resolved:** 15 June 2026

**Affected area:** Sage voice conversation startup

**User-visible error:** `Could not connect to the realtime voice session`

**Status:** Resolved in production

**Final fix commit:** `dc744fb`
**Production URL:** `https://done-swiping.vercel.app`

After microphone permission was granted, tapping the Sage orb failed before the
voice conversation began. Authentication, Supabase, microphone access, and
conversation-row creation were working. OpenAI rejected the WebRTC signalling
request because the application was using a retired Realtime API request shape.

## Confirmed production error

Vercel reported:

```text
The Realtime Beta API is no longer supported. Please use /v1/realtime for the GA API.
code: beta_api_shape_disabled
```

This occurred even when `gpt-realtime-2` was selected, proving that the remaining
problem was the request shape and endpoint, not simply the model name.

## Root causes

1. The app initially used an obsolete Realtime preview model and beta-era
   signalling flow.
2. A Vercel `OPENAI_REALTIME_MODEL` value could override the code with a retired
   `gpt-4o-realtime-preview` model.
3. Sending raw SDP directly to `/v1/realtime?model=...` was treated by OpenAI as
   the disabled beta API shape.
4. Earlier browser-direct signalling made failures harder to diagnose and added
   a cross-origin dependency.
5. The unsupported voice name `vale` had also been tried. The working voice is
   currently `marin`.

## Diagnostic path

### 1. Verified the surrounding systems

- Supabase email authentication and verification worked.
- The authenticated `/chat` page loaded.
- The browser granted microphone permission.
- The server created an `ai_conversations` record.
- `OPENAI_API_KEY` was present and valid.

This narrowed the failure to OpenAI Realtime session establishment.

### 2. Removed retired model selection

Commit `a7b0b8b` added a guard that rejects preview-era model overrides:

```ts
const configuredRealtimeModel = process.env.OPENAI_REALTIME_MODEL?.trim();
const REALTIME_MODEL =
  configuredRealtimeModel &&
  !configuredRealtimeModel.includes("preview") &&
  !configuredRealtimeModel.startsWith("gpt-4o-realtime")
    ? configuredRealtimeModel
    : "gpt-realtime-2";
```

This confirmed production was using `gpt-realtime-2`, but OpenAI still returned
`beta_api_shape_disabled`. That isolated the endpoint and payload as the final
cause.

### 3. Validated the GA endpoint independently

The configured OpenAI account was tested directly against:

```text
POST https://api.openai.com/v1/realtime/calls
```

The request used multipart form data containing:

- `sdp`: a deliberately invalid test offer
- `session`: a GA Realtime session configuration

OpenAI returned `invalid_offer`, rather than a beta API error. This was the
expected result and proved that the account, API key, model, endpoint, and
multipart request shape were accepted.

## Final fix

The authenticated Next.js route at
`app/api/ai/realtime/session/route.ts` now:

1. Authenticates the Supabase user.
2. Loads existing profile context for Sage.
3. Creates an `ai_conversations` database row.
4. Receives the browser's SDP offer as `application/sdp`.
5. Builds Sage's complete GA Realtime session configuration.
6. Sends both `sdp` and `session` as multipart `FormData` to:

```text
https://api.openai.com/v1/realtime/calls
```

7. Returns the SDP answer and conversation ID to the browser.
8. Keeps `OPENAI_API_KEY` entirely server-side.

The browser then applies the SDP answer to its `RTCPeerConnection`. Audio travels
over WebRTC after the one-time server-assisted signalling exchange.

The redundant client-side `session.update` was removed because the complete
session is now configured during the GA handshake.

## Current working Realtime configuration

```text
Model: gpt-realtime-2
Voice: marin
Transport: WebRTC
Endpoint: POST /v1/realtime/calls
Request format: multipart FormData containing sdp and session
Turn detection: semantic_vad
Eagerness: high
Automatic response creation: enabled
Interruption: enabled
Input transcription: gpt-4o-mini-transcribe
```

Sage speaks first when the WebRTC data channel opens. The conversation is
duplex, hands-free after the initial tap, and supports interruption.

## Failed approaches retained for context

Do not restore any of these:

- `gpt-4o-realtime-preview`
- Any `gpt-4o-realtime*` preview model
- Raw SDP sent to `/v1/realtime?model=...`
- Browser-direct SDP POSTs to OpenAI
- Beta headers or beta Realtime payloads
- Voice `vale`
- A second client-side `session.update` immediately after connection

## Design handoff constraints

Claude can freely redesign the orb screen and surrounding interface, but should
preserve these functional contracts:

- Keep the orb's first user interaction connected to `startSession()`. Mobile
  browsers require a user gesture for microphone access and audio playback.
- Do not replace the native speech-to-speech Realtime path with sequential
  STT, chat completion, and TTS calls. That would materially increase latency.
- Do not add a text input. Done Swiping is voice-first.
- Preserve the `RTCPeerConnection`, remote audio element, data channel, and
  microphone stream lifecycle.
- Preserve interruption and semantic voice activity detection.
- Keep OpenAI and Supabase service credentials out of browser code.
- Keep the session-end path so transcripts can be stored and the cumulative
  profile can be extracted.
- Photos remain deferred until after a match.

## Deployment and verification

The final implementation passed:

```powershell
.\node_modules\.bin\next.cmd build
```

It was deployed through GitHub `main` to Vercel in commit:

```text
dc744fb fix: use GA realtime calls handshake
```

The production deployment was verified as `Ready`, and a fresh user completed
microphone authorization and successfully started the Sage voice session.

## Relevant files

- `app/api/ai/realtime/session/route.ts`
- `app/(chat)/chat/page.tsx`
- `lib/openai/client.ts`
- `DEPLOYMENT.md`
- `README.md`
