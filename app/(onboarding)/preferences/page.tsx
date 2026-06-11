"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ArrowRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/utils";

// ── Types ─────────────────────────────────────────────────────────────────────

type HasKids = "has_kids" | "no_kids" | "no_preference";
type Smoking = "non_smoker_preferred" | "open" | "no_preference";

interface Preferences {
  ageMin: number;
  ageMax: number;
  maxDistanceMiles: number;
  hasKids: HasKids;
  smoking: Smoking;
}

const DISTANCE_OPTIONS = [10, 25, 50, 100] as const;
type Distance = (typeof DISTANCE_OPTIONS)[number];

// ── Sub-components ────────────────────────────────────────────────────────────

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p
      className="text-xs font-semibold uppercase tracking-wider mb-3"
      style={{ color: "oklch(0.6 0.16 22)" }}
    >
      {children}
    </p>
  );
}

function Card({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={cn("rounded-2xl p-5", className)}
      style={{
        background: "oklch(1 0 0)",
        boxShadow: "0 2px 12px oklch(0.18 0.04 270 / 0.07)",
      }}
    >
      {children}
    </div>
  );
}

// Chip-style toggle button
function Chip({
  selected,
  onClick,
  children,
}: {
  selected: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-full px-4 py-2 text-sm font-medium transition-all"
      style={{
        background: selected ? "oklch(0.6 0.16 22)" : "oklch(0.97 0.006 60)",
        color: selected ? "white" : "oklch(0.45 0.02 50)",
        border: selected
          ? "1.5px solid oklch(0.6 0.16 22)"
          : "1.5px solid oklch(0.88 0.012 50)",
        boxShadow: selected ? "0 2px 8px oklch(0.6 0.16 22 / 0.3)" : "none",
      }}
    >
      {children}
    </button>
  );
}

// ── Range slider ──────────────────────────────────────────────────────────────
// Simple two-thumb range slider using two overlapping <input type="range">

