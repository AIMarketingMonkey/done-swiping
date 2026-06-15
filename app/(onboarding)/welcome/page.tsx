import { redirect } from "next/navigation";
import Link from "next/link";
import { Camera, SlidersHorizontal, MessageCircleHeart, Star, ArrowRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/server";

// ── Ahead-steps preview ───────────────────────────────────────────────────────

const AHEAD_STEPS = [
  {
    icon: Camera,
    label: "Add photos",
    description: "Put your best face forward",
  },
  {
    icon: SlidersHorizontal,
    label: "Set preferences",
    description: "Who you're looking for",
  },
  {
    icon: MessageCircleHeart,
    label: "Chat with Sage",
    description: "Your AI dating coach",
  },
  {
    icon: Star,
    label: "Review profile",
    description: "Approve before going live",
  },
] as const;

// ── Page ──────────────────────────────────────────────────────────────────────

export default async function WelcomePage() {
  const supabase = await createClient();

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    redirect("/login");
  }

  // Prefer display_name from user_metadata, fall back to email local-part
  const rawName =
    (user.user_metadata?.full_name as string | undefined) ??
    (user.user_metadata?.name as string | undefined) ??
    user.email?.split("@")[0] ??
    "there";

  // Capitalise the first name only
  const firstName = rawName.split(" ")[0];
  const displayName =
    firstName.charAt(0).toUpperCase() + firstName.slice(1).toLowerCase();

  return (
    <div className="flex flex-col gap-6 animate-fade-in-up pt-2">
      {/* Greeting card */}
      <div
        className="rounded-3xl p-6"
        style={{
          background: "oklch(1 0 0)",
          boxShadow: "0 4px 24px oklch(0.18 0.04 270 / 0.08)",
        }}
      >
        {/* Sparkle badge */}
        <div
          className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold mb-4"
          style={{
            background: "oklch(0.97 0.02 30)",
            color: "oklch(0.6 0.16 22)",
          }}
        >
          <Sparkles className="w-3.5 h-3.5" aria-hidden="true" />
          Your journey starts here
        </div>

        <h1
          className="text-3xl font-bold mb-2 leading-tight"
          style={{ color: "oklch(0.18 0.04 270)" }}
        >
          Hi {displayName}!
        </h1>
        <p
          className="text-base leading-relaxed mb-1"
          style={{ color: "oklch(0.55 0.02 50)" }}
        >
          We&apos;re so glad you&apos;re here. <em>Done Swiping</em> is built
          for people who want something real — not another swipe session.
        </p>
        <p
          className="text-base leading-relaxed"
          style={{ color: "oklch(0.55 0.02 50)" }}
        >
          In the next few minutes, our AI dating coach <strong>Sage</strong>{" "}
          will have a genuine conversation with you — learning who you are,
          what you&apos;ve been through, and exactly the kind of love
          you&apos;re looking for.
        </p>
      </div>

      {/* How it works */}
      <div>
        <p
          className="text-xs font-semibold uppercase tracking-wider mb-3"
          style={{ color: "oklch(0.6 0.16 22)" }}
        >
          What happens next
        </p>

        <div className="flex flex-col gap-3">
          {AHEAD_STEPS.map((step, idx) => {
            const Icon = step.icon;
            return (
              <div
                key={step.label}
                className="flex items-center gap-4 rounded-2xl px-4 py-3.5"
                style={{
                  background: "oklch(1 0 0)",
                  boxShadow: "0 2px 8px oklch(0.18 0.04 270 / 0.06)",
                }}
              >
                {/* Step number + icon */}
                <div className="relative flex-shrink-0">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center"
                    style={{ background: "oklch(0.97 0.02 30)" }}
                  >
                    <Icon
                      className="w-5 h-5"
                      style={{ color: "oklch(0.6 0.16 22)" }}
                      aria-hidden="true"
                    />
                  </div>
                  <span
                    className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold text-white"
                    style={{ background: "oklch(0.6 0.16 22)" }}
                    aria-hidden="true"
                  >
                    {idx + 2}
                  </span>
                </div>

                <div>
                  <p
                    className="text-sm font-semibold leading-none mb-0.5"
                    style={{ color: "oklch(0.18 0.04 270)" }}
                  >
                    {step.label}
                  </p>
                  <p
                    className="text-xs"
                    style={{ color: "oklch(0.55 0.02 50)" }}
                  >
                    {step.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Reassurance copy */}
      <p
        className="text-sm text-center px-2 leading-relaxed"
        style={{ color: "oklch(0.65 0.02 50)" }}
      >
        This takes about 5&nbsp;minutes. You can pause and come back any time —
        we save your progress automatically.
      </p>

      {/* CTA */}
      <Link href="/photos" className="block">
        <Button
          size="lg"
          className="w-full h-14 rounded-2xl font-semibold text-base gap-2"
          style={{
            background: "oklch(0.6 0.16 22)",
            boxShadow: "0 4px 20px oklch(0.6 0.16 22 / 0.38)",
          }}
        >
          Let&apos;s get started
          <ArrowRight className="w-5 h-5" aria-hidden="true" />
        </Button>
      </Link>
    </div>
  );
}
