"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Heart, Camera, Sparkles } from "lucide-react";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type FilterTab = "All" | "New" | "Saved";

interface MatchItem {
  id: string;
  name: string;
  age: number;
  compatibility: number;
  compatibilityNote: string;
  photoUrl?: string;
  isNew?: boolean;
  isSaved?: boolean;
}

// ---------------------------------------------------------------------------
// Skeleton
// ---------------------------------------------------------------------------

function CardSkeleton() {
  return (
    <div className="rounded-2xl overflow-hidden border border-border bg-card">
      <div className="skeleton aspect-[3/4] w-full" />
      <div className="p-2.5 space-y-1.5">
        <div className="skeleton h-3.5 w-20 rounded" />
        <div className="skeleton h-3 w-full rounded" />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Match card
// ---------------------------------------------------------------------------

function MatchCard({ match, onTap }: { match: MatchItem; onTap: () => void }) {
  const badgeColor =
    match.compatibility >= 85
      ? "oklch(0.6 0.16 22)"
      : match.compatibility >= 70
      ? "oklch(0.65 0.14 40)"
      : "oklch(0.65 0.12 60)";

  return (
    <article
      className="rounded-2xl overflow-hidden border border-border bg-card shadow-sm hover:shadow-md active:scale-95 transition-all cursor-pointer"
      onClick={onTap}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === "Enter" && onTap()}
      aria-label={`View ${match.name}'s profile`}
    >
      {/* Photo */}
      <div className="relative aspect-[3/4] bg-gradient-to-br from-muted to-border overflow-hidden">
        {match.photoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={match.photoUrl}
            alt={match.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Camera
              className="w-8 h-8"
              style={{ color: "var(--muted-foreground)" }}
            />
          </div>
        )}
        {/* Top badges */}
        <div className="absolute top-2 left-2 right-2 flex items-start justify-between">
          {match.isNew && (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold text-white bg-primary shadow">
              NEW
            </span>
          )}
          <span
            className="ml-auto px-2 py-0.5 rounded-full text-[10px] font-bold text-white shadow"
            style={{ background: badgeColor }}
          >
            {match.compatibility}%
          </span>
        </div>
        {/* Name overlay */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-2.5 pt-6">
          <p className="text-white font-semibold text-sm">
            {match.name}, {match.age}
          </p>
        </div>
      </div>

      {/* Note */}
      <div className="px-2.5 py-2">
        <p
          className="text-[11px] font-medium line-clamp-1 flex items-center gap-1"
          style={{ color: "var(--primary)" }}
        >
          <Sparkles className="w-3 h-3 flex-shrink-0" aria-hidden />
          {match.compatibilityNote}
        </p>
      </div>
    </article>
  );
}

// ---------------------------------------------------------------------------
// Empty state
// ---------------------------------------------------------------------------

function EmptyState({ filter }: { filter: FilterTab }) {
  const messages: Record<FilterTab, { title: string; body: string }> = {
    All: {
      title: "No matches yet",
      body: "Complete your profile to start receiving curated matches.",
    },
    New: {
      title: "No new matches",
      body: "Check back tomorrow — new matches are curated daily.",
    },
    Saved: {
      title: "Nothing saved yet",
      body: "Tap the heart icon on a match card to save them for later.",
    },
  };
  const msg = messages[filter];

  return (
    <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
      <div
        className="w-16 h-16 rounded-full flex items-center justify-center mb-4"
        style={{ background: "oklch(0.6 0.16 22 / 0.1)" }}
      >
        <Heart
          className="w-8 h-8"
          style={{ color: "var(--primary)" }}
          aria-hidden
        />
      </div>
      <p className="font-semibold text-foreground text-base">{msg.title}</p>
      <p className="text-sm text-muted-foreground mt-1.5 max-w-xs">{msg.body}</p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function MatchesPage() {
  const router = useRouter();
  const [filter, setFilter] = useState<FilterTab>("All");
  const [matches, setMatches] = useState<MatchItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMatches = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/matches");
      if (!res.ok) throw new Error("Failed to load matches");
      const data = await res.json();
      setMatches(data.matches ?? []);
    } catch (err) {
      setError("Could not load matches. Please try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMatches();
  }, [fetchMatches]);

  const filtered = matches.filter((m) => {
    if (filter === "New") return m.isNew;
    if (filter === "Saved") return m.isSaved;
    return true;
  });

  const tabs: FilterTab[] = ["All", "New", "Saved"];

  return (
    <div className="px-4 pt-6 pb-4">
      {/* Header */}
      <header className="mb-5">
        <h1 className="text-2xl font-bold text-foreground">Your Matches</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Curated just for you by AI
        </p>
      </header>

      {/* Filter tabs */}
      <div className="flex gap-2 mb-5" role="tablist" aria-label="Filter matches">
        {tabs.map((tab) => (
          <button
            key={tab}
            role="tab"
            aria-selected={filter === tab}
            onClick={() => setFilter(tab)}
            className="px-4 py-1.5 rounded-full text-sm font-medium transition-colors"
            style={
              filter === tab
                ? {
                    background: "var(--primary)",
                    color: "var(--primary-foreground)",
                  }
                : {
                    background: "var(--muted)",
                    color: "var(--muted-foreground)",
                  }
            }
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Content */}
      {loading ? (
        <div className="grid grid-cols-2 gap-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
      ) : error ? (
        <div className="text-center py-16">
          <p className="text-sm text-muted-foreground">{error}</p>
          <button
            onClick={fetchMatches}
            className="mt-3 text-sm font-medium"
            style={{ color: "var(--primary)" }}
          >
            Retry
          </button>
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState filter={filter} />
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {filtered.map((match) => (
            <MatchCard
              key={match.id}
              match={match}
              onTap={() => router.push(`/matches/${match.id}`)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