function AgeRangeSlider({
  min,
  max,
  onChange,
}: {
  min: number;
  max: number;
  onChange: (min: number, max: number) => void;
}) {
  const ABS_MIN = 18;
  const ABS_MAX = 80;

  function handleMinChange(e: React.ChangeEvent<HTMLInputElement>) {
    const val = Math.min(Number(e.target.value), max - 1);
    onChange(val, max);
  }

  function handleMaxChange(e: React.ChangeEvent<HTMLInputElement>) {
    const val = Math.max(Number(e.target.value), min + 1);
    onChange(min, val);
  }

  const minPct = ((min - ABS_MIN) / (ABS_MAX - ABS_MIN)) * 100;
  const maxPct = ((max - ABS_MIN) / (ABS_MAX - ABS_MIN)) * 100;

  return (
    <div>
      <div className="flex justify-between mb-4">
        <div className="text-center">
          <p
            className="text-2xl font-bold leading-none"
            style={{ color: "oklch(0.6 0.16 22)" }}
          >
            {min}
          </p>
          <p className="text-xs mt-0.5" style={{ color: "oklch(0.55 0.02 50)" }}>
            Min age
          </p>
        </div>
        <div
          className="flex items-center text-sm font-medium"
          style={{ color: "oklch(0.75 0.04 50)" }}
        >
          to
        </div>
        <div className="text-center">
          <p
            className="text-2xl font-bold leading-none"
            style={{ color: "oklch(0.6 0.16 22)" }}
          >
            {max}
            {max === ABS_MAX ? "+" : ""}
          </p>
          <p className="text-xs mt-0.5" style={{ color: "oklch(0.55 0.02 50)" }}>
            Max age
          </p>
        </div>
      </div>

      {/* Track + thumbs */}
      <div className="relative h-6 flex items-center">
        {/* Background track */}
        <div
          className="absolute w-full h-1.5 rounded-full"
          style={{ background: "oklch(0.9 0.01 50)" }}
        />
        {/* Active range highlight */}
        <div
          className="absolute h-1.5 rounded-full"
          style={{
            left: `${minPct}%`,
            right: `${100 - maxPct}%`,
            background: "oklch(0.6 0.16 22)",
          }}
        />

        {/* Min thumb */}
        <input
          type="range"
          min={ABS_MIN}
          max={ABS_MAX}
          value={min}
          onChange={handleMinChange}
          aria-label="Minimum age"
          className="absolute w-full appearance-none bg-transparent cursor-pointer"
          style={{ zIndex: min > ABS_MAX - 5 ? 5 : 3 }}
        />

        {/* Max thumb */}
        <input
          type="range"
          min={ABS_MIN}
          max={ABS_MAX}
          value={max}
          onChange={handleMaxChange}
          aria-label="Maximum age"
          className="absolute w-full appearance-none bg-transparent cursor-pointer"
          style={{ zIndex: 4 }}
        />
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function PreferencesPage() {
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);

  const [prefs, setPrefs] = useState<Preferences>({
    ageMin: 30,
    ageMax: 60,
    maxDistanceMiles: 50,
    hasKids: "no_preference",
    smoking: "no_preference",
  });

  function setField<K extends keyof Preferences>(key: K, value: Preferences[K]) {
    setPrefs((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit() {
    setIsSaving(true);
    try {
      const res = await fetch("/api/profile/preferences", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(prefs),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.error ?? `Failed to save (${res.status})`);
      }

      router.push("/ai-chat");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not save preferences.");
      setIsSaving(false);
    }
  }

  return (
    <div className="flex flex-col gap-6 animate-fade-in-up pt-2">
      {/* Header */}
      <div>
        <h1
          className="text-2xl font-bold mb-1"
          style={{ color: "oklch(0.18 0.04 270)" }}
        >
          Your preferences
        </h1>
        <p className="text-sm" style={{ color: "oklch(0.55 0.02 50)" }}>
          Tell us what you&apos;re looking for. You can always update these later.
        </p>
      </div>

      {/* Age range */}
      <div>
        <SectionLabel>Age range</SectionLabel>
        <Card>
          <AgeRangeSlider
            min={prefs.ageMin}
            max={prefs.ageMax}
            onChange={(min, max) => {
              setField("ageMin", min);
              setField("ageMax", max);
            }}
          />
        </Card>
      </div>

      {/* Max distance */}
      <div>
        <SectionLabel>Maximum distance</SectionLabel>
        <Card>
          <div className="flex flex-wrap gap-2">
            {DISTANCE_OPTIONS.map((d) => (
              <Chip
                key={d}
                selected={prefs.maxDistanceMiles === d}
                onClick={() => setField("maxDistanceMiles", d)}
              >
                {d} miles
              </Chip>
            ))}
          </div>
        </Card>
      </div>

      {/* Children */}
      <div>
        <SectionLabel>Has children</SectionLabel>
        <Card>
          <p
            className="text-xs mb-3"
            style={{ color: "oklch(0.55 0.02 50)" }}
          >
            What do you prefer in a potential partner?
          </p>
          <div className="flex flex-wrap gap-2">
            {(
              [
                { value: "has_kids", label: "Has kids" },
                { value: "no_kids", label: "Doesn't have kids" },
                { value: "no_preference", label: "No preference" },
              ] as { value: HasKids; label: string }[]
            ).map(({ value, label }) => (
              <Chip
                key={value}
                selected={prefs.hasKids === value}
                onClick={() => setField("hasKids", value)}
              >
                {label}
              </Chip>
            ))}
          </div>
        </Card>
      </div>

      {/* Smoking */}
      <div>
        <SectionLabel>Smoking</SectionLabel>
        <Card>
          <div className="flex flex-wrap gap-2">
            {(
              [
                { value: "non_smoker_preferred", label: "Non-smoker preferred" },
                { value: "open", label: "Open to it" },
                { value: "no_preference", label: "No preference" },
              ] as { value: Smoking; label: string }[]
            ).map(({ value, label }) => (
              <Chip
                key={value}
                selected={prefs.smoking === value}
                onClick={() => setField("smoking", value)}
              >
                {label}
              </Chip>
            ))}
          </div>
        </Card>
      </div>

      {/* CTA */}
      <div className="flex flex-col gap-3 mt-auto pt-2">
        <Button
          size="lg"
          disabled={isSaving}
          onClick={handleSubmit}
          className="w-full h-14 rounded-2xl font-semibold text-base gap-2"
          style={{
            background: "oklch(0.6 0.16 22)",
            boxShadow: "0 4px 20px oklch(0.6 0.16 22 / 0.35)",
          }}
        >
          {isSaving ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
              Saving…
            </>
          ) : (
            <>
              Continue
              <ArrowRight className="w-5 h-5" aria-hidden="true" />
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
