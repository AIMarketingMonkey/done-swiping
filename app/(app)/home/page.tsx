import { createClient } from "@/lib/supabase/server";
import { Sparkles, ArrowRight, Camera, Heart } from "lucide-react";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

function formatDate() {
  return new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
}

// ---------------------------------------------------------------------------
// Skeleton
// ---------------------------------------------------------------------------

function MatchCardSkeleton() {
  return (
    <div className="rounded-2xl overflow-hidden border border-border bg-card">
      <div className="skeleton h-48 w-full" />
      <div className="p-3 space-y-2">
        <div className="skeleton h-4 w-24 rounded" />
        <div className="skeleton h-3 w-full rounded" />
        <div className="skeleton h-3 w-4/5 rounded" />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Match card
// ---------------------------------------------------------------------------

interface MatchCardProps {
  name: string;
  age: number;
  compatibility: number;
  bio: string;
  compatibilityNote: string;
  photoUrl?: string;
}

function MatchCard({
  name,
  age,
  compatibility,
  bio,
  compatibilityNote,
  photoUrl,
}: MatchCardProps) {
  const badgeColor =
    compatibility >= 85
      ? "oklch(0.6 0.16 22)"
      : compatibility >= 70
      ? "oklch(0.65 0.14 40)"
      : "oklch(0.65 0.12 60)";

  return (
    <article className="rounded-2xl overflow-hidden border border-border bg-card shadow-sm hover:shadow-md transition-shadow cursor-pointer group">
      {/* Photo */}
      <div className="relative h-52 bg-gradient-to-br from-muted to-border overflow-hidden">
        {photoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={photoUrl}
            alt={name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Camera
              className="w-10 h-10"
              style={{ color: "var(--muted-foreground)" }}
            />
          </div>
        )}
        {/* Compatibility badge */}
        <div
          className="absolute top-2.5 right-2.5 px-2 py-0.5 rounded-full text-xs font-bold text-white shadow"
          style={{ background: badgeColor }}
        >
          {compatibility}% match
        </div>
      </div>

      {/* Details */}
      <div className="p-3.5 space-y-1.5">
        <div className="flex items-baseline gap-1.5">
          <h3 className="font-semibold text-base text-foreground">{name}</h3>
          <span className="text-sm text-muted-foreground">{age}</span>
        </div>
        <p className="text-sm text-muted-foreground line-clamp-2">{bio}</p>
        <p
          className="text-xs font-medium line-clamp-1 flex items-center gap-1"
          style={{ color: "var(--primary)" }}
        >
          <Sparkles className="w-3 h-3 flex-shrink-0" aria-hidden />
          {compatibilityNote}
        </p>
      </div>
    </article>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default async function HomePage() {
  const supabase = await createClient();

  // Fetch current user info
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: userRow } = user
    ? await supabase
        .from("users")
        .select("name")
        .eq("id", user.id)
        .single()
    : { data: null };

  const { data: profileRow } = user
    ? await supabase
        .from("user_profiles")
        .select("profile_completion_score")
        .eq("user_id", user.id)
        .single()
    : { data: null };

  const firstName = userRow?.name?.split(" ")[0] ?? "there";
  const completionScore = profileRow?.profile_completion_score ?? 0;
  const showCompletionCard = completionScore < 80;

  // Fetch today's curated matches (top 3)
  const { data: matchRows } = user
    ? await supabase
        .from("matches")
        .select(
          `
          id,
          compatibility_score,
          match_reason,
          matched_user_id,
          users!matches_matched_user_id_fkey ( name, date_of_birth ),
          user_profiles!matches_matched_user_id_fkey ( bio )
        `
        )
        .eq("user_id", user.id)
        .eq("status", "pending")
        .order("compatibility_score", { ascending: false })
        .limit(3)
    : { data: null };

  const matches = (matchRows ?? []).map((m: any) => {
    const dob = m.users?.date_of_birth;
    const age = dob
      ? Math.floor(
          (Date.now() - new Date(dob).getTime()) / (365.25 * 24 * 60 * 60 * 1000)
        )
      : 0;
    return {
      id: m.id,
      name: m.users?.name ?? "Someone special",
      age,
      compatibility: Math.round(m.compatibility_score),
      bio: m.user_profiles?.bio ?? "Looking for a genuine connection.",
      compatibilityNote: m.match_reason ?? "Shared values and outlook on life.",
    };
  });

  return (
    <div className="px-4 pt-6 pb-4 space-y-6 animate-fade-in-up">
      {/* ---- Header ---- */}
      <header>
        <p className="text-sm text-muted-foreground">{formatDate()}</p>
        <h1 className="text-2xl font-bold text-foreground mt-0.5">
          {getGreeting()},{" "}
          <span style={{ color: "var(--primary)" }}>{firstName}</span> 👋
        </h1>
      </header>

      {/* ---- Profile completion card ---- */}
      {showCompletionCard && (
        <section
          className="rounded-2xl p-4 flex items-center gap-4 border border-border"
          style={{
            background:
              "linear-gradient(135deg, oklch(0.99 0.006 60), oklch(0.97 0.025 30))",
          }}
        >
          <div
            className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center"
            style={{ background: "oklch(0.6 0.16 22 / 0.12)" }}
          >
            <Camera
              className="w-5 h-5"
              style={{ color: "var(--primary)" }}
              aria-hidden
            />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-foreground">
              Complete your profile
            </p>
            <div className="mt-1.5 h-1.5 rounded-full bg-muted overflow-hidden">
              <div
                className="h-full rounded-full transition-all"
                style={{
                  width: `${completionScore}%`,
                  background: "var(--primary)",
                }}
              />
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {completionScore}% complete — better profiles get 3× more matches
            </p>
          </div>
          <ArrowRight
            className="flex-shrink-0 w-4 h-4"
            style={{ color: "var(--primary)" }}
            aria-hidden
          />
        </section>
      )}

      {/* ---- Today's matches ---- */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold text-foreground">
            Today&apos;s Matches
          </h2>
          <a
            href="/matches"
            className="text-sm font-medium"
            style={{ color: "var(--primary)" }}
          >
            See all
          </a>
        </div>

        {matches.length === 0 ? (
          /* Empty / loading state */
          <div
            className="rounded-2xl p-8 text-center border border-dashed border-border"
            style={{ background: "var(--muted)" }}
          >
            <div
              className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-3"
              style={{ background: "oklch(0.6 0.16 22 / 0.1)" }}
            >
              <Heart
                className="w-7 h-7"
                style={{ color: "var(--primary)" }}
                aria-hidden
              />
            </div>
            <p className="text-base font-semibold text-foreground">
              Your matches are being prepared…
            </p>
            <p className="text-sm text-muted-foreground mt-1 max-w-xs mx-auto">
              Our AI is finding people who truly complement you. Check back
              soon!
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {matches.map((m) => (
              <MatchCard key={m.id} {...m} />
            ))}
          </div>
        )}
      </section>

      {/* ---- Dating insight ---- */}
      <section
        className="rounded-2xl p-4 border border-border"
        style={{
          background:
            "linear-gradient(135deg, oklch(0.97 0.025 30), oklch(0.99 0.006 60))",
        }}
      >
        <div className="flex gap-3 items-start">
          <div
            className="flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center mt-0.5"
            style={{ background: "oklch(0.6 0.16 22 / 0.12)" }}
          >
            <Sparkles
              className="w-4 h-4"
              style={{ color: "var(--primary)" }}
              aria-hidden
            />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider mb-1"
              style={{ color: "var(--primary)" }}>
              Dating Insight
            </p>
            <p className="text-sm text-foreground leading-relaxed">
              Profiles with 4+ photos get{" "}
              <strong className="font-semibold">3× more matches</strong>. Add
              a photo that shows you doing something you love — it sparks
              great conversations.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
