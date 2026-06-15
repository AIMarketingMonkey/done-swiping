import Link from "next/link";
import { Heart, Sparkles, Users, ArrowRight, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function LandingPage() {
  return (
    <div className="app-shell">
      {/* Hero Section */}
      <section className="gradient-hero min-h-screen flex flex-col items-center justify-between px-6 py-10 relative overflow-hidden">
        {/* Decorative background orbs */}
        <div
          className="absolute top-[-80px] right-[-60px] w-[280px] h-[280px] rounded-full opacity-20 pointer-events-none"
          style={{
            background:
              "radial-gradient(circle, oklch(0.75 0.12 60), transparent)",
          }}
          aria-hidden="true"
        />
        <div
          className="absolute bottom-[120px] left-[-80px] w-[240px] h-[240px] rounded-full opacity-15 pointer-events-none"
          style={{
            background:
              "radial-gradient(circle, oklch(0.6 0.16 22), transparent)",
          }}
          aria-hidden="true"
        />

        {/* Logo + Name */}
        <div className="w-full flex flex-col items-center pt-8 animate-fade-in-up">
          <div className="flex items-center justify-center w-16 h-16 rounded-2xl mb-4"
            style={{ background: "oklch(0.6 0.16 22 / 0.3)", backdropFilter: "blur(8px)", border: "1px solid oklch(1 0 0 / 0.2)" }}>
            <Heart className="w-8 h-8 text-white fill-white" aria-hidden="true" />
          </div>
          <p className="text-white/70 text-sm font-medium tracking-[0.2em] uppercase mb-2">
            Introducing
          </p>
          <h1 className="text-4xl font-bold text-white text-center leading-tight">
            Done Swiping
          </h1>
        </div>

        {/* Tagline + Value Props */}
        <div className="flex-1 flex flex-col items-center justify-center w-full max-w-sm mx-auto gap-8 py-10">
          <div className="text-center animate-fade-in-up" style={{ animationDelay: "0.1s" }}>
            <p className="text-white/90 text-xl font-medium leading-relaxed">
              For people who are done swiping,
              <br />
              <span className="text-white font-semibold">but not done with love.</span>
            </p>
          </div>

          {/* Value Propositions */}
          <div className="w-full flex flex-col gap-3 animate-fade-in-up" style={{ animationDelay: "0.2s" }}>
            {[
              {
                icon: Sparkles,
                title: "Deep AI Profiles",
                desc: "Know who someone really is before you ever meet.",
              },
              {
                icon: Users,
                title: "Real Compatibility",
                desc: "Matched on values, life stage, and what you actually want.",
              },
              {
                icon: Heart,
                title: "No Endless Swiping",
                desc: "A curated handful of meaningful connections — not thousands.",
              },
            ].map(({ icon: Icon, title, desc }) => (
              <div
                key={title}
                className="flex items-start gap-4 rounded-2xl px-4 py-3"
                style={{
                  background: "oklch(1 0 0 / 0.1)",
                  backdropFilter: "blur(8px)",
                  border: "1px solid oklch(1 0 0 / 0.15)",
                }}
              >
                <div className="flex-shrink-0 w-9 h-9 rounded-xl flex items-center justify-center"
                  style={{ background: "oklch(0.6 0.16 22 / 0.4)" }}>
                  <Icon className="w-4 h-4 text-white" aria-hidden="true" />
                </div>
                <div>
                  <p className="text-white font-semibold text-sm">{title}</p>
                  <p className="text-white/70 text-xs mt-0.5 leading-relaxed">{desc}</p>
                </div>
              </div>
            ))}
          </div>

          {/* CTA Buttons */}
          <div className="w-full flex flex-col gap-3 animate-fade-in-up" style={{ animationDelay: "0.3s" }}>
            <Button
              asChild
              size="lg"
              className="w-full h-14 text-base font-semibold rounded-2xl shadow-lg"
              style={{
                background: "oklch(0.6 0.16 22)",
                boxShadow: "0 4px 24px oklch(0.6 0.16 22 / 0.5)",
              }}
            >
              <Link href="/signup" className="flex items-center justify-center gap-2">
                Create your profile
                <ArrowRight className="w-5 h-5" aria-hidden="true" />
              </Link>
            </Button>

            <Button
              asChild
              variant="outline"
              size="lg"
              className="w-full h-14 text-base font-semibold rounded-2xl"
              style={{
                background: "oklch(1 0 0 / 0.12)",
                backdropFilter: "blur(8px)",
                border: "1px solid oklch(1 0 0 / 0.3)",
                color: "white",
              }}
            >
              <Link href="/login">Sign in / Sign up</Link>
            </Button>
          </div>
        </div>

        {/* Privacy Footer */}
        <div className="w-full flex flex-col items-center gap-2 animate-fade-in-up" style={{ animationDelay: "0.4s" }}>
          <div className="flex items-center gap-1.5 text-white/60 text-xs">
            <Shield className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Your data is private, encrypted, and never sold.</span>
          </div>
          <p className="text-white/40 text-xs text-center">
            By continuing, you agree to our{" "}
            <Link href="/terms" className="underline underline-offset-2 hover:text-white/60 transition-colors">
              Terms
            </Link>{" "}
            and{" "}
            <Link href="/privacy" className="underline underline-offset-2 hover:text-white/60 transition-colors">
              Privacy Policy
            </Link>
          </p>
        </div>
      </section>
    </div>
  );
}
