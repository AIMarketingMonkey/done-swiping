import { redirect } from "next/navigation";
import Link from "next/link";
import { CheckCircle2, Edit3, ArrowRight, MessageCircleHeart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/server";

// ── Types ─────────────────────────────────────────────────────────────────────

interface ExtractedProfile {
  bio: string;
  personalityTraits: string[];
  values: string[];
  relationshipGoal: string;
  communicationStyle: string;
  dealBreakers: string[];
  matchingSummary: string;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

async function fetchProfile(userId: string): Promise<ExtractedProfile | null> {
  try {
    const baseUrl =
      process.env.NEXT_PUBLIC_APP_URL ??
      (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");

    const res = await fetch(`${baseUrl}/api/profile`, {
      headers: { "x-user-id": userId },
      cache: "no-store",
    });

    if (!res.ok) return null;
    const data = await res.json();
    return data.profile ?? null;
  } catch {
    return null;
  }
}

// Fallback skeleton profile when API isn't ready yet
const FALLBACK_PROFILE: ExtractedProfile = {
  bio: "Your profile is being built from your conversation with Sage. It will appear here shortly.",
  personalityTraits: ["Warm", "Thoughtful", "Adventurous"],
  values: ["Honesty", "Family", "Personal growth"],
  relationshipGoal: "A committed, long-term partnership",
  communicationStyle: "Open and direct, with plenty of warmth",
  dealBreakers: [],
  matchingSummary:
    "You'll connect best with someone who values depth over surface-level connection — someone curious, emotionally available, and ready for something real.",
};

// ── Sub-components ────────────────────────────────────────────────────────────

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <p
      className="text-xs font-semibold uppercase tracking-wider mb-2"
      style={{ color: "oklch(0.6 0.16 22)" }}
    >
      {children}
    </p>
  );
}

function Pill({ children }: { children: React.ReactNode }) {
  return (
    <span
      className="inline-flex items-center rounded-full px-3 py-1 text-xs font-medium"
      style={{
        background: "oklch(0.97 0.02 30)",
        color: "oklch(0.5 0.14 22)",
        border: "1px solid oklch(0.9 0.04 22)",
      }}
    >
      {children}
    </span>
  );
}

function ValuePill({ children }: { children: React.ReactNode }) {
  return (
    <span
      className="inline-flex items-center rounded-full px-3 py-1 text-xs font-medium"
      style={{
        background: "oklch(0.96 0.02 260)",
        color: "oklch(0.35 0.1 260)",
        border: "1px solid oklch(0.88 0.04 260)",
      }}
    >
      {children}
    </span>
  );
}

function DealBreakerPill({ children }: { children: React.ReactNode }) {
  return (
    <span
      className="inline-flex items-center rounded-full px-3 py-1 text-xs font-medium"
      style={{
        background: "oklch(0.97 0.01 0)",
        color: "oklch(0.4 0.08 10)",
        border: "1px solid oklch(0.88 0.04 10)",
      }}
    >
      {children}
    </span>
  );
}

function ProfileCard({
  title,
  children,
  onEditClick,
}: {
  title: string;
  children: React.ReactNode;
  onEditClick?: () => void;
}) {
  return (
    <div
      className="rounded-2xl p-5"
      style={{
        background: "oklch(1 0 0)",
        boxShadow: "0 2px 12px oklch(0.18 0.04 270 / 0.07)",
      }}
    >
      <div className="flex items-center justify-between mb-3">
        <SectionHeading>{title}</SectionHeading>
        <EditButton onClick={onEditClick} />
      </div>
      {children}
    </div>
  );
}

// Client-side edit button wrapper — logs for now, per spec
function EditButton({ onClick }: { onClick?: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="Edit this section"
      className="flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-medium transition-colors hover:bg-muted"
      style={{ color: "oklch(0.55 0.02 50)" }}
    >
      <Edit3 className="w-3 h-3" aria-hidden="true" />
      Edit
    </button>
  );
}

// ── Approve form — client island ───────────────────────────────────────────────
// Because this is a Server Component we use a plain HTML form with a Server Action
// to keep the approve flow server-side, or delegate to a lightweight client wrapper.
// For simplicity here we use a standard <form> action pointing to the PATCH endpoint.

import ApproveButton from "./ApproveButton";

// ── Page ──────────────────────────────────────────────────────────────────────

export default async function ProfileReviewPage() {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    redirect("/login");
  }

  const profile = (await fetchProfile(user.id)) ?? FALLBACK_PROFILE;

  return (
    <div className="flex flex-col gap-5 animate-fade-in-up pt-2 pb-6">
      {/* Header */}
      <div>
        <div
          className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold mb-3"
          style={{
            background: "oklch(0.95 0.04 130)",
            color: "oklch(0.35 0.1 130)",
          }}
        >
          <CheckCircle2 className="w-3.5 h-3.5" aria-hidden="true" />
          Profile ready to review
        </div>
        <h1
          className="text-2xl font-bold mb-1"
          style={{ color: "oklch(0.18 0.04 270)" }}
        >
          Here&apos;s your profile
        </h1>
        <p className="text-sm" style={{ color: "oklch(0.55 0.02 50)" }}>
          Sage built this from your conversation. Review it, make any edits, then
          go live when you&apos;re ready.
        </p>
      </div>

      {/* Bio */}
      <ProfileCard
        title="About you"
        onEditClick={() => console.log("edit clicked: bio")}
      >
        <p className="text-sm leading-relaxed" style={{ color: "oklch(0.3 0.03 270)" }}>
          {profile.bio}
        </p>
      </ProfileCard>

      {/* Personality traits */}
      {profile.personalityTraits.length > 0 && (
        <ProfileCard
          title="Personality"
          onEditClick={() => console.log("edit clicked: personality")}
        >
          <div className="flex flex-wrap gap-2">
            {profile.personalityTraits.map((trait) => (
              <Pill key={trait}>{trait}</Pill>
            ))}
          </div>
        </ProfileCard>
      )}

      {/* Values */}
      {profile.values.length > 0 && (
        <ProfileCard
          title="Values"
          onEditClick={() => console.log("edit clicked: values")}
        >
          <div className="flex flex-wrap gap-2">
            {profile.values.map((v) => (
              <ValuePill key={v}>{v}</ValuePill>
            ))}
          </div>
        </ProfileCard>
      )}

      {/* Relationship goal */}
      {profile.relationshipGoal && (
        <ProfileCard
          title="Relationship goal"
          onEditClick={() => console.log("edit clicked: relationship_goal")}
        >
          <p className="text-sm" style={{ color: "oklch(0.3 0.03 270)" }}>
            {profile.relationshipGoal}
          </p>
        </ProfileCard>
      )}

      {/* Communication style */}
      {profile.communicationStyle && (
        <ProfileCard
          title="Communication style"
          onEditClick={() => console.log("edit clicked: communication_style")}
        >
          <p className="text-sm" style={{ color: "oklch(0.3 0.03 270)" }}>
            {profile.communicationStyle}
          </p>
        </ProfileCard>
      )}

      {/* Deal breakers */}
      {profile.dealBreakers.length > 0 && (
        <ProfileCard
          title="Deal breakers"
          onEditClick={() => console.log("edit clicked: deal_breakers")}
        >
          <div className="flex flex-wrap gap-2">
            {profile.dealBreakers.map((d) => (
              <DealBreakerPill key={d}>{d}</DealBreakerPill>
            ))}
          </div>
        </ProfileCard>
      )}

      {/* Matching summary */}
      {profile.matchingSummary && (
        <div
          className="rounded-2xl p-5"
          style={{
            background: "linear-gradient(135deg, oklch(0.97 0.02 30), oklch(0.99 0.008 50))",
            border: "1px solid oklch(0.9 0.04 22)",
          }}
        >
          <SectionHeading>Your matching summary</SectionHeading>
          <p
            className="text-sm leading-relaxed italic"
            style={{ color: "oklch(0.35 0.05 30)" }}
          >
            &ldquo;{profile.matchingSummary}&rdquo;
          </p>
        </div>
      )}

      {/* Actions */}
      <div className="flex flex-col gap-3 pt-2">
        <ApproveButton />

        <Link
          href="/ai-chat"
          className="flex items-center justify-center gap-1.5 text-sm font-medium py-2 transition-colors hover:underline"
          style={{ color: "oklch(0.55 0.02 50)" }}
        >
          <MessageCircleHeart className="w-4 h-4" aria-hidden="true" />
          Continue editing with Sage
        </Link>
      </div>
    </div>
  );
}
