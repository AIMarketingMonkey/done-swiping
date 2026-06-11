import Link from "next/link";
import { Heart } from "lucide-react";

const STEPS = [
  { number: 1, label: "Welcome" },
  { number: 2, label: "Photos" },
  { number: 3, label: "Preferences" },
  { number: 4, label: "AI Chat" },
  { number: 5, label: "Review" },
] as const;

// Derive the current step from the pathname (done server-side via a wrapper
// component so the layout itself stays a Server Component).
import { headers } from "next/headers";

function getCurrentStep(): number {
  const headersList = headers();
  const pathname = headersList.get("x-pathname") ?? "";

  if (pathname.includes("/photos")) return 2;
  if (pathname.includes("/preferences")) return 3;
  if (pathname.includes("/ai-chat")) return 4;
  if (pathname.includes("/profile-review")) return 5;
  return 1; // welcome (default)
}

export default function OnboardingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const currentStep = getCurrentStep();
  const currentStepData = STEPS.find((s) => s.number === currentStep) ?? STEPS[0];

  return (
    <div className="app-shell min-h-screen gradient-warm flex flex-col">
      {/* Top bar */}
      <header className="flex-shrink-0 px-5 pt-8 pb-4">
        {/* Logo */}
        <Link
          href="/"
          className="flex items-center gap-2 mb-5 group w-fit"
          aria-label="Done Swiping — home"
        >
          <div
            className="flex items-center justify-center w-8 h-8 rounded-lg transition-transform group-hover:scale-105"
            style={{ background: "oklch(0.6 0.16 22)" }}
          >
            <Heart className="w-4 h-4 text-white fill-white" aria-hidden="true" />
          </div>
          <span
            className="text-base font-bold"
            style={{ color: "oklch(0.18 0.04 270)" }}
          >
            Done Swiping
          </span>
        </Link>

        {/* Step progress */}
        <div aria-label={`Step ${currentStep} of ${STEPS.length}: ${currentStepData.label}`}>
          {/* Step dots */}
          <div className="flex items-center gap-1.5 mb-2.5" role="list">
            {STEPS.map((step) => {
              const isDone = step.number < currentStep;
              const isActive = step.number === currentStep;
              return (
                <div
                  key={step.number}
                  role="listitem"
                  aria-current={isActive ? "step" : undefined}
                  className="flex-1 h-1.5 rounded-full transition-all duration-300"
                  style={{
                    background: isDone
                      ? "oklch(0.6 0.16 22)"
                      : isActive
                      ? "oklch(0.72 0.14 22)"
                      : "oklch(0.88 0.012 50)",
                  }}
                />
              );
            })}
          </div>

          {/* Step label */}
          <div className="flex items-center justify-between">
            <p
              className="text-xs font-semibold uppercase tracking-wider"
              style={{ color: "oklch(0.6 0.16 22)" }}
            >
              Step {currentStep} of {STEPS.length}
            </p>
            <p
              className="text-xs font-medium"
              style={{ color: "oklch(0.55 0.02 50)" }}
            >
              {currentStepData.label}
            </p>
          </div>
        </div>
      </header>

      {/* Page content */}
      <main className="flex-1 flex flex-col px-5 pb-10">
        {children}
      </main>
    </div>
  );
}
